'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
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

import { db } from "@/lib/db"

// ... imports ...


export async function saveWhatsappConfig(input: WhatsappConfigInput, slug?: string) {
    const { provider, zapi, evolution, testMode } = input
    const supabase = await createClient() // Use regular client to get user context if no slug

    let organizationId: string | undefined
    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) organizationId = org.id
    }

    // If no slug, try user profile (fallback)
    if (!organizationId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }
    }

    // Using admin client for upsert to ensure permissions if needed, 
    // but ideally regular client with RLS is better. Sticking to Admin as per original (mostly)
    const adminSupabase = await createAdminClient()

    try {
        const commonFields = {
            updated_at: new Date().toISOString(),
            organization_id: organizationId
        }

        // 1. Save Provider Config
        if (provider === 'zapi' && zapi) {
            const config = {
                instanceId: zapi.instanceId,
                token: zapi.token,
                clientToken: zapi.clientToken
            }

            // [MULTI-TENANT] We assume unique constraint is on (organization_id, provider) OR we rely on ID.
            // Since we don't know the ID, we query first or use a match.
            // Upsert by 'provider' only works if it's unique globally. 
            // We'll try to update where org_id and provider match, or insert.

            // Check existence
            const { data: existing } = await adminSupabase.from('api_integrations')
                .select('id')
                .eq('provider', 'zapi')
                .eq('organization_id', organizationId!) // assert not null if we want strict MT
                .maybeSingle()

            if (existing) {
                await adminSupabase.from('api_integrations').update({ ...commonFields, config, is_active: true }).eq('id', existing.id)
            } else {
                await adminSupabase.from('api_integrations').insert({ ...commonFields, provider: 'zapi', config, is_active: true })
            }

            // Deactivate Evolution for this Org
            await adminSupabase.from('api_integrations')
                .update({ is_active: false })
                .eq('provider', 'evolution')
                .eq('organization_id', organizationId!)

        } else if (provider === 'evolution' && evolution) {
            const config = {
                url: evolution.url,
                apiKey: evolution.apiKey,
                instanceName: evolution.instanceName
            }

            const { data: existing } = await adminSupabase.from('api_integrations')
                .select('id')
                .eq('provider', 'evolution')
                .eq('organization_id', organizationId!)
                .maybeSingle()

            if (existing) {
                await adminSupabase.from('api_integrations').update({ ...commonFields, config, is_active: true }).eq('id', existing.id)
            } else {
                await adminSupabase.from('api_integrations').insert({ ...commonFields, provider: 'evolution', config, is_active: true })
            }

            // Deactivate Z-API
            await adminSupabase.from('api_integrations')
                .update({ is_active: false })
                .eq('provider', 'zapi')
                .eq('organization_id', organizationId!)
        }

        // 2. Save Test Mode
        if (testMode) {
            const { data: existing } = await adminSupabase.from('api_integrations')
                .select('id')
                .eq('provider', 'test_mode')
                .eq('organization_id', organizationId!)
                .maybeSingle()

            if (existing) {
                await adminSupabase.from('api_integrations').update({ ...commonFields, config: testMode, is_active: true }).eq('id', existing.id)
            } else {
                await adminSupabase.from('api_integrations').insert({ ...commonFields, provider: 'test_mode', config: testMode, is_active: true })
            }
        }

        if (slug) {
            revalidatePath(`/dashboard/${slug}/settings/communication`)
        } else {
            revalidatePath('/dashboard/settings/communication')
        }
        return { success: true }

    } catch (e: any) {
        console.error("Save Config Supabase Error:", e)
        return { success: false, error: e.message }
    }
}


export async function getWhatsappConfig(slug?: string) {
    try {
        // [MULTI-TENANT] Use verify organization logic
        const supabase = await createAdminClient()

        let organizationId: string | undefined

        if (slug) {
            const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
            if (org) organizationId = org.id
        }

        // If still no orgId (and no user context passed, though we could try fetching user),
        // we might rely on the calling user. But createAdminClient doesn't have user context.
        // We really need the slug or we fail for MT.
        // If no slug provided, we'll try to find any active config (Legacy behavior/Global Admin?) 
        // OR we should require slug.

        // Let's create a regular client to check user if slug missing
        if (!organizationId) {
            const authClient = await createClient()
            const { data: { user } } = await authClient.auth.getUser()
            if (user) {
                const { data: profile } = await authClient.from('profiles').select('organization_id').eq('id', user.id).single()
                organizationId = profile?.organization_id
            }
        }

        if (!organizationId) return null // Can't fetch config without context

        // Fetch Z-API
        const { data: zapi } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('provider', 'zapi')
            .eq('is_active', true)
            .eq('organization_id', organizationId)
            .single()

        // Fetch Evolution
        const { data: evolution } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('provider', 'evolution')
            .eq('is_active', true)
            .eq('organization_id', organizationId)
            .single()

        // Fetch Test Mode
        const { data: testMode } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('provider', 'test_mode')
            .eq('organization_id', organizationId)
            .single()

        const activeProvider = zapi ? 'zapi' : (evolution ? 'evolution' : null)

        return {
            provider: activeProvider,
            zapi: zapi?.config,
            evolution: evolution?.config,
            testMode: testMode?.config
        }
    } catch (e) {
        console.error("Get Config Supabase Error:", e)
        return null
    }
}


export async function getTemplates(slug?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) {
            query = query.eq('organization_id', org.id)
        }
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching templates:", error)
        return []
    }
    return data
}

export async function createTemplate(formData: FormData, slug?: string) {
    const rawData = {
        title: formData.get('title'),
        content: formData.get('content'),
        channel: formData.get('channel'),
        trigger_type: formData.get('trigger_type'),
        delay_days: formData.get('delay_days'),
        questionnaire_type: formData.get('questionnaire_type') || undefined,
        is_active: formData.get('is_active') === 'on'
    }

    const result = TemplateSchema.safeParse(rawData)

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message }
    }

    const supabase = await createClient()

    let organizationId: string | undefined
    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) organizationId = org.id
    }
    if (!organizationId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }
    }

    const { error } = await supabase.from('message_templates').insert({
        ...result.data,
        organization_id: organizationId
    })

    if (error) {
        return { success: false, error: error.message }
    }

    if (slug) revalidatePath(`/dashboard/${slug}/settings/communication`)
    else revalidatePath('/dashboard/settings/communication')

    return { success: true }
}

export async function updateTemplate(id: string, formData: FormData, slug?: string) {
    const rawData = {
        title: formData.get('title'),
        content: formData.get('content'),
        channel: formData.get('channel'),
        trigger_type: formData.get('trigger_type'),
        delay_days: formData.get('delay_days'),
        questionnaire_type: formData.get('questionnaire_type') || undefined,
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

    if (slug) revalidatePath(`/dashboard/${slug}/settings/communication`)
    else revalidatePath('/dashboard/settings/communication')

    return { success: true }
}

export async function deleteTemplate(id: string, slug?: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('message_templates').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    if (slug) revalidatePath(`/dashboard/${slug}/settings/communication`)
    else revalidatePath('/dashboard/settings/communication')

    return { success: true }
}

export async function getMessageLogs(slug?: string) {
    const supabase = await createClient()
    let query = supabase
        .from('message_logs')
        .select(`
            *,
            template:message_templates (title)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) {
            query = query.eq('organization_id', org.id)
        }
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching logs:", error)
        return []
    }
    return data
}

export async function sendTestMessage(templateId: string, phone: string, slug?: string) {
    const supabase = await createClient()

    // Fetch template
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

    // Get Org for Log
    let organizationId: string | undefined
    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) organizationId = org.id
    }
    if (!organizationId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }
    }

    // 3. Create Pending Log
    const { data: logInfo } = await supabase.from('message_logs').insert({
        template_id: templateId,
        phone: cleanPhone,
        content: message,
        status: 'pending',
        organization_id: organizationId
    }).select().single()

    // 4. Send
    // Get config for the specific org (slug)
    const config = await getWhatsappConfig(slug)

    const result = await sendMessage(cleanPhone, message, config)

    // 5. Update Log based on result
    if (logInfo) {
        await supabase.from('message_logs').update({
            status: result.success ? 'sent' : 'failed',
            message_id: result.messageId,
            error_message: result.error
        }).eq('id', logInfo.id)
    }

    if (slug) revalidatePath(`/dashboard/${slug}/settings/communication`)
    else revalidatePath('/dashboard/settings/communication')

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
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

            const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(clientToken ? { 'Client-Token': clientToken } : {})
                },
                body: JSON.stringify({
                    phone: destinationNumber,
                    message: finalMessage
                }),
                signal: controller.signal
            })
            clearTimeout(timeoutId)

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

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

            const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                },
                body: JSON.stringify({
                    number: destinationNumber,
                    text: finalMessage
                }),
                signal: controller.signal
            })
            clearTimeout(timeoutId)

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



export async function sendAppointmentMessage(appointmentId: string, type: 'confirmation' | 'reminder' | 'feedback', injectedSupabase?: any) {
    const supabase = injectedSupabase || await createClient()

    // 1. Fetch Appointment Details
    const { data: appt, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (name, phone),
            services (name),
            profiles (full_name),
            locations (name)
        `)
        .eq('id', appointmentId)
        .single()

    if (error || !appt) {
        console.error("Error fetching appt for message:", error)
        return { success: false, error: `Agendamento não encontrado. Detalhe: ${error ? JSON.stringify(error) : 'Retorno nulo'}` }
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

    const { data: template, error: tmplError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('trigger_type', triggerMap[type])
        .eq('is_active', true)
        .single()

    if (tmplError || !template) {
        console.warn(`[sendAppointmentMessage] Template not found/error for type '${type}' (${triggerMap[type]}):`, tmplError)
    } else {
        console.log(`[sendAppointmentMessage] Using template: ${template.title}`)
    }

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
            .replace(/{{endereco}}/g, '') // Address column missing/unknown
            .replace(/{{confirmacao_link}}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://beta.accessfisio.com'}/confirmar/${appointmentId}`)
            .replace(/{{link_avaliacao}}/g, "https://g.page/r/CZFQUQVoZs8JEBM/review") // Default Google Review Link

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
    const config = await getWhatsappConfig() // Corrected: No args
    if (!config) return { success: false, error: "WhatsApp offline." }

    const result = await sendMessage(patient.phone, messageText, config)


    // 5. Log & Return
    if (result.success) {
        // Ideally update flags here if we add them to the table later
        return {
            success: true,
            messageId: result.messageId,
            usedTemplate: template ? template.title : "Fallback (Default)"
        }
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

            // Helpful translation for the Client Token error
            if (String(zapiError).includes("client-token is not configured")) {
                return {
                    success: false,
                    error: "Bloqueio de Segurança Z-API: Sua instância está protegida por Client Token. Vá na aba 'Segurança' do painel da Z-API para pegar o token ou desative a proteção lá."
                }
            }

            const details = JSON.stringify(data)

            // Hide token for security in UI but show structure
            const debugUrl = url.replace(cleanToken, '***')

            return {
                success: false,
                error: `Erro Z-API (${res.status}): ${zapiError}`
            }
        }

        return { success: true, data }

    } catch (e: any) {
        return { success: false, error: `Erro de Conexão: ${e.message}` }
    }
}


export async function toggleTemplateStatus(id: string, isActive: boolean, slug?: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('message_templates')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    if (slug) {
        revalidatePath(`/dashboard/${slug}/settings/communication`)
    } else {
        revalidatePath('/dashboard/settings/communication')
    }
    return { success: true }
}
