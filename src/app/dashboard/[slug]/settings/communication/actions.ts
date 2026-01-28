'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

const TemplateSchema = z.object({
    title: z.string().min(3, "Título muito curto"),
    content: z.string().min(10, "Mensagem muito curta"),
    channel: z.enum(['whatsapp', 'email', 'sms']),
    trigger_type: z.enum([
        'manual',
        'appointment_confirmation', // 24h before
        'appointment_confirmation_immediate',
        'appointment_confirmation_8h',
        'appointment_confirmation_2h',
        'appointment_reminder_confirmed_2h',
        'questionnaire_12h',
        'appointment_reminder', // Generic
        'birthday',
        'post_attendance',
        'insole_delivery',
        'insole_maintenance'
    ]),
    delay_days: z.coerce.number().min(0).default(0),
    questionnaire_type: z.string().optional(),
    max_retries: z.coerce.number().min(0).max(10).default(0),
    retry_interval_hours: z.coerce.number().min(1).default(24),
    is_active: z.boolean().default(true)
})

const REGION_QUESTIONNAIRE_MAP: Record<string, string[]> = {
    'Coluna Lombar': [
        '34ab93ca-2666-469c-afbe-e95778b7cdd5', // Roland-Morris
        '99c01065-3958-488d-9d55-423e9183b2d8'  // STarT Back
    ],
    'Coluna Cervical': ['b3315150-daeb-47fb-a5b3-d2a398e61f05'], // NDI
    'Ombro': ['8a7babb2-1c19-46e4-9f11-e5998552698c'], // QuickDASH
    'Cotovelo': ['8a7babb2-1c19-46e4-9f11-e5998552698c'],
    'Punho/Mão': ['8a7babb2-1c19-46e4-9f11-e5998552698c'],
    'Quadril': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'], // LEFS
    'Joelho': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
    'Pé/Tornozelo': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
    'Pé Insensível (Diabetes)': [
        '6579a316-aa97-4075-a133-ef9d736563a9', // MNSI
        'dd350aa4-5188-4ccb-ba24-50839308d61b'  // Diabetes Control
    ]
}

const QUESTIONNAIRE_TYPE_ID_MAP: Record<string, string[]> = {
    'general': ['8a7babb2-1c19-46e4-9f11-e5998552698c'], // Using QuickDASH as placeholder for general for now
    'diabetic_foot': ['6579a316-aa97-4075-a133-ef9d736563a9', 'dd350aa4-5188-4ccb-ba24-50839308d61b'],
    'spadi': ['77c68b6d-4950-482f-870b-044275f91753'],
    'lefs': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
    'dash': ['8a7babb2-1c19-46e4-9f11-e5998552698c'],
    'insoles_40d': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'], // Placeholders
    'insoles_1y': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
    'womens_health': ['b3315150-daeb-47fb-a5b3-d2a398e61f05']
}

async function createShortLink(supabase: any, originalUrl: string, appUrl: string) {
    try {
        const shortId = Math.random().toString(36).substring(2, 8)
        const { error } = await supabase
            .from('short_links')
            .insert({ id: shortId, original_url: originalUrl })
        if (!error) return `${appUrl}/c/${shortId}`
    } catch (e) {
        console.error("[createShortLink] Error:", e)
    }
    return `${appUrl}${originalUrl}`
}

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

        // [SaaS] Check if WhatsApp feature is ACTIVE for this clinic
        // We check in THREE places: 
        // 1. organization_features (Marketplace manual activation)
        // 2. organizations.features (JSONB - Plan based)
        // 3. Special case for Access Fisioterapia 

        const { data: orgData } = await supabase
            .from('organizations')
            .select('id, features, plan_config_id')
            .eq('id', organizationId)
            .single()

        const { data: featureStore } = await supabase
            .from('organization_features')
            .select('is_active')
            .eq('organization_id', organizationId)
            .eq('feature_key', 'whatsapp')
            .maybeSingle()

        const isMarketplaceActive = featureStore?.is_active || false
        const isPlanActive = (orgData as any)?.features?.whatsapp_integration || (orgData as any)?.features?.zapi_messaging || (orgData as any)?.features?.whatsapp || false
        const isAccessFisio = organizationId === '9571532e-fdf8-4aaa-b236-416fd6459566'

        const isFeatureActive = isMarketplaceActive || isPlanActive || isAccessFisio

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
            testMode: testMode?.config,
            isFeatureActive: isFeatureActive
        }
    } catch (e) {
        console.error("Get Config Supabase Error:", e)
        return null
    }
}


async function ensureDefaultTemplates(organizationId: string) {
    const supabase = await createClient()

    const defaults = [
        {
            title: 'Boas-vindas (Imediato ao Agendar)',
            trigger_type: 'appointment_confirmation_immediate',
            content: 'Olá {{paciente}}, seu agendamento foi realizado com sucesso para o dia {{data}} às {{horario}} com {{profissional}}. Guarde esta mensagem!',
            is_active: true
        },
        {
            title: 'Confirmação (24h antes)',
            trigger_type: 'appointment_confirmation',
            content: 'Olá {{paciente}}, seu agendamento está confirmado para amanhã ({{data}}) às {{horario}} com {{profissional}}. Por favor, confirme sua presença clicando no link: {{confirmacao_link}}',
            is_active: true
        },
        {
            title: 'Reforço Confirmação (8h antes)',
            trigger_type: 'appointment_confirmation_8h',
            content: 'Olá {{paciente}}, ainda não recebemos sua confirmação para o atendimento hoje às {{horario}}. Poderia confirmar sua presença? Link: {{confirmacao_link}}',
            is_active: true
        },
        {
            title: 'Último Chamado (2h antes)',
            trigger_type: 'appointment_confirmation_2h',
            content: 'Olá {{paciente}}, sua consulta é em 2 horas! Ainda dá tempo de confirmar sua presença: {{confirmacao_link}}',
            is_active: true
        },
        {
            title: 'Lembrete (Agendamento Confirmado)',
            trigger_type: 'appointment_reminder_confirmed_2h',
            content: 'Olá {{paciente}}, falta pouco para sua consulta hoje às {{horario}}! Já está tudo pronto para te receber.',
            is_active: true
        },
        {
            title: 'Envio de Questionários (12h antes)',
            trigger_type: 'questionnaire_12h',
            content: 'Olá {{paciente}}, para agilizar seu atendimento, por favor preencha os formulários abaixo antes da sua consulta com {{profissional}}:{{links_questionarios}}',
            is_active: true
        },
        {
            title: 'Pós-Atendimento / Feedback',
            trigger_type: 'post_attendance',
            content: 'Olá {{paciente}}, como foi seu atendimento hoje com {{profissional}}? Sua opinião é muito importante para nós!',
            is_active: true
        }
    ]

    for (const def of defaults) {
        const { data: existing } = await supabase
            .from('message_templates')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('trigger_type', def.trigger_type)
            .maybeSingle()

        if (!existing) {
            await supabase.from('message_templates').insert({
                ...def,
                organization_id: organizationId,
                channel: 'whatsapp'
            })
        }
    }
}

export async function getTemplates(slug?: string) {
    const supabase = await createClient()

    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) {
            await ensureDefaultTemplates(org.id)

            const { data, error } = await supabase
                .from('message_templates')
                .select('*')
                .or(`organization_id.eq.${org.id},organization_id.is.null`)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching templates:", error)
                return []
            }
            return data
        }
    }

    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .is('organization_id', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching global templates:", error)
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
        max_retries: formData.get('max_retries') || 0,
        retry_interval_hours: formData.get('retry_interval_hours') || 24,
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
        max_retries: formData.get('max_retries') || 0,
        retry_interval_hours: formData.get('retry_interval_hours') || 24,
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
        .replace(/{{profissional}}/g, "Dr. Warley (Teste)")
        .replace(/{{medico}}/g, "Dr. Warley (Teste)")
        .replace(/{{clinica}}/g, "Access Fisioterapia")
        .replace(/{{confirmacao_link}}/g, "https://axiom.app/c/teste")
        .replace(/{{links_questionarios}}/g, "\n- Link 1: https://axiom.app/v/123\n- Link 2: https://axiom.app/v/456")
        .replace(/{{link_avaliacao}}/g, "https://g.page/review/teste")

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



export async function sendAppointmentMessage(
    appointmentId: string,
    type: 'confirmation' | 'reminder' | 'feedback' | 'appointment_confirmation_immediate' | 'appointment_confirmation' | 'appointment_confirmation_8h' | 'appointment_confirmation_2h' | 'appointment_reminder_confirmed_2h' | 'questionnaire_12h' | 'manual',
    slug?: string,
    injectedSupabase?: any,
    customText?: string
) {
    const supabase = injectedSupabase || await createClient()

    // 1. Fetch Appointment Details (Simpler join to avoid ambiguity)
    const { data: appt, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (name, phone),
            services (name),
            profiles (full_name)
        `)
        .eq('id', appointmentId)
        .single()

    if (error || !appt) {
        console.error("Error fetching appt for message:", error)
        return { success: false, error: `Agendamento não encontrado. Detalhe: ${error ? JSON.stringify(error) : 'Retorno nulo'}` }
    }

    // Fetch Location separately to fix "locations_1" error
    let location: any = null
    if (appt.location_id) {
        const { data: locData } = await supabase
            .from('locations')
            .select('name, address, organization_id')
            .eq('id', appt.location_id)
            .single()
        location = locData
    }

    // Fix: Handle Supabase Joins (Array vs Object)
    const patient: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
    const profile: any = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles
    const service: any = Array.isArray(appt.services) ? appt.services[0] : appt.services

    // Fetch Organization separately to avoid join errors (PGRST200)
    let org: any = null
    const orgId = appt.organization_id || location?.organization_id
    if (orgId) {
        const { data: orgData } = await supabase.from('organizations').select('name, slug').eq('id', orgId).single()
        org = orgData
    }

    if (!patient?.phone) {
        return { success: false, error: "Dados inválidos: Paciente sem telefone." }
    }

    // 2. Prepare Variables
    const patientName = patient.name.split(' ')[0]
    const dateStr = new Date(appt.start_time).toLocaleDateString('pt-BR')
    const timeStr = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

    const triggerMap: Record<string, string> = {
        'confirmation': 'appointment_confirmation',
        'reminder': 'appointment_reminder',
        'feedback': 'post_attendance',
        'appointment_confirmation_immediate': 'appointment_confirmation_immediate',
        'appointment_confirmation': 'appointment_confirmation',
        'appointment_confirmation_8h': 'appointment_confirmation_8h',
        'appointment_confirmation_2h': 'appointment_confirmation_2h',
        'appointment_reminder_confirmed_2h': 'appointment_reminder_confirmed_2h',
        'questionnaire_12h': 'questionnaire_12h'
    }

    let host = ""
    try {
        const { headers } = await import('next/headers')
        host = headers().get('host') || ""
    } catch (e) {
        console.warn("[sendAppointmentMessage] Could not get headers, using fallback URL logic.")
    }
    const protocol = (host?.includes('localhost') || host?.includes('127.0.0.1')) ? 'http' : 'https'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://axiom-production.vercel.app')

    // --- LOGIC FOR SHORT LINK (Confirmation Link) ---
    const finalLink = await createShortLink(supabase, `/confirmar/${appointmentId}`, appUrl)

    // 3. Construct Message Content
    let messageText = ""
    let template: any = null

    if (customText) {
        messageText = customText
    } else {
        // Fetch Template (Org specific OR Global)
        const { data: templates, error: tmplError } = await supabase
            .from('message_templates')
            .select('*')
            .eq('trigger_type', triggerMap[type] || type)
            .eq('is_active', true)
            .or(`organization_id.eq.${appt.organization_id},organization_id.is.null`)
            .order('organization_id', { ascending: false, nullsFirst: false })

        if (templates && templates.length > 0) {
            template = templates[0]
            messageText = template.content
                .replace(/{{paciente}}/g, patientName)
                .replace(/{{data}}/g, dateStr)
                .replace(/{{horario}}/g, timeStr)
                .replace(/{{profissional}}/g, profile?.full_name || 'Profissional')
                .replace(/{{medico}}/g, profile?.full_name || 'Profissional')
                .replace(/{{clinica}}/g, org?.name || 'Access Fisioterapia')
                .replace(/{{servico}}/g, service?.name || 'Atendimento')
                .replace(/{{local}}/g, location?.name || 'Clínica')
                .replace(/{{endereco}}/g, location?.address || '')
                .replace(/{{confirmacao_link}}/g, finalLink)
                .replace(/{{link_avaliacao}}/g, "https://g.page/r/CZFQUQVoZs8JEBM/review")

            // --- DYNAMIC QUESTIONNAIRE INCLUSION ---
            if (messageText.includes('{{links_questionarios}}')) {
                let questionnaireLinks = ""
                const notes = appt.notes || ""
                const detectedRegions: string[] = []
                for (const region of Object.keys(REGION_QUESTIONNAIRE_MAP)) {
                    if (notes.toLowerCase().includes(region.toLowerCase().trim())) {
                        detectedRegions.push(region)
                    }
                }

                if (detectedRegions.length > 0) {
                    const allTemplateIds = new Set<string>()
                    detectedRegions.forEach(reg => {
                        REGION_QUESTIONNAIRE_MAP[reg].forEach(id => allTemplateIds.add(id))
                    })

                    const createdLinks: string[] = []
                    for (const tId of allTemplateIds) {
                        try {
                            const { generateSecureToken } = await import('@/lib/crypto')
                            const token = generateSecureToken(16)
                            const expiresAt = new Date()
                            expiresAt.setDate(expiresAt.getDate() + 7)
                            const { data: followup } = await supabase
                                .from('assessment_follow_ups')
                                .insert({
                                    patient_id: appt.patient_id,
                                    template_id: tId,
                                    organization_id: appt.organization_id,
                                    status: 'pending',
                                    link_token: token,
                                    link_expires_at: expiresAt.toISOString(),
                                    scheduled_date: new Date().toISOString(),
                                    created_by: appt.professional_id
                                })
                                .select('id')
                                .single()

                            if (followup) {
                                const fullUrl = `/avaliacao/${token}`
                                const shortened = await createShortLink(supabase, fullUrl, appUrl)
                                createdLinks.push(shortened)
                            }
                        } catch (err) {
                            console.error("Error creating auto-questionnaire followup:", err)
                        }
                    }

                    if (createdLinks.length > 0) {
                        questionnaireLinks = "\n\n*📋 Questionários Pré-Consulta (obrigatório):*\n" +
                            createdLinks.map((link, idx) => `Link ${idx + 1}: ${link}`).join('\n')
                    }
                }
                messageText = messageText.replace(/{{links_questionarios}}/g, questionnaireLinks)
            }

            // --- SPECIFIC LINKED QUESTIONNAIRE (Single selection) ---
            if (messageText.includes('{{link_questionario}}')) {
                let specificQuestionnaireLinks = ""

                if (template.questionnaire_type && template.questionnaire_type !== 'none') {
                    // If it looks like a UUID, use it directly. Otherwise use the map.
                    const templateIds = (template.questionnaire_type.length > 20)
                        ? [template.questionnaire_type]
                        : (QUESTIONNAIRE_TYPE_ID_MAP[template.questionnaire_type] || [])

                    const createdLinks: string[] = []

                    for (const tId of templateIds) {
                        try {
                            const { generateSecureToken } = await import('@/lib/crypto')
                            const token = generateSecureToken(16)
                            const expiresAt = new Date()
                            expiresAt.setDate(expiresAt.getDate() + 7)

                            const { data: followup } = await supabase
                                .from('assessment_follow_ups')
                                .insert({
                                    patient_id: appt.patient_id,
                                    template_id: tId,
                                    organization_id: appt.organization_id,
                                    status: 'pending',
                                    link_token: token,
                                    link_expires_at: expiresAt.toISOString(),
                                    scheduled_date: new Date().toISOString(),
                                    created_by: appt.professional_id
                                })
                                .select('id')
                                .single()

                            if (followup) {
                                const fullUrl = `/avaliacao/${token}`
                                const shortened = await createShortLink(supabase, fullUrl, appUrl)
                                createdLinks.push(shortened)
                            }
                        } catch (err) {
                            console.error("Error creating specific-questionnaire followup:", err)
                        }
                    }

                    if (createdLinks.length > 0) {
                        specificQuestionnaireLinks = createdLinks.join('\n')
                    }
                }

                messageText = messageText.replace(/{{link_questionario}}/g, specificQuestionnaireLinks)
            }
        } else {
            // FALLBACKS if no template is found in DB
            const genericLink = finalLink || (appUrl + '/confirmar/' + appointmentId)
            if (type === 'appointment_confirmation_immediate') {
                messageText = `Olá ${patientName}, seu agendamento foi realizado para ${dateStr} às ${timeStr} com ${profile?.full_name}.`
            } else if (type === 'appointment_confirmation' || type === 'confirmation') {
                messageText = `Olá ${patientName}, seu agendamento está confirmado para ${dateStr} às ${timeStr} com ${profile?.full_name}. Confirme aqui: ${genericLink}`
            } else if (type === 'appointment_confirmation_8h' || type === 'appointment_confirmation_2h') {
                messageText = `Olá ${patientName}, lembramos do seu atendimento hoje às ${timeStr}. Confirme sua presença: ${genericLink}`
            } else if (type === 'questionnaire_12h') {
                messageText = `Olá ${patientName}, por favor preencha os formulários para seu atendimento com ${profile?.full_name}.`
            } else if (type === 'appointment_reminder_confirmed_2h' || type === 'reminder') {
                messageText = `Olá ${patientName}, estamos te aguardando hoje às ${timeStr}!`
            } else if (type === 'feedback') {
                messageText = `Olá ${patientName}, como foi seu atendimento hoje?`
            } else {
                messageText = `Olá ${patientName}, temos um aviso sobre o seu agendamento em ${dateStr} às ${timeStr}.`
            }
        }
    }

    // Double check to NEVER send empty message
    if (!messageText || messageText.trim() === "") {
        console.error("[sendAppointmentMessage] Message content is empty! Using emergency fallback.")
        messageText = `Olá ${patientName}, passando para lembrar do seu agendamento em ${dateStr} às ${timeStr}.`
    }

    // 4. Send Message via WhatsApp
    const cleanPhone = (patient.phone || "").replace(/\D/g, '')
    const whatsappConfig = await getWhatsappConfig(slug || org?.slug)
    const result = await sendMessage(cleanPhone, messageText, whatsappConfig)

    // 5. Log Entry
    try {
        await supabase.from('message_logs').insert({
            appointment_id: appointmentId,
            trigger_type: type,
            patient_id: appt.patient_id,
            template_id: template?.id,
            phone: cleanPhone,
            content: messageText,
            status: result.success ? 'sent' : 'failed',
            message_id: result.messageId,
            error_message: result.error,
            organization_id: appt.organization_id
        })
    } catch (logErr) {
        console.error("[sendAppointmentMessage] Error logging message:", logErr)
    }

    if (result.success) {
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
        let cleanClientToken = clean(clientToken || '')

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

            // Helpful translation for the Client Token errors
            if (String(zapiError).includes("client-token is not configured")) {
                return {
                    success: false,
                    error: "🔒 Sua conta Z-API exige Client-Token. Entre em contato com o suporte do Z-API (suporte@z-api.io) e peça para desabilitar essa proteção na sua conta, ou forneça um Client-Token válido.",
                    requiresClientToken: true
                }
            }

            if (String(zapiError).includes("Client-Token") && String(zapiError).includes("not allowed")) {
                return {
                    success: false,
                    error: "❌ Client-Token Inválido: O token está errado ou foi revogado. Gere um novo no painel Z-API (Segurança) ou entre em contato com o suporte para desabilitar essa proteção.",
                    requiresClientToken: true
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

export async function getZapiQrCode(config: { instanceId: string, token: string, clientToken?: string }) {
    try {
        const { instanceId, token, clientToken } = config

        // Ensure clean inputs
        const clean = (str: string) => str ? str.replace(/\s+/g, '') : ''
        const cleanInstanceId = clean(instanceId)
        const cleanToken = clean(token)
        const cleanClientToken = clean(clientToken || '')

        const url = `https://api.z-api.io/instances/${cleanInstanceId}/token/${cleanToken}/qr-code/image`

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                ...(cleanClientToken ? { 'Client-Token': cleanClientToken } : {})
            }
        })

        if (!res.ok) {
            return { success: false, error: "Não foi possível gerar o QR Code. Verifique se a instância já está conectada." }
        }

        // The image endpoint returns binary data. 
        // We convert to base64 to pass to client.
        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        return { success: true, qrCodeUrl: dataUrl }

    } catch (e: any) {
        console.error("QR Code Error:", e)
        return { success: false, error: "Erro ao buscar QR Code." }
    }
}

export async function disconnectZapiInstance(config: { instanceId: string, token: string, clientToken?: string }) {
    try {
        const { instanceId, token, clientToken } = config

        // Ensure clean inputs
        const clean = (str: string) => str ? str.replace(/\s+/g, '') : ''
        const cleanInstanceId = clean(instanceId)
        const cleanToken = clean(token)
        const cleanClientToken = clean(clientToken || '')

        const url = `https://api.z-api.io/instances/${cleanInstanceId}/token/${cleanToken}/disconnect`

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                ...(cleanClientToken ? { 'Client-Token': cleanClientToken } : {})
            }
        })

        if (!res.ok) {
            const data = await res.json()
            return { success: false, error: data.message || "Erro ao desconectar." }
        }

        return { success: true }

    } catch (e: any) {
        console.error("Disconnect Error:", e)
        return { success: false, error: "Explosão ao tentar desconectar: " + e.message }
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

/**
 * Fetch all form templates for the questionnaire dropdown
 */
export async function getFormTemplatesAction() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('form_templates')
        .select('id, title')
        .is('deleted_at', null)
        .order('title', { ascending: true })

    if (error) {
        console.error("Error fetching form templates:", error)
        return []
    }

    return data
}

export async function getMarketplaceItems(slug: string) {
    const supabase = await createClient()

    // 1. Get Org Data
    const { data: org } = await supabase
        .from('organizations')
        .select('id, features')
        .eq('slug', slug)
        .single()

    if (!org) return []

    // 2. Get all addons
    const { data: addons } = await supabase
        .from('marketplace_addons')
        .select('*')
        .eq('is_published', true)

    // 3. Get active features for this org
    const { data: activeFeatures } = await supabase
        .from('organization_features')
        .select('feature_key, is_active')
        .eq('organization_id', org.id)

    // Helper to check if a feature is active in the plan (JSONB)
    const checkPlanFeature = (key: string) => {
        const jsonb = (org.features || {}) as any
        if (key === 'whatsapp') return jsonb.whatsapp_integration || jsonb.zapi_messaging || jsonb.whatsapp
        if (key === 'financial_pro') return jsonb.financial_module
        if (key === 'gemini_ai') return jsonb.ai_assistant
        return jsonb[key] || false
    }

    const isAccessFisio = org.id === '9571532e-fdf8-4aaa-b236-416fd6459566'

    return (addons || []).map(addon => {
        const marketplaceActive = activeFeatures?.find(f => f.feature_key === addon.feature_key)?.is_active || false
        const planActive = checkPlanFeature(addon.feature_key)

        return {
            ...addon,
            isActive: marketplaceActive || planActive || isAccessFisio
        }
    })
}

export async function activateFeature(slug: string, featureKey: string, passwordConfirm: string) {
    const supabase = await createClient()

    // 1. Verify Password for security
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Não autorizado." }

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordConfirm,
    })

    if (signInError) {
        return { success: false, error: "Senha incorreta. Confirmação negada." }
    }

    // 2. Get Org
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
    if (!org) return { success: false, error: "Organização não encontrada." }

    // 3. Activate
    const { error } = await supabase
        .from('organization_features')
        .upsert({
            organization_id: org.id,
            feature_key: featureKey,
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id, feature_key' })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/${slug}/settings/communication`)
    return { success: true }
}

export async function testAllRegions(appointmentId: string, slug: string) {
    const supabase = await createClient()
    const { data: appt } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single()

    if (!appt) return { success: false, error: "Appt not found" }

    const results = []
    const regions = Object.keys(REGION_QUESTIONNAIRE_MAP)

    for (const region of regions) {
        // Temporarily override notes to force detection
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ notes: `[TEST] Forcing Region: ${region}` })
            .eq('id', appointmentId)

        if (!updateError) {
            console.log(`[TEST] Sending message for region: ${region}`)
            const res = await sendAppointmentMessage(appointmentId, 'confirmation', slug)
            results.push({ region, success: res.success })
        }

        // Brief pause to avoid rate limiting if any
        await new Promise(r => setTimeout(r, 1000))
    }

    return { success: true, results }
}
