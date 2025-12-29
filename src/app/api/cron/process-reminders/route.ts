
import { createClient } from "@supabase/supabase-js"
import { getWhatsappConfig, sendMessage } from '@/app/dashboard/settings/communication/actions'
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // Service Role for Cron
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch Config
    const config = await getWhatsappConfig()
    if (!config) return NextResponse.json({ error: "No config" })

    // 2. Fetch Template
    const { data: template } = await supabase
        .from('message_templates')
        .select('*')
        .eq('trigger_type', 'appointment_reminder')
        .eq('is_active', true)
        .single()

    if (!template) return NextResponse.json({ message: "No active reminder template" })

    // 3. Find Appointments for Tomorrow (Between 24h and 48h from now, roughly)
    // Or exactly "tomorrow". Let's look for appointments starting between 24h from now and end of that day.

    // Simplification: Look for appointments starting tomorrow (in Brazil time)
    // Actually, user standard is "24h before".
    // Let's grab all appointments scheduled for TOMORROW.
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startStr = tomorrow.toISOString().split('T')[0] + 'T00:00:00'
    const endStr = tomorrow.toISOString().split('T')[0] + 'T23:59:59'

    // We need a way to know if we already sent.
    // Since we don't have a flag yet, we check message_logs
    // Querying logs inside the loop is slow but safe for now.

    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            id, start_time,
            patients (id, name, phone),
            profiles (full_name),
            services (name),
            locations (name, address)
        `)
        .gte('start_time', startStr) // >= Tomorrow 00:00
        .lte('start_time', endStr)   // <= Tomorrow 23:59
        .neq('status', 'cancelled')

    if (!appointments || appointments.length === 0) {
        return NextResponse.json({ message: "No appointments for tomorrow" })
    }

    let sentCount = 0

    for (const appt of appointments) {
        if (!appt.patients?.phone) continue

        // Check if already sent
        const { data: existingLog } = await supabase
            .from('message_logs')
            .select('id')
            .eq('template_id', template.id)
            .eq('phone', appt.patients.phone.replace(/\D/g, ''))
            // Fuzzy check: sent in the last 20 hours? 
            // Better: use specific appointment ID in context if possible, but template standard doesn't have it.
            // For now, check if created > today 00:00
            .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00')
            .single()

        if (existingLog) continue // Already sent today

        // Send
        const patientName = appt.patients.name.split(' ')[0]
        const dateStr = new Date(appt.start_time).toLocaleDateString('pt-BR')
        const timeStr = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

        const messageText = template.content
            .replace(/{{paciente}}/g, patientName)
            .replace(/{{data}}/g, dateStr)
            .replace(/{{horario}}/g, timeStr)
            .replace(/{{profissional}}/g, appt.profiles?.full_name || 'Profissional')
            .replace(/{{servico}}/g, appt.services?.name || 'Atendimento')
            .replace(/{{local}}/g, appt.locations?.name || 'Clínica')
            .replace(/{{endereco}}/g, appt.locations?.address || '')

        // Helper does internal logging
        await sendMessage(appt.patients.phone, messageText, config)

        // Manual Log Insert (since sendMessage doesn't link to template automatically if called directly without context)
        // We should insert the log here to prevent double sending
        await supabase.from('message_logs').insert({
            template_id: template.id,
            phone: appt.patients.phone.replace(/\D/g, ''),
            content: messageText,
            status: 'sent'
        })

        sentCount++
    }

    return NextResponse.json({ processed: appointments.length, sent: sentCount })
}
