
import { createClient } from "@supabase/supabase-js"
import { getWhatsappConfig, sendMessage } from '@/app/dashboard/[slug]/settings/communication/actions'
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startStr = tomorrow.toISOString().split('T')[0] + 'T00:00:00'
    const endStr = tomorrow.toISOString().split('T')[0] + 'T23:59:59'

    // Fetch appointments for tomorrow
    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            id, start_time, organization_id,
            patients (id, name, phone),
            profiles (full_name),
            services (name),
            locations (name, address)
        `)
        .gte('start_time', startStr)
        .lte('start_time', endStr)
        .neq('status', 'cancelled')

    if (!appointments || appointments.length === 0) {
        return NextResponse.json({ message: "No appointments for tomorrow" })
    }

    // Group by Organization
    const appointmentsByOrg: Record<string, any[]> = {}
    appointments.forEach(app => {
        if (!app.organization_id) return
        if (!appointmentsByOrg[app.organization_id]) appointmentsByOrg[app.organization_id] = []
        appointmentsByOrg[app.organization_id].push(app)
    })

    let sentCount = 0
    let skippedCount = 0

    // Process each Organization
    for (const orgId of Object.keys(appointmentsByOrg)) {
        // Fetch Config for this Org directly
        const { data: integration } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('organization_id', orgId)
            .eq('provider', 'zapi')
            .eq('is_active', true)
            .single()

        const config = integration?.config
        if (!config || !config.instanceId || !config.token) {
            console.log(`[Reminders] Skipping Org ${orgId}: No active WhatsApp config`)
            continue
        }

        // Fetch Template for this Org
        const { data: template } = await supabase
            .from('message_templates')
            .select('*')
            .eq('organization_id', orgId)
            .eq('trigger_type', 'appointment_reminder')
            .eq('is_active', true)
            .single()

        if (!template) {
            console.log(`[Reminders] Skipping Org ${orgId}: No active reminder template`)
            continue
        }

        // Process Appointments for this Org
        for (const appt of appointmentsByOrg[orgId]) {
            const patient: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
            const profile: any = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles
            const service: any = Array.isArray(appt.services) ? appt.services[0] : appt.services
            const location: any = Array.isArray(appt.locations) ? appt.locations[0] : appt.locations

            if (!patient?.phone) continue

            // Check if already sent (Log check)
            const { data: existingLog } = await supabase
                .from('message_logs')
                .select('id')
                .eq('template_id', template.id)
                .eq('phone', patient.phone.replace(/\D/g, ''))
                .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00')
                .single()

            if (existingLog) {
                skippedCount++
                continue
            }

            // Prepare Message
            const patientName = patient.name.split(' ')[0]
            const dateStr = new Date(appt.start_time).toLocaleDateString('pt-BR')
            const timeStr = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

            const messageText = template.content
                .replace(/{{paciente}}/g, patientName)
                .replace(/{{data}}/g, dateStr)
                .replace(/{{horario}}/g, timeStr)
                .replace(/{{profissional}}/g, profile?.full_name || 'Profissional')
                .replace(/{{servico}}/g, service?.name || 'Atendimento')
                .replace(/{{local}}/g, location?.name || 'Clínica')
                .replace(/{{endereco}}/g, location?.address || '')

            // Send
            const result = await sendMessage(patient.phone, messageText, config) // Pass explicit config

            if (result.success) {
                await supabase.from('message_logs').insert({
                    organization_id: orgId,
                    template_id: template.id,
                    phone: patient.phone.replace(/\D/g, ''),
                    content: messageText,
                    status: 'sent'
                })
                sentCount++
            } else {
                console.error(`[Reminders] Failed to send to ${patient.phone}:`, result.error)
            }
        }
    }

    return NextResponse.json({ processed: appointments.length, sent: sentCount, skipped: skippedCount })
}
