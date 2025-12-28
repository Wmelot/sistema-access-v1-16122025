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
        'insole_maintenance'
    ]),
    is_active: z.boolean().default(true)
})

const DEFAULT_EVO_URL = "http://localhost:8080"
const DEFAULT_EVO_KEY = "B8988582-7067-463E-A4C3-A3F0E0D06939"

export type WhatsappConfig = {
    provider: 'evolution' | 'zapi'
    evolution?: {
        url: string
        apiKey: string
        instanceName: string
    }
    zapi?: {
        instanceId: string
        token: string
        clientToken?: string
    }
    testMode: {
        isActive: boolean
        safeNumber: string
    }
}

export async function getWhatsappConfig(): Promise<WhatsappConfig | null> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('api_integrations')
        .select('credentials')
        .eq('service_name', 'whatsapp_service')
        .single()

    if (data?.credentials) {
        return data.credentials as WhatsappConfig
    }

    // Fallback: Tenta migrar da config antiga 'evolution_api'
    const { data: oldData } = await supabase
        .from('api_integrations')
        .select('credentials')
        .eq('service_name', 'evolution_api')
        .single()

    if (oldData?.credentials) {
        return {
            provider: 'evolution',
            evolution: {
                url: oldData.credentials.url,
                apiKey: oldData.credentials.apiKey,
                instanceName: oldData.credentials.instanceName,
            },
            testMode: { isActive: false, safeNumber: '' }
        }
    }

    return null
}

// Helper to get Config
export async function getEvolutionConfig() {
    const config = await getWhatsappConfig()
    if (config?.provider === 'evolution' && config?.evolution) {
        return { ...config.evolution, isConfigured: true }
    }
    return {
        url: DEFAULT_EVO_URL,
        apiKey: DEFAULT_EVO_KEY,
        instanceName: 'AccessFisioMain',
        isConfigured: false
    }
}

export async function saveWhatsappConfig(config: WhatsappConfig) {
    const supabase = await createClient()

    // Upsert integration
    const { data: existing } = await supabase
        .from('api_integrations')
        .select('id')
        .eq('service_name', 'whatsapp_service')
        .single()

    const credentials = { ...config, updated_at: new Date().toISOString() }

    let error
    if (existing) {
        const res = await supabase.from('api_integrations').update({ credentials }).eq('id', existing.id)
        error = res.error
    } else {
        const res = await supabase.from('api_integrations').insert({
            service_name: 'whatsapp_service',
            credentials,
            is_active: true
        })
        error = res.error
    }

    if (error) return { success: false, error: "Erro ao salvar configuração." }

    revalidatePath('/dashboard/settings/communication')
    return { success: true }
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
        const cleanClientToken = clean(clientToken)

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
