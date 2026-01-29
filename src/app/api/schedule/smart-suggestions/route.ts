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
            .select('id, start_time, end_time, status, patient_id, professional_id, type')
            .or(`professional_id.eq.${professionalId},and(professional_id.is.null,type.eq.block)`)
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

        // 2.5. Strict Lead Time Check (Advance Booking)
        if (minAdvanceDays > 0) {
            const now = new Date();
            // In Brazil Time (simple check for API)
            const today = new Date(now.getTime() - (3 * 60 * 60 * 1000));
            today.setHours(0, 0, 0, 0);

            const reqDate = new Date(date + 'T12:00:00');
            const diffTime = reqDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= minAdvanceDays) {
                console.log(`[API] Blocking date ${date} for pro ${professionalId}: ${diffDays} < ${minAdvanceDays}`);
                return NextResponse.json({
                    success: true,
                    data: { date, morning: null, afternoon: null, alternativeSlots: [] },
                    error: `Respeite a antecedência mínima de ${minAdvanceDays} dias.`
                })
            }
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

        // [IMPROVED] Grid Logic - Prefer optimized slots but ALWAYS fallback to showing something
        // The goal is to compact the schedule, but NEVER hide availability when slots exist
        let gridFilteredSlots = availableSlots

        if (isLongService) {
            // Prefer Long Services (>=30m) at "clean" marks (:00, :30) or anchors
            const preferredSlots = availableSlots.filter(s => {
                const mins = parseTimeToMinutes(s.time)
                const isRound = mins % 60 === 0 || mins % 30 === 0
                const isAnchor = anchorTimes.includes(s.time)
                return isRound || isAnchor
            })
            // Use preferred if available, otherwise show ALL slots
            if (preferredSlots.length > 0) {
                gridFilteredSlots = preferredSlots
            }
        } else if (isDelivery) {
            // Prefer Delivery (<=20m) at "sobras" (:45, :15 marks)
            const preferredSlots = availableSlots.filter(s => {
                const mins = parseTimeToMinutes(s.time)
                const isSobra = mins % 60 === 45 || mins % 60 === 15 || mins % 30 === 15
                const isAnchor = anchorTimes.includes(s.time)
                return isSobra || isAnchor
            })
            // Use preferred if available, otherwise show ALL slots
            if (preferredSlots.length > 0) {
                gridFilteredSlots = preferredSlots
            }
        }

        // Always use the best available option
        availableSlots = gridFilteredSlots

        // 5. [GAP-FILLING PRIORITY] Score slots based on proximity to existing appointments
        // Goal: Fill gaps in the schedule first, avoid long empty periods

        interface ScoredSlot {
            time: string
            score: number
            reason: string
        }

        const scoredSlots: ScoredSlot[] = availableSlots.map(slot => {
            const slotMinutes = parseTimeToMinutes(slot.time)
            const slotEndMinutes = slotMinutes + serviceDuration

            let score = 0
            let reason = ''

            // Check distance to nearest appointment before and after
            let minDistanceBefore = Infinity
            let minDistanceAfter = Infinity

            for (const apt of typedAppointments) {
                const aptStart = parseTimeToMinutes(apt.start_time)
                const aptEnd = parseTimeToMinutes(apt.end_time)

                // Distance to appointment ending before this slot
                if (aptEnd <= slotMinutes) {
                    const distance = slotMinutes - aptEnd
                    minDistanceBefore = Math.min(minDistanceBefore, distance)
                }

                // Distance to appointment starting after this slot
                if (aptStart >= slotEndMinutes) {
                    const distance = aptStart - slotEndMinutes
                    minDistanceAfter = Math.min(minDistanceAfter, distance)
                }
            }

            // SCORING LOGIC:
            // 1. BEST: Slot fills a gap (has appointments before AND after) - HIGHEST PRIORITY
            if (minDistanceBefore !== Infinity && minDistanceAfter !== Infinity) {
                // The smaller the gap, the better (we want to fill tight spaces)
                const totalGap = minDistanceBefore + minDistanceAfter
                score = 1000 - totalGap // Inverse: smaller gaps = higher score
                reason = 'Preenche buraco na agenda'
            }
            // 2. GOOD: Slot is adjacent to an existing appointment (within 30 min)
            else if (minDistanceBefore <= 30 || minDistanceAfter <= 30) {
                score = 500 - Math.min(minDistanceBefore, minDistanceAfter)
                reason = 'Próximo a outro atendimento'
            }
            // 3. OK: Slot matches anchor times (8:00, 14:00, etc.)
            else if ((anchorTimes as string[]).includes(slot.time)) {
                score = 300
                reason = 'Horário âncora'
            }
            // 4. FALLBACK: Isolated slot (no nearby appointments)
            else {
                // Add a small random jitter (±5) to avoid deterministic "same slots every time" for empty days
                const jitter = Math.floor(Math.random() * 11) - 5;
                // Prefer earlier times over later times slightly, but allow jitter to dominate
                score = 100 - (slotMinutes / 20) + jitter;
                reason = 'Horário isolado';
            }

            return { time: slot.time, score, reason }
        })

        // Sort by score (highest first)
        scoredSlots.sort((a, b) => b.score - a.score)

        // 6. [IMPROVED] Selection Logic - Buckets & Randomization
        // Goal: Avoid deterministic "empty" looking days. Show anchors + random neighbors.
        // Lead Time Logic: 
        // - < 7 days: 2 slots
        // - 7 to 21 days: 4 slots
        // - > 21 days: 6-8 slots

        let selectedTimes: string[] = []

        if (smartMode === 'open') {
            selectedTimes = scoredSlots.map(s => s.time)
        } else {
            // Determine quantity based on distance to date
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const target = new Date(date + 'T12:00:00')
            target.setHours(0, 0, 0, 0)
            const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            let maxSlots = 6;
            if (diffDays < 7) maxSlots = 2;
            else if (diffDays <= 21) maxSlots = 4;
            else maxSlots = 6;

            // Bucket-based selection for variety
            const morning = scoredSlots.filter(s => parseTimeToMinutes(s.time) < 720) // Before 12:00
            const afternoonEarly = scoredSlots.filter(s => parseTimeToMinutes(s.time) >= 720 && parseTimeToMinutes(s.time) < 960) // 12:00 - 16:00
            const afternoonLate = scoredSlots.filter(s => parseTimeToMinutes(s.time) >= 960) // After 16:00

            const pickRandomFromBucket = (bucket: ScoredSlot[], count: number) => {
                if (bucket.length === 0) return []
                // Prioritize top scores but add variety
                const sorted = [...bucket].sort((a, b) => b.score - a.score)
                const topPicks = sorted.slice(0, Math.min(bucket.length, count + 2))
                return topPicks.sort(() => Math.random() - 0.5).slice(0, count).map(s => s.time)
            }

            // Distribute pick count based on maxSlots
            const perBucket = Math.ceil(maxSlots / 3)

            selectedTimes = [
                ...pickRandomFromBucket(morning, perBucket),
                ...pickRandomFromBucket(afternoonEarly, perBucket),
                ...pickRandomFromBucket(afternoonLate, perBucket)
            ]

            // Ensure anchors are represented if available and not already picked
            // But only if we haven't reached maxSlots or if distance allowed it
            for (const anchor of anchorTimes) {
                if (availableSlots.some(s => s.time === anchor) && !selectedTimes.includes(anchor)) {
                    if (selectedTimes.length < maxSlots) {
                        selectedTimes.push(anchor)
                    }
                }
            }

            // Trim to maxSlots if randomization overflowed
            if (selectedTimes.length > maxSlots) {
                selectedTimes = selectedTimes.sort(() => Math.random() - 0.5).slice(0, maxSlots)
            }

            // CRITICAL: If randomization resulted in NO slots but we HAVE availability, show everything up to maxSlots
            if (selectedTimes.length === 0 && availableSlots.length > 0) {
                selectedTimes = availableSlots.slice(0, maxSlots).map(s => s.time)
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
