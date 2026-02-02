'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

interface CreateTenantDTO {
    name: string
    slug: string
    plan?: string
    id?: string // For Update
}

export async function createTenant({ name, slug, plan = 'free', id }: CreateTenantDTO) {
    const supabase = await createClient()

    try {
        // Validation (Basic)
        if (!name || !slug) {
            return { success: false, error: "Nome e Slug são obrigatórios" }
        }

        let query;
        if (id) {
            // UPDATE
            query = supabase
                .from('organizations')
                .update({
                    name,
                    plan,
                    // slug: slug, // Pending migration
                })
                .eq('id', id)
        } else {
            // Fetch Plan Config Logic
            const { data: planConfig } = await supabase
                .from('plan_configs' as any)
                .select('id, features')
                .eq('slug', plan)
                .single();
            const pc: any = planConfig
            const planRef = pc?.id || null;
            const featuresToUse = pc?.features || {};

            // INSERT
            query = supabase
                .from('organizations')
                .insert({
                    name,
                    plan,
                    plan_config_id: planRef,
                    features: featuresToUse, // Redundant but safe initial value
                    primary_color: '#000000'
                })
        }

        const { data: plans } = await supabase.from('plan_configs' as any).select('*').order('price')

        const { data, error } = await query.select().single()

        if (error) {
            console.error("Create/Update Tenant Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/admin/tenants')
        return { success: true, data }
    } catch (error: any) {
        console.error("Unexpected Error:", error)
        return { success: false, error: error.message || "Erro desconhecido" }
    }
}

export async function switchOrganization(targetOrgId: string) {
    const supabase = await createClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error("Usuário não autenticado")

        // Update User Profile to point to new Org
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ organization_id: targetOrgId })
            .eq('id', user.id)

        if (updateError) throw updateError;

    } catch (error: any) {
        console.error("Switch Org Error:", error)
        return { success: false, error: error.message + (error.code ? ` (Code: ${error.code})` : "") }
    }

    revalidatePath('/', 'layout'); // Aggressive cache clearing
    revalidatePath('/dashboard');

    // Redirect outside try/catch because logic throws Next.js redirection error
    // redirect('/dashboard') -- Changed to Client Side Redirect for reliability
    return { success: true }
}

export async function backToMaster() {
    const supabase = await createClient()
    const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001'

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error("Usuário não autenticado")

        // Security Check: Only allow Master Admin emails
        const masterEmails = ['accessfisio@gmail.com', 'wmelot@gmail.com', 'warley@gmail.com'];
        if (!masterEmails.includes(user.email || '')) {
            throw new Error("Acesso negado. Apenas o Master Admin pode realizar esta ação.")
        }

        // Update User Profile to point back to Master Org
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ organization_id: MASTER_ORG_ID })
            .eq('id', user.id)

        if (updateError) throw updateError;

    } catch (error: any) {
        console.error("Back to Master Error:", error)
        return { success: false, error: error.message }
    }

    // Redirect
    // redirect('/admin') -- Changed to Client Side Redirect
    return { success: true }
}

export async function deleteTenant(orgId: string, password: string) {
    const supabase = await createClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error("Usuário não autenticado")

        // 1. Verify Password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password
        })

        if (signInError) {
            return { success: false, error: "Senha incorreta. Exclusão abortada." }
        }

        // 2. Perform Soft Deletion (Move to Trash)
        // Instead of deleting, we update the status to 'deleted'
        const adminSupabase = await createAdminClient()
        const { error: deleteError } = await adminSupabase
            .from('organizations')
            .update({
                status: 'deleted',
                // Guardamos a data da exclusão se quisermos limpar após 30 dias automaticamente depois
                // updated_at: new Date().toISOString() 
            })
            .eq('id', orgId)

        if (deleteError) throw deleteError;

        revalidatePath('/admin/tenants')
        revalidatePath('/admin')
        return { success: true }

    } catch (error: any) {
        console.error("Delete Tenant Error:", error)
        return { success: false, error: error.message || "Falha ao excluir clínica" }
    }
}

export async function restoreTenant(orgId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('organizations')
        .update({ status: 'active' })
        .eq('id', orgId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/tenants')
    return { success: true }
}
