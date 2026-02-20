
import { createClient } from "@supabase/supabase-js"
import { getWhatsappConfig, sendMessage } from '@/app/dashboard/[slug]/settings/communication/actions'
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            id, end_time, status, organization_id,
            patients (id, name, phone),
            profiles (full_name)
        `)
        .eq('status', 'completed')
        .gte('end_time', yesterday.toISOString())
        .lte('end_time', now.toISOString())

    if (!appointments || appointments.length === 0) {
        return NextResponse.json({ message: "No completed appointments recently" })
    }

    // Group by Org
    const appointmentsByOrg: Record<string, any[]> = {}
    appointments.forEach(app => {
        if (!app.organization_id) return
        if (!appointmentsByOrg[app.organization_id]) appointmentsByOrg[app.organization_id] = []
        appointmentsByOrg[app.organization_id].push(app)
    })

    let sentCount = 0
    let skippedCount = 0

    // Process each Org
    for (const orgId of Object.keys(appointmentsByOrg)) {
        // Config
        const { data: integration } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('organization_id', orgId)
            .eq('provider', 'zapi')
            .eq('is_active', true)
            .single()

        const config = integration?.config
        if (!config || !config.instanceId || !config.token) continue

        // Settings (for google link)
        const { data: settings } = await supabase
            .from('clinic_settings')
            .select('google_review_url')
            .eq('id', orgId)
            .single()
        const googleLink = settings?.google_review_url || 'https://g.page/r/CZFUQUQVoZs8JEBM/review'

        // Template
        const { data: template } = await supabase
            .from('message_templates')
            .select('*')
            .eq('organization_id', orgId)
            .eq('trigger_type', 'post_attendance')
            .eq('is_active', true)
            .single()

        if (!template) continue

        for (const appt of appointmentsByOrg[orgId]) {
            const patient: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
            const profile: any = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles

            if (!patient?.phone) continue

            // [COOLDOWN CHECK] Ensure we don't spam feedback requests.
            // Minimum 6 months (180 days) between feedback requests.
            const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
            const { data: existingLog } = await supabase
                .from('message_logs')
                .select('id')
                .eq('template_id', template.id)
                .eq('phone', patient.phone.replace(/\D/g, ''))
                .gte('created_at', sixMonthsAgo.toISOString())
                .maybeSingle()

            if (existingLog) {
                skippedCount++
                continue
            }

            const patientName = patient.name.split(' ')[0]
            const messageText = template.content
                .replace(/{{paciente}}/g, patientName)
                .replace(/{{profissional}}/g, profile?.full_name || 'Profissional')
                .replace(/{{link_avaliacao}}/g, googleLink)

            const result = await sendMessage(patient.phone, messageText, config)

            if (result.success) {
                await supabase.from('message_logs').insert({
                    organization_id: orgId,
                    template_id: template.id,
                    phone: patient.phone.replace(/\D/g, ''),
                    content: messageText,
                    status: 'sent'
                })
                sentCount++
            }
        }
    }

    return NextResponse.json({ processed: appointments.length, sent: sentCount, skipped: skippedCount })
}
