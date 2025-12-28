
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getWhatsappConfig } from '@/app/dashboard/settings/communication/actions'

// NOTE: in Vercel/NextJS, this route can be triggered via a GET request.
export async function GET(request: Request) {
    const supabase = await createClient()

    // 1. Fetch pending follow-ups that are due
    const now = new Date().toISOString()
    const { data: followups, error } = await supabase
        .from('assessment_follow_ups')
        .select(`
            *,
            patient:patients(name, phone),
            template:message_templates(content)
        `)
        .eq('status', 'pending')
        .lte('scheduled_date', now)
        .limit(20) // Process in batches

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
            const link = `${baseUrl}/avaliacao/${item.token}`
            const patientName = item.patient?.name?.split(' ')[0] || 'Paciente'
            const phone = item.patient?.phone

            let messageText = ""

            // NEW: Use Template Content if available
            if (item.template?.content) {
                messageText = item.template.content
                    .replace(/{{paciente}}/g, patientName)
                    .replace(/{{link_avaliacao}}/g, link)
                    .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
                    .replace(/{{medico}}/g, "Equipe Access") // Generic fallback
            }
            // FALLBACK: Hardcoded Logic (Legacy)
            else {
                let templateTitle = 'Avaliação'
                if (item.type === 'insoles_40d') templateTitle = 'Acompanhamento de Palmilhas (40 dias)'
                if (item.type === 'insoles_1y') templateTitle = 'Renovação de Palmilhas (1 ano)'

                messageText = `Olá ${patientName}, por favor preencha o *${templateTitle}* clicando aqui:\n\n${link}`
            }

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
                    .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                    .eq('id', item.id)

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

    // ... (Processed Follow-ups)

    // 2. PROCESS CAMPAIGN MESSAGES (NEW)
    const { data: campaignMsgs } = await supabase
        .from('campaign_messages')
        .select(`
            id, 
            phone, 
            content, 
            campaign_id
        `)
        .eq('status', 'pending')
        .limit(30) // Batch size for campaigns

    const campaignResults = []

    if (campaignMsgs && campaignMsgs.length > 0) {
        console.log(`[Cron] Processing ${campaignMsgs.length} campaign messages...`)

        for (const msg of campaignMsgs) {
            try {
                // Update status to processing (to avoid double send if overlapping runs)
                await supabase.from('campaign_messages').update({ status: 'processing' }).eq('id', msg.id)

                const phone = msg.phone
                let cleanPhone = phone.replace(/\D/g, '')
                if (cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone

                // Test Mode
                let dest = cleanPhone
                let text = msg.content
                if (config.testMode?.isActive) {
                    if (config.testMode.safeNumber) {
                        dest = config.testMode.safeNumber.replace(/\D/g, '')
                        text = `[TESTE Campanha] Para: ${cleanPhone}\n\n${msg.content}`
                    }
                }

                // Send Logic (Reusable block effectively)
                let sent = false
                let responseData = null

                if (config.provider === 'zapi' && config.zapi) {
                    const { instanceId, token, clientToken } = config.zapi
                    const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(clientToken ? { 'Client-Token': clientToken } : {}) },
                        body: JSON.stringify({ phone: dest, message: text })
                    })
                    responseData = await res.json()
                    if (res.ok) sent = true
                } else if (config.provider === 'evolution' && config.evolution) {
                    const { url, apiKey, instanceName } = config.evolution
                    const baseUrl = url.replace(/\/$/, "")
                    const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
                        body: JSON.stringify({ number: dest, text: text })
                    })
                    responseData = await res.json()
                    if (res.ok) sent = true
                }

                // Update Status & Counters
                if (sent) {
                    await supabase.from('campaign_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', msg.id)
                    // Increment Campaign Counter (RPC or simple get/update, RPC is safer but simple update ok for low volume)
                    await supabase.rpc('increment_campaign_sent', { campaign_uuid: msg.campaign_id })
                    campaignResults.push({ id: msg.id, status: 'sent' })
                } else {
                    await supabase.from('campaign_messages').update({ status: 'failed', error_message: JSON.stringify(responseData) }).eq('id', msg.id)
                    await supabase.rpc('increment_campaign_failed', { campaign_uuid: msg.campaign_id })
                    campaignResults.push({ id: msg.id, status: 'failed' })
                }

            } catch (err: any) {
                console.error(`[Cron] Campaign msg error ${msg.id}:`, err)
                await supabase.from('campaign_messages').update({ status: 'failed', error_message: err.message }).eq('id', msg.id)
                await supabase.rpc('increment_campaign_failed', { campaign_uuid: msg.campaign_id })
                campaignResults.push({ id: msg.id, status: 'failed', error: err.message })
            }
        }
    }

    return NextResponse.json({
        followups_processed: results.length,
        campaign_msgs_processed: campaignResults.length,
        details: { followups: results, campaigns: campaignResults }
    })
}
