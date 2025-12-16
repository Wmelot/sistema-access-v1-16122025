
'use server'

import { createClient } from "@/lib/supabase/server"
import { hasPermission } from "@/lib/rbac"
import { generateApiKey, generateSecureToken } from "@/lib/crypto"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

export async function getIntegrations() {
    const can = await hasPermission('system.manage_apis')
    if (!can) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('api_integrations')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching integrations:", error)
        return []
    }
    return data
}

export async function createIntegration(serviceName: string) {
    const can = await hasPermission('system.manage_apis')
    if (!can) return { error: "Sem permissão." }

    const supabase = await createClient()

    // Check duplicate
    const { data: existing } = await supabase.from('api_integrations').select('id').eq('service_name', serviceName).single()
    if (existing) return { error: "Já existe uma integração com este nome." }

    const { error } = await supabase.from('api_integrations').insert({
        service_name: serviceName,
        credentials: {},
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

    // Fetch current credentials
    const { data: current, error: fetchError } = await supabase
        .from('api_integrations')
        .select('credentials')
        .eq('id', id)
        .single()

    if (fetchError || !current) return { error: "Integração não encontrada." }

    const newSecret = generateApiKey("sk_live_")
    const newCredentials = {
        ...current.credentials,
        [keyName]: newSecret,
        [`${keyName}_generated_at`]: new Date().toISOString()
    }

    const { error } = await supabase
        .from('api_integrations')
        .update({ credentials: newCredentials })
        .eq('id', id)

    if (error) return { error: "Erro ao salvar chave." }

    await logAction("ROTATE_API_KEY", { id, keyName })
    revalidatePath('/dashboard/settings/system/apis')
    return { success: true, secret: newSecret }
}

export async function deleteIntegration(id: string) {
    const can = await hasPermission('system.manage_apis')
    if (!can) return { error: "Sem permissão." }

    const supabase = await createClient()
    const { error } = await supabase.from('api_integrations').delete().eq('id', id)

    if (error) return { error: "Erro ao excluir." }

    await logAction("DELETE_INTEGRATION", { id })
    revalidatePath('/dashboard/settings/system/apis')
    return { success: true }
}
