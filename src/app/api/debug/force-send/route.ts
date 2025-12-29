
import { createClient } from "@supabase/supabase-js"
import { getWhatsappConfig, sendAppointmentMessage } from '@/app/dashboard/settings/communication/actions'
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'confirmation', 'feedback', 'all'
    const days = Number(searchParams.get('days') || 7) // Look back/forward days
    const force = searchParams.get('force') === 'true' // Ignore specific checks? (Use with caution)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseKey) {
        return NextResponse.json({ error: "Config Error: SUPABASE_SERVICE_ROLE_KEY is missing." })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const config = await getWhatsappConfig()
    if (!config) return NextResponse.json({ error: "WhatsApp not configured" })

    const results = {
        confirmation: { processed: 0, sent: 0, errors: [] as string[] },
        feedback: { processed: 0, sent: 0, errors: [] as string[] }
    }

    // 1. CONFIRMATIONS (Future Appointments)
    if (type === 'confirmation' || type === 'all') {
        const now = new Date()
        // Default: Look at all future appointments from now until infinity (or limit)
        // Actually, let's just look at the next 30 days to be safe/sane
        const limitDate = new Date()
        limitDate.setDate(limitDate.getDate() + 30)

        const { data: futureAppts } = await supabase
            .from('appointments')
            .select('id, start_time, patients(phone)')
            .gte('start_time', now.toISOString())
            .lte('start_time', limitDate.toISOString())
            .neq('status', 'cancelled')
            .neq('status', 'completed')

        if (futureAppts) {
            results.confirmation.processed = futureAppts.length

            // Fetch Confirmation Template ID
            const { data: tmpl } = await supabase.from('message_templates').select('id').eq('trigger_type', 'appointment_confirmation').single()

            for (const appt of futureAppts) {
                // Fix: Supabase join returns array or object. Force generic type to handle it.
                const patient: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients

                if (!patient?.phone) continue

                // Check if sent
                if (tmpl && !force) {
                    const phone = patient.phone.replace(/\D/g, '')
                    const { data: log } = await supabase.from('message_logs')
                        .select('id')
                        .eq('template_id', tmpl.id)
                        .eq('phone', phone)
                        // Ideally checking against appointment ID logic if we had it, but fuzzy date check + phone + template is proxy
                        // For confirmations, we just check if ANY confirmation was sent to this phone recently? No, that's bad.
                        // Let's rely on the helper `sendAppointmentMessage` to just send it.
                        // BUT we want to avoid double sending if we run this script twice.
                        // Let's check if log exists created > appointment creation time? 
                        // Simplified: Check if log exists in last 24h for this template and phone.
                        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                        .single()

                    if (log) continue
                }

                const res = await sendAppointmentMessage(appt.id, 'confirmation', supabase)
                if (res.success) {
                    results.confirmation.sent++
                } else {
                    // @ts-ignore
                    results.confirmation.errors.push(`ID ${appt.id}: ${res.error}`)
                }
            }
        }
    }

    // 2. FEEDBACK (Past Completed Appointments)
    if (type === 'feedback' || type === 'all') {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - days) // Look back X days

        const { data: pastAppts } = await supabase
            .from('appointments')
            .select('id, end_time, patients(phone)')
            .eq('status', 'completed')
            .gte('end_time', start.toISOString())
            .lte('end_time', end.toISOString())

        if (pastAppts) {
            results.feedback.processed = pastAppts.length

            // Fetch Feedback Template ID
            const { data: tmpl } = await supabase.from('message_templates').select('id').eq('trigger_type', 'post_attendance').single()

            for (const appt of pastAppts) {
                const patient: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients

                if (!patient?.phone) continue

                // Check if sent
                if (tmpl && !force) {
                    const phone = patient.phone.replace(/\D/g, '')
                    const { data: log } = await supabase.from('message_logs')
                        .select('id')
                        .eq('template_id', tmpl.id)
                        .eq('phone', phone)
                        .gte('created_at', start.toISOString()) // Sent in the window we are looking at
                        .single()

                    if (log) continue
                }

                const res = await sendAppointmentMessage(appt.id, 'feedback', supabase)
                if (res.success) {
                    results.feedback.sent++
                    // @ts-ignore
                    results.feedback.errors.push(`ID ${appt.id}: Sent using '${res.usedTemplate}'`)
                }
                else {
                    // @ts-ignore
                    results.feedback.errors.push(`ID ${appt.id}: ${res.error}`)
                }
            }
        }
    }

    return NextResponse.json(results)
}
