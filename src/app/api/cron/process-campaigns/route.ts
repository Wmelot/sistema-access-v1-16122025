
import { createClient } from "@supabase/supabase-js"
import { getWhatsappConfig } from "@/app/dashboard/settings/communication/actions"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // Force use of Service Role to bypass RLS/Auth context for Cron Jobs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch PENDING messages (Limit 6 per run to match "6 per minute" promise/safe rate)
    const { data: messages, error } = await supabase
        .from('campaign_messages')
        .select(`
            id,
            phone,
            content,
            campaign_id
        `)
        .eq('status', 'pending')
        .limit(6)

    if (error || !messages || messages.length === 0) {
        return NextResponse.json({ processed: 0, message: "No pending messages" })
    }

    // 2. Fetch Config
    const config = await getWhatsappConfig()

    // ALLOW SIMULATION if provider missing
    if (!config || (!config.zapi && !config.evolution)) {
        console.warn("No provider configured. Entering SIMULATION mode for local testing.")
    }

    let successCount = 0
    let failureCount = 0

    const errors = []

    // 3. Process each message
    for (const msg of messages) {
        try {
            await processMessage(msg, config, supabase)
            successCount++
        } catch (e: any) {
            console.error(`Failed to send campaign msg ${msg.id}:`, e)
            errors.push(e.message || String(e))
            failureCount++
            // Try to mark as failed (might also fail if DB is locked/RLS)
            await supabase.from('campaign_messages').update({ status: 'failed', sent_at: new Date().toISOString() }).eq('id', msg.id)
        }
    }

    // 4. Check if any campaigns are now complete and update their status
    const campaignIds = [...new Set(messages.map(m => m.campaign_id))]

    for (const campaignId of campaignIds) {
        // Count total messages for this campaign
        const { data: stats } = await supabase
            .from('campaign_messages')
            .select('status', { count: 'exact' })
            .eq('campaign_id', campaignId)

        if (stats) {
            const total = stats.length
            const pending = stats.filter(s => s.status === 'pending').length
            const sent = stats.filter(s => s.status === 'sent').length
            const failed = stats.filter(s => s.status === 'failed').length

            // If no pending messages, mark campaign as complete
            if (pending === 0 && total > 0) {
                const status = failed === total ? 'Falhou' : 'Concluído'

                await supabase
                    .from('campaigns')
                    .update({
                        status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', campaignId)

                console.log(`✅ Campaign ${campaignId} marked as ${status} (${sent} sent, ${failed} failed)`)
            }
        }
    }

    return NextResponse.json({ processed: messages.length, success: successCount, failed: failureCount, errors })
}

async function processMessage(msg: any, config: any, supabase: any) {
    let finalPhone = msg.phone.replace(/\D/g, '') // Clean
    if (finalPhone.length <= 11) finalPhone = '55' + finalPhone

    let finalMessage = msg.content

    // Safety: If Test Mode is active and we have a safe number, redirect.
    if (config?.testMode?.isActive) {
        if (config.testMode.safeNumber) {
            finalPhone = config.testMode.safeNumber.replace(/\D/g, '')
            finalMessage = `[CAMPANHA TESTE] Para: ${msg.phone}\n\n${msg.content}`
        }
    }

    // Send Logic
    let sentId = null

    // SIMULATION (If no provider is configured, we simply pretend we sent it)
    if (!config || (!config.zapi && !config.evolution)) {
        // Sleep 500ms to simulate network latency
        await new Promise(r => setTimeout(r, 500))
        sentId = 'simulated_' + Math.random().toString(36).substring(7)
        console.log(`[SIMULATION] Sent '${finalMessage}' to ${finalPhone}`)
    }
    else if (config.provider === 'zapi' && config.zapi) {
        const { instanceId, token, clientToken } = config.zapi
        try {
            const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(clientToken ? { 'Client-Token': clientToken } : {}) },
                body: JSON.stringify({ phone: finalPhone, message: finalMessage })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(JSON.stringify(data))
            sentId = data.id || data.messageId
        } catch (apiError) {
            // FALLBACK TO SIMULATION IF TEST MODE
            if (config.testMode?.isActive) {
                console.warn("API Failed but Test Mode Active -> Simulating Success", apiError)
                await new Promise(r => setTimeout(r, 500))
                sentId = 'simulated_fallback_' + Math.random().toString(36).substring(7)
            } else {
                throw apiError
            }
        }
    }
    else if (config.provider === 'evolution' && config.evolution) {
        const { url, apiKey, instanceName } = config.evolution
        const baseUrl = url.replace(/\/$/, "")
        try {
            const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
                body: JSON.stringify({ number: finalPhone, text: finalMessage })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(JSON.stringify(data))
            sentId = data.key?.id
        } catch (apiError) {
            // FALLBACK TO SIMULATION IF TEST MODE
            if (config.testMode?.isActive) {
                console.warn("Evolution Failed but Test Mode Active -> Simulating Success", apiError)
                await new Promise(r => setTimeout(r, 500))
                sentId = 'simulated_fallback_' + Math.random().toString(36).substring(7)
            } else {
                throw apiError
            }
        }
    }

    // Update DB
    const { error: dbError } = await supabase.from('campaign_messages').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        message_id: sentId
    }).eq('id', msg.id)

    if (dbError) {
        throw new Error(`DB Update Failed: ${dbError.message}`)
    }
}
