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
        'appointment_reminder',
        'appointment_finished',
        'birthday',
        'post_attendance',
        'insole_delivery',
        'insole_maintenance',
        'questionnaire_12h',
        'appointment_confirmation_immediate'
    ]),
    delay_days: z.coerce.number().min(0).default(0),
    delay_hours: z.coerce.number().min(0).default(0),
    service_keywords: z.array(z.string()).default([]),
    questionnaire_type: z.string().optional(),
    max_retries: z.coerce.number().min(0).max(10).default(0),
    retry_interval_hours: z.coerce.number().min(1).default(24),
    is_active: z.boolean().default(true),
    reinforcement_8h: z.boolean().default(true),
    reinforcement_2h: z.boolean().default(true)
})

const REGION_QUESTIONNAIRE_MAP: Record<string, string[]> = {
    'Lombar': [
        '34ab93ca-2666-469c-afbe-e95778b7cdd5', // Roland-Morris
        '99c01065-3958-488d-9d55-423e9183b2d8'  // STarT Back
    ],
    'Cervical': ['b3315150-daeb-47fb-a5b3-d2a398e61f05'], // NDI
    'Ombro': ['8a7babb2-1c19-46e4-9f11-e5998552698c'], // QuickDASH
    'Cotovelo': ['8a7babb2-1c19-46e4-9f11-e5998552698c'],
    'Mão': ['8a7babb2-1c19-46e4-9f11-e5998552698c'],
    'Quadril': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'], // LEFS
    'Joelho': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
    'Tornozelo': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
    'Palmilha': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'], // [NEW] LEFS for Insoles
    'Diabetes': [
        '6579a316-aa97-4075-a133-ef9d736563a9', // MNSI
        'dd350aa4-5188-4ccb-ba24-50839308d61b'  // Diabetes Control
    ]
}

const REGION_KEYWORDS_MAP: Record<string, string[]> = {
    'Lombar': ['lombar', 'lumbago', 'ciatica', 'hernia', 'costas', 'espondilo', 'coluna', 'quadrilha'],
    'Cervical': ['cervical', 'pesco', 'torcicolo', 'nuca'],
    'Ombro': ['ombro', 'manguito', 'bursite', 'impacto', 'supraesp'],
    'Cotovelo': ['cotovelo', 'epicondilite'],
    'Mão': ['mao', 'punho', 'carpiano', 'quervain', 'dedo'],
    'Quadril': ['quadril', 'femur', 'coxo', 'bursite troc'],
    'Joelho': ['joelho', 'patela', 'menisco', 'ligamento', 'lca', 'lcp', 'condropatia', 'patelar'],
    'Tornozelo': ['tornoz', 'pe', 'calcaneo', 'fasceite', 'fascite', 'esporao', 'plantar', 'metatarsal', 'aquiles', 'talus'],
    'Palmilha': ['palmilha', 'pamilha', 'palmilhar', 'insole'],
    'Diabetes': ['diabetes', 'diabetico', 'glicem', 'neuropat', 'insulina', 'mnsi']
}

function normalize(text: string) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const QUESTIONNAIRE_TYPE_ID_MAP: Record<string, string[]> = {
    'diabetic_foot': ['6579a316-aa97-4075-a133-ef9d736563a9', 'dd350aa4-5188-4ccb-ba24-50839308d61b'],
    'spadi': ['77c68b6d-4950-482f-870b-044275f91753'],
    'lefs': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
    'dash': ['8a7babb2-1c19-46e4-9f11-e5998552698c'],
    'insoles_40d': ['178d87eb-aeba-43f6-9ec3-3487aa4d2a6e'],
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


export async function getWhatsappConfig(slug?: string, checkStatus: boolean = false) {
    try {
        // [MULTI-TENANT] Use verify organization logic
        const supabase = await createAdminClient()

        let organizationId: string | undefined

        if (slug) {
            const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
            if (org) organizationId = org.id
        }

        if (!organizationId) {
            const authClient = await createClient()
            const { data: { user } } = await authClient.auth.getUser()
            if (user) {
                const { data: profile } = await authClient.from('profiles').select('organization_id').eq('id', user.id).single()
                organizationId = profile?.organization_id
            }
        }

        if (!organizationId) return null

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

        const isFeatureActive = featureStore?.is_active || (orgData as any)?.features?.whatsapp || organizationId === '9571532e-fdf8-4aaa-b236-416fd6459566'

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

        const activeProvider = zapi ? 'zapi' : (evolution ? 'evolution' : null)
        let connectionStatus = 'unknown'

        if (checkStatus && isFeatureActive) {
            if (activeProvider === 'zapi' && zapi?.config) {
                const { instanceId, token, clientToken } = zapi.config
                try {
                    const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/status`, {
                        headers: clientToken ? { 'Client-Token': clientToken.trim() } : {}
                    })
                    const data = await res.json()
                    connectionStatus = data.connected ? 'connected' : 'disconnected'
                } catch (e) { connectionStatus = 'error' }
            } else if (activeProvider === 'evolution' && evolution?.config) {
                const { url, apiKey, instanceName } = evolution.config
                try {
                    const res = await fetch(`${url.replace(/\/$/, "")}/instance/connectionState/${instanceName}`, {
                        headers: { 'apikey': apiKey }
                    })
                    const data = await res.json()
                    connectionStatus = data.instance?.state === 'open' ? 'connected' : 'disconnected'
                } catch (e) { connectionStatus = 'error' }
            }
        }

        // Fetch Test Mode
        const { data: testMode } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('provider', 'test_mode')
            .eq('organization_id', organizationId)
            .single()

        // Fetch Settings
        const { data: settings } = await supabase
            .from('clinic_settings')
            .select('google_review_url')
            .eq('id', organizationId)
            .single()

        return {
            provider: activeProvider,
            zapi: zapi?.config,
            evolution: evolution?.config,
            testMode: testMode?.config,
            isFeatureActive,
            connectionStatus,
            google_review_url: settings?.google_review_url
        }
    } catch (e) {
        console.error("Get Config Supabase Error:", e)
        return null
    }
}


async function ensureDefaultTemplates(organizationId: string) {
    const supabase = await createAdminClient()

    const defaults = [
        {
            title: 'Boas-vindas (Imediato ao Agendar)',
            trigger_type: 'appointment_confirmation_immediate',
            content: 'Olá {{paciente}}! Boas notícias: seu agendamento na *{{clinica}}* foi realizado com sucesso. ✅\n\nEstamos ansiosos para te receber!\n\n*Detalhes:*\n📅 Data: *{{data}}* às *{{horario}}*\n👤 Profissional: *{{profissional}}*\n📍 Local: {{endereco}}\n🗺️ Link do Mapa: {{local_url}}\n\nQualquer dúvida ou necessidade de remarcação, é só nos chamar por aqui. Até logo! 👋',
            is_active: true
        },
        {
            title: 'Confirmação de Agendamento (24h antes)',
            trigger_type: 'appointment_confirmation',
            content: 'Olá {{paciente}}, seu atendimento na {{clinica}} está chegando! ✨\nGostaríamos de confirmar sua presença para amanhã ({{data}}) às {{horario}} com {{profissional}}.\n\n📍 {{endereco}}\n\n*Por favor, confirme clicando no link:*\n{{confirmacao_link}}\n\n{{links_questionarios}}',
            is_active: true
        },
        {
            title: 'Envio de Questionários (12h antes)',
            trigger_type: 'questionnaire_12h',
            content: 'Olá {{paciente}}, para agilizar seu atendimento e garantir o melhor cuidado, por favor preencha os formulários abaixo antes da sua consulta com {{profissional}}:\n\n{{links_questionarios}}',
            is_active: true
        },
        {
            title: 'Pós-Atendimento / Feedback',
            trigger_type: 'post_attendance',
            content: 'Olá {{paciente}}, como você se sentiu após o atendimento hoje com o(a) {{profissional}}? 😊\n\nSua opinião é fundamental para mantermos a excelência do nosso cuidado. Se puder, deixe uma breve avaliação no Google: {{link_avaliacao}}\n\nConte sempre conosco para o que precisar!',
            is_active: true
        },
        {
            title: 'Lembrete de Aniversário',
            trigger_type: 'birthday',
            content: 'Olá {{paciente}}, hoje o dia é todo seu! 🥳\nA equipe da {{clinica}} passa para te desejar um Feliz Aniversário! Que seu novo ciclo seja repleto de saúde, leveza e muitas conquistas.\n\nÉ um prazer ter você conosco. Aproveite muito o seu dia! 🎂✨',
            is_active: true
        }
    ]

    // Check if the organization already has ANY templates
    const { count } = await supabase
        .from('message_templates')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

    if (count !== null && count > 0) {
        return // Already has templates, don't force defaults
    }

    for (const def of defaults) {
        await supabase.from('message_templates').insert({
            ...def,
            organization_id: organizationId,
            channel: 'whatsapp'
        })
    }
}

export async function getTemplates(slug?: string) {
    const supabase = await createAdminClient()

    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id, features').eq('slug', slug).single()
        if (org) {
            await ensureDefaultTemplates(org.id)

            const allowedIds = Array.isArray(org.features?.allowed_message_templates)
                ? org.features.allowed_message_templates
                : []

            let queryMatchStr = `organization_id.eq.${org.id}`
            if (allowedIds.length > 0) {
                queryMatchStr += `,and(organization_id.is.null,id.in.(${allowedIds.map((id: string) => `"${id}"`).join(',')}))`
            }

            const { data, error } = await supabase
                .from('message_templates')
                .select('*')
                .or(queryMatchStr)
                .order('organization_id', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching templates:", error)
                return []
            }

            // Group by trigger_type and prefer the organization-specific one
            const uniqueTemplates: any[] = []
            const seenTriggers = new Set()

            data?.forEach(t => {
                if (t.trigger_type === 'manual') {
                    uniqueTemplates.push(t)
                } else if (!seenTriggers.has(t.trigger_type)) {
                    uniqueTemplates.push(t)
                    seenTriggers.add(t.trigger_type)
                }
            })

            return uniqueTemplates
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
        is_active: formData.get('is_active') === 'on',
        reinforcement_8h: formData.get('reinforcement_8h') === 'on',
        reinforcement_2h: formData.get('reinforcement_2h') === 'on',
        delay_hours: formData.get('delay_hours') || 0,
        service_keywords: formData.get('service_keywords') ? (formData.get('service_keywords') as string).split(',').map(s => s.trim()).filter(Boolean) : []
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
        is_active: formData.get('is_active') === 'on',
        reinforcement_8h: formData.get('reinforcement_8h') === 'on',
        reinforcement_2h: formData.get('reinforcement_2h') === 'on',
        delay_hours: formData.get('delay_hours') || 0,
        service_keywords: formData.get('service_keywords') ? (formData.get('service_keywords') as string).split(',').map(s => s.trim()).filter(Boolean) : []
    }

    const result = TemplateSchema.safeParse(rawData)

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message }
    }

    const supabase = await createClient()

    // Check if the template is a global template
    const { data: existing } = await supabase.from('message_templates').select('organization_id').eq('id', id).single()

    if (existing && existing.organization_id === null) {
        // It's a global template. We must create a local copy instead of updating the global one.
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

        if (!organizationId) {
            return { success: false, error: "Organização não encontrada para criar cópia local." }
        }

        const { error: insertError } = await supabase
            .from('message_templates')
            .insert({
                ...result.data,
                organization_id: organizationId
            })

        if (insertError) {
            return { success: false, error: insertError.message }
        }
    } else {
        // Normal update for local templates
        const { error } = await supabase
            .from('message_templates')
            .update(result.data)
            .eq('id', id)

        if (error) {
            return { success: false, error: error.message }
        }
    }

    if (slug) revalidatePath(`/dashboard/${slug}/settings/communication`)
    else revalidatePath('/dashboard/settings/communication')

    return { success: true }
}

export async function deleteTemplate(id: string, slug?: string) {
    const supabase = await createAdminClient()

    // Check if the template is a global template
    const { data: existing } = await supabase.from('message_templates').select('organization_id').eq('id', id).single()

    if (!existing) {
        return { success: false, error: "Modelo não encontrado." }
    }

    if (existing.organization_id === null && slug) {
        return { success: false, error: "Modelos padrão do sistema não podem ser excluídos, apenas desativados." }
    }

    const { error } = await supabase.from('message_templates').delete().eq('id', id)

    if (error) {
        console.error("Delete Template Error:", error)
        // Check for Foreign Key constraint (Postgres error 23503)
        if (error.code === '23503') {
            return {
                success: false,
                error: "Este modelo já foi utilizado em mensagens enviadas e possui histórico. Para segurança dos seus dados, ele não pode ser excluído, mas você pode desativá-lo para que não seja mais usado."
            }
        }
        return { success: false, error: error.message }
    }

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
    const supabase = await createAdminClient()

    // Fetch template
    const { data: template, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (error || !template) {
        return { success: false, error: "Modelo não encontrado." }
    }

    const whatsappConfig = await getWhatsappConfig(slug)

    let host = ""
    try {
        const { headers: nextHeaders } = await import('next/headers')
        host = nextHeaders().get('host') || ""
    } catch (e) { }
    const protocol = (host?.includes('localhost') || host?.includes('127.0.0.1')) ? 'http' : 'https'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://axiom-production.vercel.app')

    if (!whatsappConfig || !whatsappConfig.provider) {
        return { success: false, error: "WhatsApp não configurado", code: "NOT_CONFIGURED" }
    }

    if (!whatsappConfig.isFeatureActive) {
        return { success: false, error: "Funcionalidade Inativa", code: "NOT_ACTIVE" }
    }

    const googleLink = whatsappConfig?.google_review_url || "https://g.page/r/CZFUQUQVoZs8JEBM/review"

    // [NEW] Fetch real clinic/location info if available for better testing
    let realAddress = "Av. Contorno, 1234 - Clínica (Teste)"
    let realLocal = "Consultório Principal"
    let realClinicName = "Access Fisioterapia"
    let googleReview = "https://g.page/r/CZFUQUQVoZs8JEBM/review"

    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id, name').eq('slug', slug).single()
        if (org) {
            realClinicName = org.name
            // 1. Try to fetch from clinic_settings (Main Address)
            const { data: settings } = await supabase.from('clinic_settings').select('address, google_review_url').eq('id', org.id).single()
            if (settings) {
                if (settings.google_review_url) googleReview = settings.google_review_url
                if (settings.address && typeof settings.address === 'object') {
                    const addr = settings.address as any
                    realAddress = `${addr.street || ''}, ${addr.number || ''} ${addr.complement ? '- ' + addr.complement : ''} - ${addr.neighborhood || ''}`.replace(/^, /, '').replace(/ - $/, '')
                }
            }
            // 2. Fetch first location for the "room" name
            const { data: loc } = await supabase.from('locations').select('name').eq('organization_id', org.id).limit(1).maybeSingle()
            if (loc) {
                realLocal = loc.name || realLocal
            }
        }
    }

    // 1. Prepare Content (Replace Variables)
    let message = template.content
        .replace(/{{paciente}}/g, "João (Teste)")
        .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{{horario}}/g, "14:30")
        .replace(/{{profissional}}/g, "Dr. Warley (Teste)")
        .replace(/{{medico}}/g, "Dr. Warley (Teste)")
        .replace(/{{clinica}}/g, realClinicName)
        .replace(/{{servico}}/g, "Sessão de Fisioterapia")
        .replace(/{{local}}/g, realLocal)
        .replace(/{{endereco}}/g, realAddress)
        .replace(/{{local_url}}/g, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(realAddress)}`)
        .replace(/{{confirmacao_link}}/g, `${appUrl}/c/teste`)
        .replace(/{{links_questionarios}}/g, `\n- Link 1: ${appUrl}/v/123\n- Link 2: ${appUrl}/v/456`)
        .replace(/{{link_avaliacao}}/g, googleReview)

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
            message_id: (result as any).messageId,
            error_message: (result as any).error
        }).eq('id', logInfo.id)

        // Add to global Audit Log (LGPD)
        try {
            await (await import("@/lib/logger")).logAction("SEND_TEST_MESSAGE", {
                template_id: templateId,
                phone: cleanPhone,
                status: result.success ? 'sent' : 'failed'
            }, 'communications', templateId, organizationId)
        } catch (e) { }
    }

    if (slug) revalidatePath(`/dashboard/${slug}/settings/communication`)
    else revalidatePath('/dashboard/settings/communication')

    return result
}

export async function sendMessage(phone: string, message: string, injectedConfig?: any, metadata?: { patientId?: string, templateId?: string, type?: string }) {
    const supabase = await createClient()
    let config: any = null
    let destinationNumber = phone
    let finalMessage = message

    try {
        config = injectedConfig || await getWhatsappConfig()

        // --- SAFETY INTERCEPTOR ---
        if (config?.testMode?.isActive) {
            if (!config.testMode.safeNumber) {
                return { success: false, error: "Modo de Teste ativo mas sem número seguro configurado." }
            }
            destinationNumber = config.testMode.safeNumber.replace(/\D/g, '')
            finalMessage = `[MODO TESTE] Para: ${phone}\n\n${message}`
        } else {
            destinationNumber = phone.replace(/\D/g, '')
        }
        // --------------------------

        if (!config) throw new Error("WhatsApp não configurado.")

        let result: { success: boolean, messageId?: string, error?: string } = { success: false }

        if (config.provider === 'zapi' && config.zapi) {
            // Z-API
            const { instanceId, token, clientToken } = config.zapi
            const cleanClientToken = clientToken ? clientToken.trim() : ''
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(cleanClientToken ? { 'Client-Token': cleanClientToken } : {})
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
                result = { success: true, messageId: data.id || data.messageId }
            } else {
                throw new Error(JSON.stringify(data))
            }

        } else if (config.provider === 'evolution' && config.evolution) {
            // Evolution API
            const { url, apiKey, instanceName } = config.evolution
            const baseUrl = url.replace(/\/$/, "")
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

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
                result = { success: true, messageId: data.key.id }
            } else {
                throw new Error(JSON.stringify(data))
            }
        } else {
            throw new Error("Provedor não configurado corretamente.")
        }

        // --- NEW: Persistent Message Log ---
        try {
            const adminSupabase = await createAdminClient();
            await adminSupabase.from('message_logs').insert({
                phone: phone,
                message: message,
                status: 'sent',
                patient_id: metadata?.patientId,
                template_id: metadata?.templateId,
                type: metadata?.type || 'direct',
                organization_id: config?.organization_id,
                provider: config?.provider,
                message_id: result.messageId
            });
        } catch (logErr) {
            console.error("Failed to log message to table:", logErr);
        }

        // Audit Log (Success)
        try {
            await (await import("@/lib/logger")).logAction("SEND_WHATSAPP", {
                phone: destinationNumber.slice(0, 5) + '***' + destinationNumber.slice(-2),
                message_preview: message.slice(0, 30) + '...',
                status: 'success'
            }, 'communications', undefined, config?.organization_id)
        } catch (e) { }

        return result

    } catch (e: any) {
        console.error("Send Error:", e)

        // Log failure to message_logs too
        try {
            const adminSupabase = await createAdminClient();
            await adminSupabase.from('message_logs').insert({
                phone: phone,
                message: message,
                status: 'error',
                error_message: e.message || String(e),
                patient_id: metadata?.patientId,
                type: metadata?.type || 'direct',
                organization_id: config?.organization_id
            });
        } catch (logErr) { }

        // Audit Log (Failure)
        try {
            await (await import("@/lib/logger")).logAction("SEND_WHATSAPP", {
                phone: destinationNumber?.slice(0, 5) + '***' + destinationNumber?.slice(-2),
                message_preview: message?.slice(0, 30) + '...',
                status: 'error',
                error: e.message || String(e)
            }, 'communications', undefined, config?.organization_id)
        } catch (innerE) { }

        return { success: false, error: e.message || String(e) }
    }
}



export async function sendAppointmentMessage(
    appointmentId: string,
    type: 'confirmation' | 'reminder' | 'feedback' | 'appointment_confirmation_immediate' | 'appointment_confirmation' | 'appointment_confirmation_8h' | 'appointment_confirmation_2h' | 'appointment_reminder_confirmed_2h' | 'questionnaire_12h' | 'manual',
    slug?: string,
    injectedSupabase?: any,
    customText?: string,
    isConfirmed: boolean = false
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
        const { data: settings } = await supabase.from('clinic_settings').select('google_review_url, address').eq('id', orgId).single()
        org = { ...orgData, google_review_url: settings?.google_review_url, address: settings?.address }
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
        const { headers: nextHeaders } = await import('next/headers')
        host = nextHeaders().get('host') || ""
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
        // --- NEW: INTELLIGENT WATERFALL & SERVICE AWARENESS ---
        const serviceName = normalize(service?.name || "")
        const isConsulta = serviceName.includes("consulta")
        const isUnconfirmedTrigger = type.includes('confirmation') && !isConfirmed && type !== 'appointment_confirmation_immediate'

        // 1. Template Fallback: If 8h or 2h doesn't have a specific template, use the base 'appointment_confirmation'
        let triggerToFetch = triggerMap[type] || type
        const { data: hasSpecific } = await supabase
            .from('message_templates')
            .select('id, reinforcement_8h, reinforcement_2h, is_active')
            .eq('trigger_type', triggerToFetch)
            .eq('is_active', true)
            .or(`organization_id.eq.${appt.organization_id},organization_id.is.null`)
            .limit(1)

        // Block reinforcement if disabled in the primary template
        if (type === 'appointment_confirmation_8h' || type === 'appointment_confirmation_2h') {
            const { data: primary } = await supabase
                .from('message_templates')
                .select('reinforcement_8h, reinforcement_2h, is_active')
                .eq('trigger_type', 'appointment_confirmation')
                .eq('organization_id', appt.organization_id)
                .maybeSingle()

            if (primary) {
                if (type === 'appointment_confirmation_8h' && primary.reinforcement_8h === false) return { success: false, error: 'Reforço 8h desativado.' }
                if (type === 'appointment_confirmation_2h' && primary.reinforcement_2h === false) return { success: false, error: 'Reforço 2h desativado.' }
            }
        }

        if (!hasSpecific || hasSpecific.length === 0) {
            if (isUnconfirmedTrigger) {
                triggerToFetch = 'appointment_confirmation'
            }
        }

        // Fetch the actual content
        const { data: templatesRaw } = await supabase
            .from('message_templates')
            .select('*')
            .eq('trigger_type', triggerToFetch)
            .eq('is_active', true)
            .or(`organization_id.eq.${appt.organization_id},organization_id.is.null`)
            .order('organization_id', { ascending: false, nullsFirst: false })

        if (templatesRaw && templatesRaw.length > 0) {
            const fullServiceName = (service?.name || "").toLowerCase()

            // Prioritize: 
            // 1. Templates of the specific organization with matching keywords
            // 2. Templates of the specific organization without keywords (generic)
            // 3. Fallback to system templates (organization_id is null)

            const orgTemplates = templatesRaw.filter((t: any) => t.organization_id === appt.organization_id)
            const sysTemplates = templatesRaw.filter((t: any) => !t.organization_id)

            const keywordMatched = orgTemplates.find((t: any) =>
                t.service_keywords &&
                t.service_keywords.length > 0 &&
                t.service_keywords.some((k: string) => fullServiceName.includes(k.toLowerCase()))
            )

            const generic = orgTemplates.find((t: any) => !t.service_keywords || t.service_keywords.length === 0)


            // [HELPER] Address Formatter
            const formatAddress = (addr: any) => {
                if (!addr) return ''
                if (typeof addr === 'string') return addr
                // Handle JSON object
                return `${addr.street || ''}, ${addr.number || ''}${addr.complement ? ' ' + addr.complement : ''} - ${addr.neighborhood || ''}, ${addr.city || ''}/${addr.state || ''}`.replace(/^, /, '').replace(/, - , \/$/, '')
            }

            const locationAddress = formatAddress(location?.address)
            const clinicAddress = formatAddress(org?.address)
            const finalAddress = locationAddress || clinicAddress || ''

            template = keywordMatched || generic || sysTemplates[0] || templatesRaw[0]
            messageText = template.content
                .replace(/{{paciente}}/g, patientName)
                .replace(/{{data}}/g, dateStr)
                .replace(/{{horario}}/g, timeStr)
                .replace(/{{profissional}}/g, profile?.full_name || 'Profissional')
                .replace(/{{medico}}/g, profile?.full_name || 'Profissional')
                .replace(/{{clinica}}/g, org?.name || 'Access Fisioterapia')
                .replace(/{{servico}}/g, service?.name || 'Atendimento')
                .replace(/{{local}}/g, location?.name || 'Clínica')
                .replace(/{{endereco}}/g, finalAddress)
                .replace(/{{local_url}}/g, finalAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalAddress)}` : "")
                .replace(/{{confirmacao_link}}/g, finalLink)
                .replace(/{{link_avaliacao}}/g, location?.google_review_url || org?.google_review_url || "https://g.page/r/CZFQUQVoZs8JEBM/review")

            // 2. Automatic Consulta Logic
            if (isConsulta && !messageText.includes("tênis") && !messageText.includes("roupa")) {
                messageText += "\n\n💡 *Lembrete:* Para esta consulta, por favor utilize roupas leves/esportivas e traga um par de tênis para avaliação."
            }

            // --- DYNAMIC QUESTIONNAIRE INCLUSION ---
            if (messageText.includes('{{links_questionarios}}')) {
                let questionnaireLinks = ""
                const notes = normalize(appt.notes || "")
                const detectedRegions: string[] = []

                if (serviceName.includes("palmilha")) detectedRegions.push("Palmilha")

                for (const [region, keywords] of Object.entries(REGION_KEYWORDS_MAP)) {
                    if (detectedRegions.includes(region)) continue;
                    for (const keyword of keywords) {
                        if (notes.includes(keyword)) {
                            detectedRegions.push(region)
                            break;
                        }
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
                                    token: token,
                                    link_expires_at: expiresAt.toISOString(),
                                    scheduled_date: new Date().toISOString(),
                                    delivery_date: new Date().toISOString().split('T')[0]
                                })
                                .select('id')
                                .single()

                            if (followup) {
                                const fullUrl = `/avaliacao/${token}`
                                const shortened = await createShortLink(supabase, fullUrl, appUrl)
                                createdLinks.push(shortened)
                            }
                        } catch (err) { }
                    }

                    if (createdLinks.length > 0) {
                        questionnaireLinks = "\n\n*📋 Questionários Pré-Consulta (obrigatório):*\n" +
                            createdLinks.map((link, idx) => `Link ${idx + 1}: ${link}`).join('\n')
                    }
                }
                messageText = messageText.replace(/{{links_questionarios}}/g, questionnaireLinks)
            }

            // --- SPECIFIC LINKED QUESTIONNAIRE ---
            if (messageText.includes('{{link_questionario}}')) {
                let specificQuestionnaireLinks = ""
                if (template.questionnaire_type && template.questionnaire_type !== 'none') {
                    let templateIds: string[] = []
                    if (template.questionnaire_type === 'auto_link') {
                        const notes = normalize(appt.notes || "")
                        const detected: string[] = []
                        if (serviceName.includes("palmilha")) REGION_QUESTIONNAIRE_MAP["Palmilha"].forEach(id => detected.push(id))
                        for (const [region, keywords] of Object.entries(REGION_KEYWORDS_MAP)) {
                            for (const keyword of keywords) {
                                if (notes.includes(keyword)) {
                                    REGION_QUESTIONNAIRE_MAP[region].forEach(id => detected.push(id))
                                    break;
                                }
                            }
                        }
                        templateIds = Array.from(new Set(detected))
                    } else if (template.questionnaire_type.length > 20) {
                        templateIds = [template.questionnaire_type]
                    } else {
                        templateIds = QUESTIONNAIRE_TYPE_ID_MAP[template.questionnaire_type] || []
                    }

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
                                    token: token,
                                    link_expires_at: expiresAt.toISOString(),
                                    scheduled_date: new Date().toISOString(),
                                    delivery_date: new Date().toISOString().split('T')[0]
                                })
                                .select('id')
                                .single()

                            if (followup) {
                                const fullUrl = `/avaliacao/${token}`
                                const shortened = await createShortLink(supabase, fullUrl, appUrl)
                                createdLinks.push(shortened)
                            }
                        } catch (err) { }
                    }
                    specificQuestionnaireLinks = createdLinks.length > 0 ? createdLinks.join('\n') : "(Link não disponível)"
                }
                messageText = messageText.replace(/{{link_questionario}}/g, specificQuestionnaireLinks)
            }
        } else {
            // FALLBACKS
            const genericLink = finalLink || (appUrl + '/confirmar/' + appointmentId)
            if (type === 'appointment_confirmation_immediate') {
                messageText = `Olá ${patientName}, seu agendamento foi realizado para ${dateStr} às ${timeStr} com ${profile?.full_name}.`
            } else if (type === 'appointment_confirmation' || type === 'confirmation') {
                messageText = `Olá ${patientName}, seu agendamento está confirmado para ${dateStr} às ${timeStr} com ${profile?.full_name}. Confirme aqui: ${genericLink}`
            } else if (type.includes('confirmation')) {
                messageText = `Olá ${patientName}, lembramos do seu atendimento hoje às ${timeStr}. Confirme sua presença: ${genericLink}`
            } else if (type === 'questionnaire_12h') {
                messageText = `Olá ${patientName}, por favor preencha os formulários para seu atendimento com ${profile?.full_name}.`
            } else if (type === 'appointment_reminder_confirmed_2h' || type === 'reminder') {
                messageText = `Olá ${patientName}, estamos te aguardando hoje às ${timeStr}!`
            } else {
                messageText = `Olá ${patientName}, passando para lembrar do seu agendamento em ${dateStr} às ${timeStr}.`
            }
        }
    }

    if (!messageText || messageText.trim() === "") {
        console.error("[sendAppointmentMessage] Message content is empty! Using emergency fallback.")
        messageText = `Olá ${patientName}, passando para lembrar do seu agendamento em ${dateStr} às ${timeStr}.`
    }

    const cleanPhone = (patient.phone || "").replace(/\D/g, '')
    const whatsappConfig = await getWhatsappConfig(slug || org?.slug)
    const result = await sendMessage(cleanPhone, messageText, whatsappConfig)

    try {
        await supabase.from('message_logs').insert({
            appointment_id: appointmentId,
            trigger_type: type,
            patient_id: appt.patient_id,
            template_id: template?.id,
            phone: cleanPhone,
            content: messageText,
            status: result.success ? 'sent' : 'failed',
            message_id: (result as any).messageId,
            error_message: (result as any).error,
            organization_id: appt.organization_id
        })

        try {
            await (await import("@/lib/logger")).logAction("SEND_NOTIFICATION", {
                type,
                appointment_id: appointmentId,
                status: result.success ? 'sent' : 'failed'
            }, 'communications', appointmentId, appt.organization_id)
        } catch (e) { }
    } catch (logErr) { }

    return result.success ? { success: true, messageId: (result as any).messageId, usedTemplate: template ? template.title : "Fallback" } : result
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
