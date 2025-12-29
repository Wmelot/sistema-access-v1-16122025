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
    questionnaire_type: z.string().optional(),
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


export async function getWhatsappConfig(injectedSupabase?: any) {
    const supabase = injectedSupabase || await createClient()

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
        questionnaire_type: formData.get('questionnaire_type'),
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
        questionnaire_type: formData.get('questionnaire_type'),
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
        .replace(/{{link_avaliacao}}/g, "https://beta.accessfisio.com/avaliacao/teste-123")

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
        // status: 'pending' -- We save as pending, sendMessage will update to sent/failed
        status: 'pending'
    }).select().single()

    // 4. Send
    const result = await sendMessage(cleanPhone, message)

    // 5. Update Log based on result
    if (logInfo) {
        await supabase.from('message_logs').update({
            status: result.success ? 'sent' : 'failed',
            message_id: result.messageId,
            error_message: result.error
        }).eq('id', logInfo.id)
    }

    revalidatePath('/dashboard/settings/communication')
    return result
}

export async function sendMessage(phone: string, message: string, injectedConfig?: any) {
    const supabase = await createClient()

    try {
        const config = injectedConfig || await getWhatsappConfig()
        let destinationNumber = phone
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
            // Z-API
            const { instanceId, token, clientToken } = config.zapi
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

            if (res.ok && (data.id || data.messageId)) {
                return { success: true, messageId: data.id || data.messageId }
            } else {
                throw new Error(JSON.stringify(data))
            }

        } else if (config.provider === 'evolution' && config.evolution) {
            // Evolution API
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
                return { success: true, messageId: data.key.id }
            } else {
                throw new Error(JSON.stringify(data))
            }
        } else {
            throw new Error("Provedor não configurado corretamente.")
        }
    } catch (e: any) {
        console.error("Send Error:", e)
        return { success: false, error: e.message || String(e) }
    }
}


export async function sendAppointmentMessage(appointmentId: string, type: 'confirmation' | 'reminder' | 'feedback') {
    const supabase = await createClient()

    // 1. Fetch Appointment Details
    const { data: appt, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (name, phone),
            services (name),
            profiles (full_name),
            locations (name, address)
        `)
        .eq('id', appointmentId)
        .single()

    if (error || !appt) {
        console.error("Error fetching appt for message:", error)
        return { success: false, error: "Agendamento não encontrado." }
    }

    // Fix: Handle Supabase Joins (Array vs Object)
    const patient: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
    const profile: any = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles
    const service: any = Array.isArray(appt.services) ? appt.services[0] : appt.services
    const location: any = Array.isArray(appt.locations) ? appt.locations[0] : appt.locations

    if (!patient?.phone) {
        return { success: false, error: "Dados inválidos: Paciente sem telefone." }
    }

    // 2. Fetch Appropriate Template
    // We look for a template with trigger_type matching the message type
    const triggerMap = {
        'confirmation': 'appointment_confirmation',
        'reminder': 'appointment_reminder',
        'feedback': 'post_attendance'
    }

    const { data: template } = await supabase
        .from('message_templates')
        .select('*')
        .eq('trigger_type', triggerMap[type])
        .eq('is_active', true)
        .single()

    // 3. Construct Message
    let messageText = ""
    const patientName = patient.name.split(' ')[0]
    const dateStr = new Date(appt.start_time).toLocaleDateString('pt-BR')
    const timeStr = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

    if (template) {
        messageText = template.content
            .replace(/{{paciente}}/g, patientName)
            .replace(/{{data}}/g, dateStr)
            .replace(/{{horario}}/g, timeStr)
            .replace(/{{profissional}}/g, profile?.full_name || 'Profissional')
            .replace(/{{servico}}/g, service?.name || 'Atendimento')
            .replace(/{{local}}/g, location?.name || 'Clínica')
            .replace(/{{endereco}}/g, location?.address || '')
    } else {
        // Default Fallbacks
        if (type === 'confirmation') {
            messageText = `Olá ${patientName}, seu agendamento está confirmado para ${dateStr} às ${timeStr} com ${profile?.full_name}.`
        } else if (type === 'reminder') {
            messageText = `Olá ${patientName}, lembrete do seu agendamento amanhã (${dateStr}) às ${timeStr}.`
        } else if (type === 'feedback') {
            messageText = `Olá ${patientName}, como foi seu atendimento hoje?`
        }
    }

    // 4. Send Message
    const config = await getWhatsappConfig()
    if (!config) return { success: false, error: "WhatsApp offline." }

    const result = await sendMessage(patient.phone, messageText, config)

    // 5. Log & Return
    if (result.success) {
        // Ideally update flags here if we add them to the table later
        return { success: true, messageId: result.messageId }
    }
    return result
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

