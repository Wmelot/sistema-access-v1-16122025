
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getWhatsappConfig } from '@/app/dashboard/settings/communication/actions'

// NOTE: in Vercel/NextJS, this route can be triggered via a GET request.
// You might want to protect it with a secret key header in production to avoid abuse.
export async function GET(request: Request) {
    const supabase = await createClient()

    // 1. Fetch pending follow-ups that are due
    const now = new Date().toISOString()
    const { data: followups, error } = await supabase
        .from('assessment_follow_ups')
        .select(`
            *,
            patient:patients(name, phone),
            template:form_templates(title, type) 
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .limit(20) // Process in batches to avoid timeouts

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!followups || followups.length === 0) {
        return NextResponse.json({ message: 'No pending follow-ups due' })
    }

    const config = await getWhatsappConfig()

    // Quick validation
    if (!config) {
        return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 500 })
    }

    const results = []

    for (const item of followups) {
        try {
            // A. Construct the Message
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
            const link = `${baseUrl}/avaliacao/${item.link_token}`

            // Build the text
            const patientName = item.patient?.name?.split(' ')[0] || 'Paciente'
            const templateTitle = item.template?.title || item.questionnaire_type?.toUpperCase() || 'Avaliação'

            let messageText = item.custom_message
                ? `${item.custom_message}\n\nLink: ${link}`
                : `Olá ${patientName}, por favor preencha a avaliação *${templateTitle}* clicando aqui:\n\n${link}`

            const phone = item.patient?.phone

            if (!phone) {
                // Mark as failed if no phone
                await supabase.from('assessment_follow_ups').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', item.id)
                results.push({ id: item.id, status: 'failed', reason: 'No phone number' })
                continue
            }

            // B. Prepare the Phone Number
            let cleanPhone = phone.replace(/\D/g, '')
            if (cleanPhone.length <= 11) {
                cleanPhone = '55' + cleanPhone
            }

            // Test Mode Safety
            let destinationNumber = cleanPhone
            if (config.testMode?.isActive) {
                if (config.testMode.safeNumber) {
                    destinationNumber = config.testMode.safeNumber.replace(/\D/g, '')
                    messageText = `[TESTE FollowUp] Original: ${cleanPhone}\n\n${messageText}`
                }
            }

            // C. Send via Provider
            let sent = false
            let responseData = null

            if (config.provider === 'zapi' && config.zapi) {
                const { instanceId, token, clientToken } = config.zapi
                const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(clientToken ? { 'Client-Token': clientToken } : {})
                    },
                    body: JSON.stringify({ phone: destinationNumber, message: messageText })
                })
                responseData = await res.json()
                if (res.ok) sent = true
            }
            else if (config.provider === 'evolution' && config.evolution) {
                const { url, apiKey, instanceName } = config.evolution
                const baseUrl = url.replace(/\/$/, "")
                const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
                    body: JSON.stringify({ number: destinationNumber, text: messageText })
                })
                responseData = await res.json()
                if (res.ok) sent = true
            }

            // D. Update Status
            if (sent) {
                await supabase
                    .from('assessment_follow_ups')
                    .update({ status: 'sent', updated_at: new Date().toISOString() })
                    .eq('id', item.id)

                // Optional: Log to message_logs if you want a centralized log, but follow_ups table is already a log.

                results.push({ id: item.id, status: 'sent', provider_id: responseData?.id || responseData?.key?.id })
            } else {
                await supabase
                    .from('assessment_follow_ups')
                    .update({ status: 'failed', updated_at: new Date().toISOString() })
                    .eq('id', item.id)
                results.push({ id: item.id, status: 'failed', error: responseData })
            }

        } catch (err: any) {
            console.error(`Error processing followup ${item.id}:`, err)
            await supabase.from('assessment_follow_ups').update({ status: 'failed' }).eq('id', item.id)
            results.push({ id: item.id, status: 'failed', error: err.message })
        }
    }

    return NextResponse.json({ processed: results.length, details: results })
}
