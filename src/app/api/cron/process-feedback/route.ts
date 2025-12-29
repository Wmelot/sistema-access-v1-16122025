
import { createClient } from "@supabase/supabase-js"
import { getWhatsappConfig, sendMessage } from '@/app/dashboard/settings/communication/actions'
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const config = await getWhatsappConfig()
    if (!config) return NextResponse.json({ error: "No config" })

    const { data: template } = await supabase
        .from('message_templates')
        .select('*')
        .eq('trigger_type', 'post_attendance')
        .eq('is_active', true)
        .single()

    if (!template) return NextResponse.json({ message: "No feedback template" })

    // Find appointments completed in the last 24h
    // status = 'completed' (or 'attended' depending on implementation, usually 'completed' or 'scheduled' -> 'completed'?)
    // Checking internal status. Actually usually 'sent' check.
    // Let's fetching appointments ended in the last 24 hours.

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            id, end_time, status,
            patients (id, name, phone),
            profiles (full_name)
        `)
        .eq('status', 'completed') // Assuming 'completed' is the status for attended
        .gte('end_time', yesterday.toISOString())
        .lte('end_time', now.toISOString())

    if (!appointments || appointments.length === 0) {
        return NextResponse.json({ message: "No completed appointments recently" })
    }

    let sentCount = 0

    for (const appt of appointments) {
        const patient: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
        const profile: any = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles

        if (!patient?.phone) continue

        // Check logs to avoid double send
        const { data: existingLog } = await supabase
            .from('message_logs')
            .select('id')
            .eq('template_id', template.id)
            .eq('phone', patient.phone.replace(/\D/g, ''))
            .gte('created_at', yesterday.toISOString()) // Sent recently?
            .single()

        if (existingLog) continue

        const patientName = patient.name.split(' ')[0]

        const messageText = template.content
            .replace(/{{paciente}}/g, patientName)
            .replace(/{{profissional}}/g, profile?.full_name || 'Profissional')
            .replace(/{{link_avaliacao}}/g, 'https://g.page/r/YOUR_GOOGLE_LINK/review') // Placeholder or config

        await sendMessage(patient.phone, messageText, config)

        await supabase.from('message_logs').insert({
            template_id: template.id,
            phone: patient.phone.replace(/\D/g, ''),
            content: messageText,
            status: 'sent'
        })

        sentCount++
    }

    return NextResponse.json({ processed: appointments.length, sent: sentCount })
}
