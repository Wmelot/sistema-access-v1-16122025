import { createAdminClient } from "@/lib/supabase/server"
import { sendAppointmentMessage } from "@/app/dashboard/[slug]/settings/communication/actions"
import { NextResponse } from "next/server"

// IMPORTANT: This route should be protected by a CRON_SECRET or similar in production
export async function GET(request: Request) {
    const supabase = await createAdminClient()
    const now = new Date()

    // Window Settings
    const START_HOUR = 6 // Widen window for testing (Original was 8)
    const END_HOUR = 23 // Widen window for testing (Original was 20)
    const currentHour = now.getHours()

    // 1. Fetch Active Appointments for the next 48h
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            *,
            organizations!inner(slug)
        `)
        .eq('status', 'scheduled') // Only active/scheduled ones
        .gte('start_time', now.toISOString())
        .lte('start_time', fortyEightHoursFromNow.toISOString())

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: any[] = []

    for (const appt of (appointments || [])) {
        const startTime = new Date(appt.start_time)
        const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        const isConfirmed = appt.status === 'confirmed'
        const slug = (appt.organizations as any)?.slug

        let triggerToSend: string | null = null

        // --- CALC LOGIC BASED ON YOUR RULES ---

        // 24h Before (Unconfirmed)
        if (diffInHours <= 24 && diffInHours > 23 && !isConfirmed) {
            triggerToSend = 'appointment_confirmation'
        }
        // 12h Before (Questionnaire) - 12h windows
        else if (diffInHours <= 12 && diffInHours > 11) {
            triggerToSend = 'questionnaire_12h'
        }
        // 8h Before (Unconfirmed)
        else if (diffInHours <= 8 && diffInHours > 7 && !isConfirmed) {
            triggerToSend = 'appointment_confirmation_8h'
        }
        // 2h Before (Confirmed)
        else if (diffInHours <= 4 && diffInHours > 0 && isConfirmed) { // Widen window
            triggerToSend = 'appointment_reminder_confirmed_2h'
        }
        // 2h Before (Unconfirmed)
        else if (diffInHours <= 4 && diffInHours > 0 && !isConfirmed) { // Widen window
            triggerToSend = 'appointment_confirmation_2h'
        }

        if (triggerToSend) {
            // Check if already sent in this trigger cycle
            const { data: alreadySent } = await supabase
                .from('message_logs')
                .select('id')
                .eq('appointment_id', appt.id)
                .eq('trigger_type', triggerToSend)
                .eq('status', 'sent')
                .maybeSingle()

            if (alreadySent) {
                console.log(`[Cron] Trigger ${triggerToSend} already sent for Appt ${appt.id}`)
                continue
            }

            // --- GOLDEN RULE: Respect Sleep Window ---
            if (currentHour < START_HOUR || currentHour >= END_HOUR) {
                console.log(`[Cron] Skipping trigger ${triggerToSend} for Appt ${appt.id} due to sleep window (${currentHour}h)`)
                continue
            }

            // SEND!
            try {
                // Pass appointment_id in logs to prevent duplicates
                const res = await sendAppointmentMessage(appt.id, triggerToSend as any, slug, supabase)

                // Track the trigger in logs (we might need to ensure the column exists or use metadata)
                // Assuming message_logs has appointment_id and trigger_type
                // If not, we'll need to add them or use a JSON field.

                results.push({ apptId: appt.id, trigger: triggerToSend, status: res.success ? 'success' : 'failed' })
            } catch (err: any) {
                console.error(`[Cron] Failed to send ${triggerToSend} for ${appt.id}:`, err)
            }
        }
    }

    return NextResponse.json({
        processed: (appointments || []).length,
        results
    })
}
