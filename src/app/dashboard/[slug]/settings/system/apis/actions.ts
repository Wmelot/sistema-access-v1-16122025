
'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { hasPermission } from "@/lib/rbac"
import { generateApiKey, generateSecureToken } from "@/lib/crypto"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

export async function getIntegrations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get organizationId
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    const { data, error } = await supabase
        .from('api_integrations' as any)
        .select('*')
        .eq('organization_id', organizationId) // MT Isolation
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching integrations:", error)
        return []
    }
    return data
}

export async function saveAsaasConfig(apiKey: string, slug?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    let organizationId: string | undefined
    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) organizationId = org.id
    }

    if (!organizationId) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        organizationId = profile?.organization_id
    }

    if (!organizationId) return { error: "Organização não localizada" }

    const adminSupabase = await createAdminClient()

    try {
        const { data: existing } = await adminSupabase.from('api_integrations')
            .select('id')
            .eq('provider', 'asaas')
            .eq('organization_id', organizationId)
            .maybeSingle()

        const config = { api_key: apiKey }

        if (existing) {
            await adminSupabase.from('api_integrations')
                .update({ config, is_active: true, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
        } else {
            await adminSupabase.from('api_integrations')
                .insert({
                    provider: 'asaas',
                    config,
                    is_active: true,
                    organization_id: organizationId
                })
        }

        if (slug) revalidatePath(`/dashboard/${slug}/settings`)
        revalidatePath('/dashboard/settings')

        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function getAsaasConfig(slug?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    let organizationId: string | undefined
    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) organizationId = org.id
    }

    if (!organizationId) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        organizationId = profile?.organization_id
    }

    if (!organizationId) return null

    const { data } = await supabase
        .from('api_integrations')
        .select('config, is_active')
        .eq('provider', 'asaas')
        .eq('organization_id', organizationId)
        .maybeSingle()

    return data
}

export async function createIntegration(serviceName: string) {
    const can = await hasPermission('system.manage_apis')
    if (!can) return { error: "Sem permissão." }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Strict Master Lock
    if (user?.email !== 'accessfisio@gmail.com') {
        return { error: "Apenas o usuário Master pode gerenciar integrações." }
    }

    // Check duplicate
    const { data: existing } = await supabase.from('api_integrations' as any).select('id').eq('provider', serviceName).single()
    if (existing) return { error: "Já existe uma integração com este nome." }

    const { error } = await supabase.from('api_integrations' as any).insert({
        provider: serviceName,
        config: {},
        is_active: true
    })

    if (error) return { error: "Erro ao criar integração." }

    await logAction("CREATE_INTEGRATION", { serviceName })
    revalidatePath('/dashboard/settings/system/apis')
    return { success: true }
}

export async function generateSecret(id: string, keyName: string = 'secret_key') {
    const can = await hasPermission('system.manage_apis')
    if (!can) return { error: "Sem permissão." }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Strict Master Lock
    if (user?.email !== 'accessfisio@gmail.com') {
        return { error: "Apenas o usuário Master pode gerenciar chaves." }
    }

    // Fetch current config
    const { data: current, error: fetchError } = await supabase
        .from('api_integrations' as any)
        .select('config')
        .eq('id', id)
        .single()

    if (fetchError || !current) return { error: "Integração não encontrada." }

    const newSecret = generateApiKey("sk_live_")
    const newConfig = {
        ...(current as any).config,
        [keyName]: newSecret,
        [`${keyName}_generated_at`]: new Date().toISOString()
    }

    const { data: updated, error } = await supabase
        .from('api_integrations' as any)
        .update({ config: newConfig })
        .eq('id', id)
        .select()
        .single()

    if (error) return { error: "Erro ao salvar chave." }

    await logAction("ROTATE_API_KEY", { id, keyName })
    revalidatePath('/dashboard/settings/system/apis')

    return { success: true, secret: newSecret }
}

export async function deleteIntegration(id: string) {
    const can = await hasPermission('system.manage_apis')
    if (!can) return { error: "Sem permissão." }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Strict Master Lock
    if (user?.email !== 'accessfisio@gmail.com') {
        return { error: "Apenas o usuário Master pode excluir integrações." }
    }

    const { error } = await supabase.from('api_integrations' as any).delete().eq('id', id)

    if (error) return { error: "Erro ao excluir." }

    await logAction("DELETE_INTEGRATION", { id })
    revalidatePath('/dashboard/settings/system/apis')
    return { success: true }
}
