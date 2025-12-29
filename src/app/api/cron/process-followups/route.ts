
import { createAdminClient } from '@/lib/supabase/server' // Use Admin Client
import { NextResponse } from 'next/server'
import { getWhatsappConfig, sendMessage } from '@/app/dashboard/settings/communication/actions'

// NOTE: in Vercel/NextJS, this route can be triggered via a GET request.
export async function GET(request: Request) {
    // 1. Initialize Admin Client (Bypass RLS)
    const supabase = await createAdminClient()

    // 2. Fetch Config using Admin Client
    const config = await getWhatsappConfig(supabase)

    if (!config) {
        return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 500 })
    }

    // 3. Fetch pending follow-ups (Manual Join to avoid Cache Issues)
    const now = new Date().toISOString()

    // A. Fetch Follow-ups Raw
    console.log(`[Cron] Checking for followups LTE ${now}`)
    const { data: followupsRaw, error } = await supabase
        .from('assessment_follow_ups')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_date', now)
        .limit(20)

    console.log(`[Cron] Found ${followupsRaw?.length || 0} items. Error: ${error?.message}`)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!followupsRaw || followupsRaw.length === 0) {
        return NextResponse.json({ message: 'No pending follow-ups due' })
    }

    // B. Fetch Related Patients
    const patientIds = followupsRaw.map(f => f.patient_id)
    const { data: patients } = await supabase
        .from('patients')
        .select('id, name, phone')
        .in('id', patientIds)

    // C. Fetch Related Templates
    const templateIds = followupsRaw.map(f => f.template_id).filter(Boolean)
    const { data: templates } = await supabase
        .from('message_templates')
        .select('id, content')
        .in('id', templateIds)

    // D. Merge Data
    const followups = followupsRaw.map(item => ({
        ...item,
        patient: patients?.find((p: any) => p.id === item.patient_id),
        template: templates?.find((t: any) => t.id === item.template_id)
    }))

    const results = []

    if (followups && followups.length > 0) {
        for (const item of followups) {
            try {
                // A. Construct Message
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
                const link = `${baseUrl}/avaliacao/${item.token}`
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
                    if (item.type === 'insoles_40d') templateTitle = 'Acompanhamento de Palmilhas (40 dias)'
                    if (item.type === 'insoles_1y') templateTitle = 'Renovação de Palmilhas (1 ano)'
                    messageText = `Olá ${patientName}, por favor preencha o *${templateTitle}* clicando aqui:\n\n${link}`
                }

                if (!phone) {
                    await supabase.from('assessment_follow_ups').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', item.id)
                    results.push({ id: item.id, status: 'failed', reason: 'No phone number' })
                    continue
                }

                // B. Send using Shared Logic (Injecting Config)
                const sendResult = await sendMessage(phone, messageText, config)

                // C. Update Database
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

    // 4. PROCESS CAMPAIGN MESSAGES (Using Admin Client too)
    const { data: campaignMsgs } = await supabase
        .from('campaign_messages')
        .select('id, phone, content, campaign_id')
        .eq('status', 'pending')
        .limit(30)

    const campaignResults = []

    if (campaignMsgs && campaignMsgs.length > 0) {
        for (const msg of campaignMsgs) {
            try {
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
