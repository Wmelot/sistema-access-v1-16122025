'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const TemplateSchema = z.object({
    title: z.string().min(3, "Título muito curto"),
    content: z.string().min(10, "Mensagem muito curta"),
    channel: z.enum(['whatsapp', 'email', 'sms']),
    trigger_type: z.enum([
        'manual',
        'appointment_confirmation',
        'appointment_reminder',
        'birthday',
        'post_attendance',
        'insole_delivery',
        'insole_maintenance'
    ]),
    delay_days: z.coerce.number().min(0).default(0),
    is_active: z.boolean().default(true)
})

// ... (existing code for config functions)

// ... (existing code)


type WhatsappConfigInput = {
    provider: 'zapi' | 'evolution'
    zapi?: {
        instanceId: string
        token: string
        clientToken?: string
    }
    evolution?: {
        url: string
        apiKey: string
        instanceName: string
    }
    testMode?: {
        isActive: boolean
        safeNumber: string
    }
}

export async function saveWhatsappConfig(input: WhatsappConfigInput) {
    const supabase = await createClient()
    const { provider, zapi, evolution, testMode } = input

    try {
        if (provider === 'zapi' && zapi) {
            const config = {
                instanceId: zapi.instanceId,
                token: zapi.token,
                clientToken: zapi.clientToken
            }
            // Upsert Z-API
            const { error } = await supabase.from('api_integrations').upsert({
                provider: 'zapi',
                config,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' })

            if (error) throw error

            // Deactivate Evolution
            await supabase.from('api_integrations').update({ is_active: false }).eq('provider', 'evolution')

        } else if (provider === 'evolution' && evolution) {
            const config = {
                url: evolution.url,
                apiKey: evolution.apiKey,
                instanceName: evolution.instanceName
            }
            // Upsert Evolution
            const { error } = await supabase.from('api_integrations').upsert({
                provider: 'evolution',
                config,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' })

            if (error) throw error

            // Deactivate Z-API
            await supabase.from('api_integrations').update({ is_active: false }).eq('provider', 'zapi')
        }

        // Handle Test Mode Toggle
        if (testMode) {
            await supabase.from('api_integrations').upsert({
                provider: 'test_mode',
                config: { isActive: testMode.isActive, safeNumber: testMode.safeNumber },
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' })
        }

        revalidatePath('/dashboard/settings/communication')
        return { success: true }

    } catch (e: any) {
        return { success: false, error: e.message }
    }
}


export async function getWhatsappConfig() {
    const supabase = await createClient()

    // Fetch Z-API config
    const { data: zapi } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('provider', 'zapi')
        .eq('is_active', true)
        .single()

    // Fetch Evolution config
    const { data: evolution } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('provider', 'evolution')
        .eq('is_active', true)
        .single()

    // Fetch Active Provider setting (assuming standard is Z-API if both active, or specific setting)
    // For now, return structured object

    // Check if test mode is active (using a mock setting or specific row)
    const { data: testMode } = await supabase
        .from('api_integrations')
        .select('config')
        .eq('provider', 'test_mode')
        .single()

    const activeProvider = zapi ? 'zapi' : (evolution ? 'evolution' : null)

    return {
        provider: activeProvider,
        zapi: zapi?.config,
        evolution: evolution?.config,
        testMode: testMode?.config
    }
}

export async function getTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching templates:", error)
        return []
    }
    return data
}

export async function createTemplate(formData: FormData) {
    const rawData = {
        title: formData.get('title'),
        content: formData.get('content'),
        channel: formData.get('channel'),
        trigger_type: formData.get('trigger_type'),
        delay_days: formData.get('delay_days'),
        is_active: formData.get('is_active') === 'on'
    }

    const result = TemplateSchema.safeParse(rawData)

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('message_templates').insert(result.data)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/communication')
    return { success: true }
}

export async function updateTemplate(id: string, formData: FormData) {
    const rawData = {
        title: formData.get('title'),
        content: formData.get('content'),
        channel: formData.get('channel'),
        trigger_type: formData.get('trigger_type'),
        delay_days: formData.get('delay_days'),
        is_active: formData.get('is_active') === 'on'
    }

    const result = TemplateSchema.safeParse(rawData)

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('message_templates')
        .update(result.data)
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/communication')
    return { success: true }
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('message_templates').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings/communication')
    return { success: true }
}

export async function getMessageLogs() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('message_logs')
        .select(`
            *,
            template:message_templates (title)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error("Error fetching logs:", error)
        return []
    }
    return data
}

export async function sendTestMessage(templateId: string, phone: string) {
    const supabase = await createClient()
    const { data: template, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (error || !template) {
        return { success: false, error: "Modelo não encontrado." }
    }

    // 1. Prepare Content (Replace Variables)
    let message = template.content
        .replace(/{{paciente}}/g, "João (Teste)")
        .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{{horario}}/g, "14:30")
        .replace(/{{medico}}/g, "Dra. Rayane")
        .replace(/{{link_avaliacao}}/g, "https://accessfisio.com/avaliacao/teste-123")

    // 2. Format Phone
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length <= 11) {
        cleanPhone = '55' + cleanPhone
    }

    // 3. Create Pending Log
    const { data: logInfo } = await supabase.from('message_logs').insert({
        template_id: templateId,
        phone: cleanPhone,
        content: message,
        status: 'pending'
    }).select().single()

    // 4. Send Logic (Hybrid + Safety)
    try {
        const config = await getWhatsappConfig()
        let destinationNumber = cleanPhone
        let finalMessage = message

        // --- SAFETY INTERCEPTOR ---
        if (config?.testMode?.isActive) {
            if (!config.testMode.safeNumber) {
                return { success: false, error: "Modo de Teste ativo mas sem número seguro configurado." }
            }
            destinationNumber = config.testMode.safeNumber.replace(/\D/g, '')
            finalMessage = `[MODO TESTE] Para: ${phone}\n\n${message}`
        }
        // --------------------------

        if (!config) throw new Error("WhatsApp não configurado.")

        if (config.provider === 'zapi' && config.zapi) {
            // Z-API Implementation
            const { instanceId, token, clientToken } = config.zapi

            // Check endpoints https://developer.z-api.io/
            const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(clientToken ? { 'Client-Token': clientToken } : {})
                },
                body: JSON.stringify({
                    phone: destinationNumber,
                    message: finalMessage
                })
            })

            const data = await res.json()

            if (res.ok && (data.id || data.messageId)) { // Adjust based on Z-API response
                if (logInfo) await supabase.from('message_logs').update({ status: 'sent', message_id: data.id || data.messageId }).eq('id', logInfo.id)
                revalidatePath('/dashboard/settings/communication')
                return { success: true }
            } else {
                throw new Error(JSON.stringify(data))
            }

        } else if (config.provider === 'evolution' && config.evolution) {
            // Evolution API Implementation
            const { url, apiKey, instanceName } = config.evolution
            const baseUrl = url.replace(/\/$/, "")

            const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                },
                body: JSON.stringify({
                    number: destinationNumber,
                    text: finalMessage
                })
            })

            const data = await res.json()

            if (res.ok && data.key?.id) {
                if (logInfo) await supabase.from('message_logs').update({ status: 'sent', message_id: data.key.id }).eq('id', logInfo.id)
                revalidatePath('/dashboard/settings/communication')
                return { success: true }
            } else {
                throw new Error(JSON.stringify(data))
            }
        } else {
            throw new Error("Provedor não configurado corretamente.")
        }

    } catch (e: any) {
        console.error("Send Error:", e)
        if (logInfo) {
            await supabase.from('message_logs').update({
                status: 'failed',
                error_message: e.message || String(e)
            }).eq('id', logInfo.id)
        }
        revalidatePath('/dashboard/settings/communication')
        return { success: false, error: `Erro no envio: ${e.message || "Erro desconhecido"}` }
    }
}


export async function testZapiConnection(config: { instanceId: string, token: string, clientToken?: string }) {
    try {
        const { instanceId, token, clientToken } = config

        // Helper to clean strings aggressively (remove all whitespace/invisible chars)
        const clean = (str: string) => str ? str.replace(/\s+/g, '') : ''

        let cleanInstanceId = clean(instanceId)
        let cleanToken = clean(token)
        const cleanClientToken = clean(clientToken || '')

        // INTELLIGENT PARSING:
        // If user pasted the FULL URL (e.g. https://api.z-api.io/instances/3EC.../token/C18.../send-text)
        // We try to extract the ID and Token automatically.
        if (cleanInstanceId.includes('api.z-api.io')) {
            // Regex to capture instance ID and token from URL
            const match = cleanInstanceId.match(/instances\/([A-Z0-9]+)\/token\/([A-Z0-9]+)/i)
            if (match) {
                cleanInstanceId = match[1]
                cleanToken = match[2] // Update token as well if found in URL
            }
        }

        // Endpoint to check connection/status.
        // Using 'status' typically returns the connection status of the instance
        const url = `https://api.z-api.io/instances/${cleanInstanceId}/token/${cleanToken}/status`

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(cleanClientToken ? { 'Client-Token': cleanClientToken } : {})
            }
        })

        const data = await res.json()

        if (!res.ok) {
            // Return RAW error for debugging
            const zapiError = data.message || data.error || "Erro desconhecido da Z-API"
            const details = JSON.stringify(data)

            // Hide token for security in UI but show structure
            const debugUrl = url.replace(cleanToken, '***')

            return {
                success: false,
                error: `Erro Z-API (${res.status}): ${zapiError} | URL Tentada: ${debugUrl}`
            }
        }

        return { success: true, data }

    } catch (e: any) {
        return { success: false, error: `Erro de Conexão: ${e.message}` }
    }
}
