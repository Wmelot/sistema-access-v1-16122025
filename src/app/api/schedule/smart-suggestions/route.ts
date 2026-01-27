import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SmartSuggestionsRequest, SmartSuggestion, Appointment, TimeSlot, SuggestionContext } from '@/lib/smart-booking/types'
import { calculateSlotScore, groupSlotsByPeriod, shuffleTopScores, filterAvailableSlots } from '@/lib/smart-booking/scoring'
import { generateTimeSlots, getDayOfWeek, parseTimeToMinutes, minutesToTime } from '@/lib/smart-booking/utils'

export async function POST(request: NextRequest) {
    try {
        const body: SmartSuggestionsRequest = await request.json()
        const { professionalId, serviceId, date, patientId } = body

        // Validate required fields
        if (!professionalId || !serviceId || !date) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: professionalId, serviceId, date'
            }, { status: 400 })
        }

        // Initialize Supabase Client (Lazy)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials')
            return NextResponse.json({
                success: false,
                error: 'Configuration error'
            }, { status: 500 })
        }

        const supabase = createClient(
            supabaseUrl,
            supabaseKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Get existing appointments for the day (using Range)
        const dayStart = `${date}T00:00:00-03:00`
        const dayEnd = `${date}T23:59:59-03:00`

        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('id, start_time, end_time, status, patient_id, professional_id')
            .eq('professional_id', professionalId)
            .gte('start_time', dayStart)
            .lte('end_time', dayEnd)
            .order('start_time', { ascending: true })

        if (aptError) {
            console.error('Error fetching appointments:', aptError)
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch appointments'
            }, { status: 500 })
        }

        // Map Appointments and filter cancelled
        const typedAppointments: Appointment[] = (appointments || []).map(appt => ({
            ...appt,
            date: appt.start_time.split('T')[0]
        })).filter(a => a.status?.toLowerCase() !== 'cancelled' && a.status?.toLowerCase() !== 'cancelado')

        // 2. Get professional availability
        const dateObj = new Date(date + 'T12:00:00')
        const dayOfWeek = dateObj.getDay()

        const { data: availabilities, error: availError } = await supabase
            .from('professional_availability')
            .select('start_time, end_time, day_of_week')
            .eq('profile_id', professionalId)
            .eq('day_of_week', dayOfWeek)

        if (availError || !availabilities || availabilities.length === 0) {
            return NextResponse.json({
                success: true,
                data: { date, morning: null, afternoon: null, alternativeSlots: [] }
            })
        }

        // Get Slot Interval and Smart Mode from Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('slot_interval, smart_scheduling_mode, anchor_times, min_advance_booking_days')
            .eq('id', professionalId)
            .single()

        const interval = profile?.slot_interval || 30
        const smartMode = profile?.smart_scheduling_mode || 'open'
        const anchorTimes = profile?.anchor_times || ['08:00', '14:00']
        const minAdvanceDays = profile?.min_advance_booking_days || 0

        // [MODIFIED] Check Antecedência Mínima
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date + 'T00:00:00')
        const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < minAdvanceDays) {
            return NextResponse.json({
                success: true,
                data: { date, morning: null, afternoon: null, alternativeSlots: [], error: 'Antecedência mínima não respeitada' }
            })
        }

        // 3. Get service duration and details
        const { data: service } = await supabase
            .from('services')
            .select('name, duration')
            .eq('id', serviceId)
            .single()

        const serviceDuration = service?.duration || 60
        const serviceName = (service?.name || '').toLowerCase()
        const isDelivery = serviceName.includes('entrega') || serviceDuration <= 20
        const isLongService = serviceDuration >= 30

        // 4. Generate all available slots
        let allAvailableSlots: TimeSlot[] = []
        for (const block of availabilities) {
            const blockSlots = generateTimeSlots(block.start_time, block.end_time, interval)
            const filtered = filterAvailableSlots(blockSlots, typedAppointments, date, serviceDuration)
            allAvailableSlots = [...allAvailableSlots, ...filtered]
        }

        // Dedup and sort
        const uniqueSlotsMap = new Map()
        allAvailableSlots.forEach(s => uniqueSlotsMap.set(s.time, s))
        let availableSlots = Array.from(uniqueSlotsMap.values()).sort((a: any, b: any) => a.time.localeCompare(b.time))

        if (availableSlots.length === 0) {
            return NextResponse.json({
                success: true,
                data: { date, morning: null, afternoon: null, alternativeSlots: [] }
            })
        }

        // [NEW] Grid Logic (Compactador de Horas Inteiras)
        // Adjust available slots based on service type to maximize "sobras"
        let gridFilteredSlots = availableSlots

        if (isLongService) {
            // Offer Long Services (>=30m) at "clean" marks (:00, :30) or anchors
            gridFilteredSlots = availableSlots.filter(s => {
                const mins = parseTimeToMinutes(s.time)
                const isRound = mins % 60 === 0 || mins % 30 === 0
                const isAnchor = anchorTimes.includes(s.time)
                return isRound || isAnchor
            })
        } else if (isDelivery) {
            // Offer Delivery (<=20m) specifically at the "sobras" (:45, :15 marks)
            gridFilteredSlots = availableSlots.filter(s => {
                const mins = parseTimeToMinutes(s.time)
                const isSobra = mins % 60 === 45 || mins % 60 === 15 || mins % 30 === 15
                const isAnchor = anchorTimes.includes(s.time)
                return isSobra || isAnchor
            })
        }

        // Use filtered slots if any match the logic, otherwise fallback to all available
        if (gridFilteredSlots.length > 0) {
            availableSlots = gridFilteredSlots
        }

        // 5. [NEW] Dynamic Anchor Picker (Compactador)
        const selectedTimes: string[] = []
        const typedAnchorTimes = anchorTimes as string[]

        typedAnchorTimes.forEach((anchor: string) => {
            // Find exact or closest
            const exact = availableSlots.find(s => s.time === anchor)
            if (exact) {
                selectedTimes.push(anchor)
            } else if (smartMode !== 'open') {
                // Look for closest "colado"
                const anchorMin = parseTimeToMinutes(anchor)
                // Check up to 4 intervals away (2 hours if 30min)
                for (let i = 1; i <= 4; i++) {
                    const before = minutesToTime(anchorMin - (i * interval))
                    const after = minutesToTime(anchorMin + (i * interval))

                    const beforeSlot = availableSlots.find(s => s.time === before)
                    if (beforeSlot) { selectedTimes.push(before); break; }

                    const afterSlot = availableSlots.find(s => s.time === after)
                    if (afterSlot) { selectedTimes.push(after); break; }
                }
            }
        })

        // 6. [NEW] Add Random Slots (0-2)
        if (smartMode !== 'strict') {
            const remainingSlots = availableSlots.filter(s => !selectedTimes.includes(s.time))
            if (remainingSlots.length > 0) {
                // Consistent "randomness" based on date
                const seed = date.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                const numExtras = seed % 3 // 0, 1, or 2

                for (let i = 0; i < numExtras && remainingSlots.length > 0; i++) {
                    const randomIndex = (seed + i) % remainingSlots.length
                    selectedTimes.push(remainingSlots[randomIndex].time)
                    remainingSlots.splice(randomIndex, 1)
                }
            }
        }

        // Sort chronologically
        selectedTimes.sort((a, b) => a.localeCompare(b))

        // Group into periods for response
        const morningSlots = selectedTimes.filter(t => parseInt(t.split(':')[0]) < 12)
        const afternoonSlots = selectedTimes.filter(t => parseInt(t.split(':')[0]) >= 12)

        const morningResult = morningSlots.length > 0 ? {
            time: morningSlots[0],
            date,
            available: true,
            score: 100,
            reasons: [],
            endTime: '' // dummy
        } : null

        const afternoonResult = afternoonSlots.length > 0 ? {
            time: afternoonSlots[0],
            date,
            available: true,
            score: 100,
            reasons: [],
            endTime: '' // dummy
        } : null

        const alternativeResult = selectedTimes
            .filter(t => t !== morningResult?.time && t !== afternoonResult?.time)
            .map(t => ({
                time: t,
                date,
                available: true,
                score: 50,
                reasons: [],
                endTime: '' // dummy
            }))

        return NextResponse.json({
            success: true,
            data: {
                date,
                morning: morningResult,
                afternoon: afternoonResult,
                alternativeSlots: alternativeResult
            }
        })

    } catch (error: any) {
        console.error('Smart suggestions error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok', version: '2.0.0' })
}
