import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SmartSuggestionsRequest, SmartSuggestion, Appointment, TimeSlot, SuggestionContext } from '@/lib/smart-booking/types'
import { calculateSlotScore, groupSlotsByPeriod, shuffleTopScores, filterAvailableSlots } from '@/lib/smart-booking/scoring'
import { generateTimeSlots, getDayOfWeek } from '@/lib/smart-booking/utils'

// Use Service Role for backend operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

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

        // 1. Get existing appointments for the day
        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('id, date, start_time, end_time, status, patient_id, professional_id')
            .eq('professional_id', professionalId)
            .eq('date', date)
            .neq('status', 'Cancelado')
            .order('start_time', { ascending: true })

        if (aptError) {
            console.error('Error fetching appointments:', aptError)
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch appointments'
            }, { status: 500 })
        }

        // 2. Get professional schedule for this day of week
        const dayOfWeek = getDayOfWeek(date)
        const { data: schedules, error: schedError } = await supabase
            .from('professional_schedules')
            .select('start_time, end_time, interval_minutes')
            .eq('professional_id', professionalId)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)

        if (schedError || !schedules || schedules.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Professional schedule not found for this day'
            }, { status: 404 })
        }

        const schedule = schedules[0]

        // 3. Get service duration
        const { data: service } = await supabase
            .from('services')
            .select('duration')
            .eq('id', serviceId)
            .single()

        const serviceDuration = service?.duration || 60

        // 4. Get patient history if patientId provided
        let patientHistory: Appointment[] = []
        if (patientId) {
            const { data: history } = await supabase
                .from('appointments')
                .select('id, date, start_time, end_time, status, patient_id, professional_id')
                .eq('patient_id', patientId)
                .eq('status', 'Concluído')
                .order('date', { ascending: false })
                .limit(10)

            patientHistory = history || []
        }

        // 5. Generate all possible time slots
        const allTimeSlots = generateTimeSlots(
            schedule.start_time,
            schedule.end_time,
            schedule.interval_minutes || 60
        )

        // 6. Filter available slots (no overlaps)
        const availableSlots = filterAvailableSlots(
            allTimeSlots,
            appointments || [],
            date,
            serviceDuration
        )

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
            existingAppointments: appointments || [],
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
        const morningSuggestion = shuffleTopScores(morningSlots, 3)
        const afternoonSuggestion = shuffleTopScores(afternoonSlots, 3)

        // 10. Get alternative slots (top 8 overall, excluding selected ones)
        const selectedTimes = [
            morningSuggestion?.time,
            afternoonSuggestion?.time
        ].filter(Boolean)

        const alternatives = scoredSlots
            .filter(slot => !selectedTimes.includes(slot.time))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)

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
