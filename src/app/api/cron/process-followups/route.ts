
import { createAdminClient } from '@/lib/supabase/server' // Use Admin Client
import { NextResponse } from 'next/server'
import { sendMessage } from '@/app/dashboard/[slug]/settings/communication/actions'

// NOTE: in Vercel/NextJS, this route can be triggered via a GET request.
// NOTE: in Vercel/NextJS, this route can be triggered via a GET request.
export async function GET(request: Request) {
    // 1. Initialize Admin Client (Bypass RLS)
    const supabase = await createAdminClient()

    // 2. Fetch pending follow-ups
    const now = new Date().toISOString()
    console.log(`[Cron] Checking for followups LTE ${now}`)

    const { data: followupsRaw, error } = await supabase
        .from('assessment_follow_ups')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_date', now)
        .limit(20)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Prepare Config Map (Multi-tenant)
    const orgIds = new Set<string>()
    followupsRaw?.forEach(f => {
        if (f.organization_id) orgIds.add(f.organization_id)
    })

    // Also fetch campaigns to gather their org IDs
    const { data: campaignMsgs } = await supabase
        .from('campaign_messages')
        .select('id, phone, content, campaign_id, organization_id')
        .eq('status', 'pending')
        .limit(30)

    campaignMsgs?.forEach(m => {
        if (m.organization_id) orgIds.add(m.organization_id)
    })

    const configMap: Record<string, any> = {}

    if (orgIds.size > 0) {
        const { data: integrations } = await supabase
            .from('api_integrations')
            .select('*')
            .in('organization_id', Array.from(orgIds))
            .in('key', ['evolution_api_token', 'evolution_instance_name', 'zapi_instance_id', 'zapi_token', 'whatsapp_service', 'wa_test_mode'])

        integrations?.forEach(integration => {
            const orgId = integration.organization_id
            if (!configMap[orgId]) configMap[orgId] = { service: 'evolution' } // Default

            if (integration.key === 'whatsapp_service') configMap[orgId].service = integration.value
            if (integration.key === 'evolution_api_token') configMap[orgId].evolution_token = integration.value
            if (integration.key === 'evolution_instance_name') configMap[orgId].evolution_instance = integration.value
            if (integration.key === 'zapi_instance_id') configMap[orgId].zapi_instance = integration.value
            if (integration.key === 'zapi_token') configMap[orgId].zapi_token = integration.value
            if (integration.key === 'wa_test_mode') configMap[orgId].test_mode = integration.value === 'true'
        })
    }

    const results = []

    // 4. Process Follow-ups
    if (followupsRaw && followupsRaw.length > 0) {
        // Fetch extra data
        const patientIds = followupsRaw.map(f => f.patient_id)
        const { data: patients } = await supabase.from('patients').select('id, name, phone, organization_id').in('id', patientIds)

        const templateIds = followupsRaw.map(f => f.template_id).filter(Boolean)
        const { data: templates } = await supabase.from('message_templates').select('id, content').in('id', templateIds)

        const followups = followupsRaw.map(item => ({
            ...item,
            patient: patients?.find((p: any) => p.id === item.patient_id),
            template: templates?.find((t: any) => t.id === item.template_id)
        }))

        for (const item of followups) {
            try {
                // Determine Org ID (Header Item or Patient)
                const orgId = item.organization_id || item.patient?.organization_id
                const config = orgId ? configMap[orgId] : null

                if (!config) {
                    results.push({ id: item.id, status: 'failed', reason: 'No WhatsApp Config for Organization' })
                    continue
                }

                // A. Construct Message
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
                const link = `${baseUrl}/avaliacao/${item.link_token}`
                const patientName = item.patient?.name?.split(' ')[0] || 'Paciente'
                const phone = item.patient?.phone

                let messageText = ""

                if (item.template?.content) {
                    messageText = item.template.content
                        .replace(/{{paciente}}/g, patientName)
                        .replace(/{{link_avaliacao}}/g, link)
                        .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
                        .replace(/{{medico}}/g, "Equipe Access")
                } else {
                    let templateTitle = 'Avaliação'
                    if (item.questionnaire_type === 'insoles_40d') templateTitle = 'Acompanhamento de Palmilhas (40 dias)'
                    if (item.questionnaire_type === 'insoles_1y') templateTitle = 'Renovação de Palmilhas (1 ano)'
                    messageText = `Olá ${patientName}, por favor preencha o *${templateTitle}* clicando aqui:\n\n${link}`
                }

                if (!phone) {
                    await supabase.from('assessment_follow_ups').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', item.id)
                    results.push({ id: item.id, status: 'failed', reason: 'No phone number' })
                    continue
                }

                // B. Send using Shared Logic (Injecting Config)
                const sendResult = await sendMessage(phone, messageText, config)

                // ... Handle result (Success/Fail) -> same as before
                if (sendResult.success) {
                    await supabase
                        .from('assessment_follow_ups')
                        .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                        .eq('id', item.id)
                    results.push({ id: item.id, status: 'sent' })
                } else {
                    await supabase
                        .from('assessment_follow_ups')
                        .update({ status: 'failed', updated_at: new Date().toISOString() })
                        .eq('id', item.id)
                    results.push({ id: item.id, status: 'failed', error: sendResult.error })
                }

            } catch (err: any) {
                console.error(`Error processing followup ${item.id}:`, err)
                results.push({ id: item.id, status: 'failed', error: err.message })
            }
        }
    }

    // 5. PROCESS CAMPAIGN MESSAGES (Multi-tenant)
    const campaignResults = []

    if (campaignMsgs && campaignMsgs.length > 0) {
        for (const msg of campaignMsgs) {
            try {
                const orgId = msg.organization_id
                const config = orgId ? configMap[orgId] : null

                if (!config) {
                    campaignResults.push({ id: msg.id, status: 'failed', error: 'No WhatsApp Config for Organization' })
                    continue
                }

                await supabase.from('campaign_messages').update({ status: 'processing' }).eq('id', msg.id)

                const sendResult = await sendMessage(msg.phone, msg.content, config)

                if (sendResult.success) {
                    await supabase.from('campaign_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', msg.id)
                    await supabase.rpc('increment_campaign_sent', { campaign_uuid: msg.campaign_id })
                    campaignResults.push({ id: msg.id, status: 'sent' })
                } else {
                    await supabase.from('campaign_messages').update({ status: 'failed', error_message: JSON.stringify(sendResult.error) }).eq('id', msg.id)
                    await supabase.rpc('increment_campaign_failed', { campaign_uuid: msg.campaign_id })
                    campaignResults.push({ id: msg.id, status: 'failed' })
                }
            } catch (err: any) {
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
