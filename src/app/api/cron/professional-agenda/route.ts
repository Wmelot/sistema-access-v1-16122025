
import { createClient } from "@supabase/supabase-js"
import { sendMessage } from '@/app/dashboard/[slug]/settings/communication/actions'
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    const startStr = dateStr + 'T00:00:00'
    const endStr = dateStr + 'T23:59:59'

    // 1. Fetch professionals with setting enabled
    const { data: professionals } = await supabase
        .from('profiles')
        .select('id, full_name, phone, organization_id')
        .eq('receive_daily_agenda_whatsapp', true)
        .not('phone', 'is', null)

    if (!professionals || professionals.length === 0) {
        return NextResponse.json({ message: "No professionals opted in for daily agenda" })
    }

    let sentCount = 0

    // 2. Process each Professional
    for (const prof of professionals) {
        // Fetch appointments for this professional tomorrow
        const { data: appts } = await supabase
            .from('appointments')
            .select(`
                start_time,
                patients (name),
                services (name)
            `)
            .eq('professional_id', prof.id)
            .gte('start_time', startStr)
            .lte('start_time', endStr)
            .neq('status', 'cancelled')
            .order('start_time')

        if (!appts || appts.length === 0) continue

        // 3. Fetch WhatsApp Config for Org
        const { data: integration } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('organization_id', prof.organization_id)
            .eq('provider', 'zapi')
            .eq('is_active', true)
            .single()

        const config = integration?.config
        if (!config || !config.instanceId || !config.token) continue

        // 4. Build Summary Message
        const dateDisplay = tomorrow.toLocaleDateString('pt-BR')
        let messageText = `📅 *Sua Agenda de Amanhã (${dateDisplay})*\n\n`

        appts.forEach((appt: any) => {
            const time = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
            const patientName = Array.isArray(appt.patients) ? appt.patients[0]?.name : appt.patients?.name
            const serviceName = Array.isArray(appt.services) ? appt.services[0]?.name : appt.services?.name
            messageText += `⏰ *${time}* - ${patientName} (${serviceName})\n`
        })

        messageText += `\nBoa noite e um excelente dia de trabalho!`

        // 5. Send to Professional
        const result = await sendMessage(prof.phone, messageText, config)

        if (result.success) {
            sentCount++
        }
    }

    return NextResponse.json({ professionals_notified: sentCount })
}
