'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type PlanConfig = {
    id: string
    name: string
    slug: string
    max_professionals: number
    max_patients: number
    features: Record<string, boolean | number>
    is_active: boolean
}

export async function getPlans() {
    const supabase = await createClient()
    const { data: plans, error } = await supabase
        .from('plan_configs' as any)
        .select('*')
        .order('price_monthly')
        .order('created_at', { ascending: true })

    if (error) {
        console.error("Error fetching plans:", error)
        return []
    }

    return { plans: plans || [] }
}

export async function updatePlan(id: string, data: Partial<PlanConfig>) {
    const supabase = await createClient()

    // Validate Master Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // Update
    const { error } = await supabase
        .from('plan_configs' as any)
        .update({
            name: data.name,
            features: data.features,
            max_professionals: data.max_professionals,
            max_patients: data.max_patients,
            price_monthly: (data as any).price_monthly,
            price_yearly: (data as any).price_yearly,
            is_active: data.is_active
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/plans')
    revalidatePath('/admin/settings')
    return { success: true }
}

export async function createPlan(data: Omit<PlanConfig, 'id'>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('plan_configs' as any)
        .insert({
            name: data.name,
            slug: data.slug,
            features: data.features,
            max_professionals: data.max_professionals,
            max_patients: data.max_patients,
            price_monthly: (data as any).price_monthly,
            price_yearly: (data as any).price_yearly,
            is_active: true
        })

    if (error) return { error: error.message }

    revalidatePath('/admin/plans')
    revalidatePath('/admin/settings')
    return { success: true }
}

export async function deletePlan(id: string) {
    const supabase = await createClient()

    // 1. Verificação de Segurança: Existem clínicas usando este plano?
    const { count, error: countError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('plan_config_id', id)

    if (countError) return { success: false, error: "Erro ao verificar dependências." }

    if (count && count > 0) {
        return {
            success: false,
            error: `Não é possível apagar este plano. Existem ${count} clínicas vinculadas a ele. Mude o plano das clínicas primeiro.`
        }
    }

    // 2. Deletar
    const { error } = await supabase
        .from('plan_configs')
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/settings')
    return { success: true }
}

export async function getGlobalContentForPlans() {
    const supabase = await createClient()

    // Forms
    const { data: forms } = await supabase.from('form_templates').select('id, title, is_locked, type').is('organization_id', null).order('title')

    // Protocols
    const { data: protocols } = await supabase.from('clinical_protocols').select('id, title').is('user_id', null).order('title')

    // Messages
    const { data: messages } = await supabase.from('message_templates').select('id, title, trigger_type, channel').is('organization_id', null).order('title')

    return {
        forms: forms || [],
        protocols: protocols || [],
        messages: messages || []
    }
}
