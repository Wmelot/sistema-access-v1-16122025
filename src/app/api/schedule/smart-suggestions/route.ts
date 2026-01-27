import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SmartSuggestionsRequest, SmartSuggestion, Appointment, TimeSlot, SuggestionContext } from '@/lib/smart-booking/types'
import { calculateSlotScore, groupSlotsByPeriod, shuffleTopScores, filterAvailableSlots } from '@/lib/smart-booking/scoring'
import { generateTimeSlots, getDayOfWeek } from '@/lib/smart-booking/utils'

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
            .select('id, start_time, end_time, status, patient_id, professional_id') // removed 'date'
            .eq('professional_id', professionalId)
            .gte('start_time', dayStart)
            .lte('end_time', dayEnd)
            .neq('status', 'Cancelado')
            .order('start_time', { ascending: true })

        if (aptError) {
            console.error('Error fetching appointments:', aptError)
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch appointments'
            }, { status: 500 })
        }

        // Map Appointments to match interface (add date derived from start_time)
        const typedAppointments: Appointment[] = (appointments || []).map(appt => ({
            ...appt,
            date: appt.start_time.split('T')[0]
        }))

        // 2. Get professional availability (Standard Table)
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
                data: {
                    date,
                    morning: null,
                    afternoon: null,
                    alternativeSlots: []
                }
            })
        }

        // Get Slot Interval and Smart Mode from Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('slot_interval, smart_scheduling_mode, anchor_times')
            .eq('id', professionalId)
            .single()

        const interval = profile?.slot_interval || 30
        const smartMode = profile?.smart_scheduling_mode || 'open'
        const anchorTimes = profile?.anchor_times || ['08:00', '14:00']

        // 3. Get service duration
        const { data: service } = await supabase
            .from('services')
            .select('duration')
            .eq('id', serviceId)
            .single()

        const serviceDuration = service?.duration || 60

        // 4. Get patient history (kept same)
        let patientHistory: Appointment[] = []
        if (patientId) {
            const { data: history } = await supabase
                .from('appointments')
                .select('id, start_time, end_time, status, patient_id, professional_id')
                .eq('patient_id', patientId)
                .eq('status', 'Concluído')
                .order('start_time', { ascending: false }) // fixed sort col
                .limit(10)
            patientHistory = (history || []).map(h => ({
                ...h,
                date: h.start_time.split('T')[0]
            }))
        }

        // 5. Generate all possible time slots (Handling MULTIPLE BLOCKS)
        let allAvailableSlots: TimeSlot[] = []

        for (const block of availabilities) {
            const blockSlots = generateTimeSlots(
                block.start_time,
                block.end_time,
                interval
            )

            const filtered = filterAvailableSlots(
                blockSlots,
                typedAppointments,
                date,
                serviceDuration
            )
            allAvailableSlots = [...allAvailableSlots, ...filtered]
        }

        // Remove duplicates if blocks overlap (unlikely but safe) (simple dedup by time)
        const uniqueSlotsMap = new Map()
        allAvailableSlots.forEach(s => uniqueSlotsMap.set(s.time, s))
        const availableSlots = Array.from(uniqueSlotsMap.values()).sort((a, b) => a.time.localeCompare(b.time))

        if (availableSlots.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    date,
                    morning: null,
                    afternoon: null,
                    alternativeSlots: []
                }
            })
        }

        // 7. Calculate scores for all available slots
        const context: SuggestionContext = {
            professionalId,
            serviceId,
            date,
            existingAppointments: typedAppointments,
            patientHistory,
            serviceDuration
        }

        const scoredSlots = availableSlots.map(slot => {
            calculateSlotScore(slot, context)
            return slot
        })

        // 8. Group by morning and afternoon
        const { morning: morningSlots, afternoon: afternoonSlots } = groupSlotsByPeriod(scoredSlots)

        // 9. Select best slot from each period (with shuffle for variety)
        // [MODIFIED] If mode is optimized, boost anchors
        if (smartMode !== 'open') {
            scoredSlots.forEach(slot => {
                if (anchorTimes.includes(slot.time)) {
                    slot.score += 100 // Huge boost for anchors!
                    slot.reasons.push('Horário Âncora')
                }
            })
        }

        const morningSuggestion = shuffleTopScores(morningSlots, 3)
        const afternoonSuggestion = shuffleTopScores(afternoonSlots, 3)

        // 10. Get alternative slots
        const selectedTimes = [
            morningSuggestion?.time,
            afternoonSuggestion?.time
        ].filter(Boolean)

        // [MODIFIED] If day is empty and mode is optimized, limit alternatives severely
        const isDayEmpty = typedAppointments.length === 0
        let alternativeLimit = 8
        if (smartMode !== 'open' && isDayEmpty) {
            alternativeLimit = 0 // Only show the 2 recommended ones if day is empty and optimized
        } else if (smartMode === 'strict') {
            alternativeLimit = 2 // Very few alternatives for strict mode
        }

        const alternatives = alternativeLimit > 0
            ? scoredSlots
                .filter(slot => !selectedTimes.includes(slot.time))
                .sort((a, b) => b.score - a.score)
                .slice(0, alternativeLimit)
            : []

        const suggestion: SmartSuggestion = {
            date,
            morning: morningSuggestion,
            afternoon: afternoonSuggestion,
            alternativeSlots: alternatives
        }

        return NextResponse.json({
            success: true,
            data: suggestion
        })

    } catch (error: any) {
        console.error('Smart suggestions error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: 'Smart Booking Suggestions API',
        version: '1.0.0'
    })
}
