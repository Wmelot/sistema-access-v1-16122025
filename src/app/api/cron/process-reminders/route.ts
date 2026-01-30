import { createAdminClient } from "@/lib/supabase/server"
import { sendAppointmentMessage } from "@/app/dashboard/[slug]/settings/communication/actions"
import { NextResponse } from "next/server"

// IMPORTANT: This route should be protected by a CRON_SECRET or similar in production
export async function GET(request: Request) {
    const supabase = await createAdminClient()
    const now = new Date()

    // Window Settings (Local Brazil Time)
    const START_HOUR = 8
    const END_HOUR = 21

    // Convert current time to Brazil Hour for the sleep window check
    const currentBrazilHour = Number(new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo'
    }).format(now))

    // 1. Fetch Active Appointments for the next 48h
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            status,
            patient_id,
            organization_id,
            organizations!inner(slug)
        `)
        .eq('status', 'scheduled')
        .gte('start_time', now.toISOString())
        .lte('start_time', fortyEightHoursFromNow.toISOString())

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: any[] = []

    // 2. Process each appointment
    for (const appt of (appointments || [])) {
        const startTime = new Date(appt.start_time)
        const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        const isConfirmed = appt.status === 'confirmed'
        const slug = (appt.organizations as any)?.slug

        // Fetch already sent triggers for this appt to avoid repeats
        const { data: sentLogs } = await supabase
            .from('message_logs')
            .select('trigger_type')
            .eq('appointment_id', appt.id)
            .eq('status', 'sent')

        const sentTriggers = new Set(sentLogs?.map(l => l.trigger_type) || [])

        let triggerToSend: string | null = null

        /** 
         * RULE WATERFALL (Robust Catch-up Logic)
         * We check from closest to furthest, but only if the window is open.
         */

        // 2h Before (High Priority) - Window: 0.5h to 4h
        if (diffInHours <= 4 && diffInHours >= 0.5) {
            const t = isConfirmed ? 'appointment_reminder_confirmed_2h' : 'appointment_confirmation_2h'
            if (!sentTriggers.has(t)) triggerToSend = t
        }
        // 8h Before - Window: 4h to 10h
        else if (diffInHours < 10 && diffInHours > 4 && !isConfirmed) {
            const t = 'appointment_confirmation_8h'
            if (!sentTriggers.has(t)) triggerToSend = t
        }
        // 12h Before (Questionnaire) - Window: 10h to 18h
        else if (diffInHours < 18 && diffInHours >= 10) {
            const t = 'questionnaire_12h'
            if (!sentTriggers.has(t)) triggerToSend = t
        }
        // 24h Before - Window: 18h to 36h
        else if (diffInHours < 36 && diffInHours >= 18 && !isConfirmed) {
            const t = 'appointment_confirmation'
            if (!sentTriggers.has(t)) triggerToSend = t
        }

        if (triggerToSend) {
            // --- GOLDEN RULE: Respect Sleep Window ---
            if (currentBrazilHour < START_HOUR || currentBrazilHour >= END_HOUR) {
                console.log(`[Cron] Sleeping. Skipping ${triggerToSend} for Appt ${appt.id} (Brazil Hour: ${currentBrazilHour})`)
                continue
            }

            // SEND!
            try {
                console.log(`[Cron] Sending ${triggerToSend} for Appointment ${appt.id}`)
                const res = await sendAppointmentMessage(appt.id, triggerToSend as any, slug, supabase) as any
                results.push({ apptId: appt.id, trigger: triggerToSend, status: res.success ? 'success' : 'failed', error: res.error })
            } catch (err: any) {
                console.error(`[Cron] Execution error for ${triggerToSend}/${appt.id}:`, err)
                results.push({ apptId: appt.id, trigger: triggerToSend, status: 'error', error: err.message })
            }
        }
    }

    return NextResponse.json({
        processed: (appointments || []).length,
        timestamp: now.toISOString(),
        brazilHour: currentBrazilHour,
        results
    })
}
