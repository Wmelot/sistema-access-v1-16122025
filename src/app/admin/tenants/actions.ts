'use server'

import { createClient } from "@/lib/supabase/server"
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

        // Security Check: Only allow if email is accessfisio@gmail.com (Master)
        // Ideally we check a 'is_superuser' claim, but email is the hardcoded identifier for now
        if (user.email !== 'accessfisio@gmail.com') {
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

        // 2. Perform Deletion
        // Security: Ensure user is Master Admin or owner? 
        // For now, assuming Master Admin is performing this via /admin

        // [FIX] Update: Manually delete dependencies because CASCADE might not be configured on DB
        // 1. Delete Service Professionals (Linked to profiles) - Need to find profiles first or use CASCADE if set.
        // Let's assume we delete profiles, and profiles -> service_professionals should cascade? 
        // If not, we iterate. Safe bet: Delete Profiles directly linked to Org. 
        // Note: 'auth.users' are separate. Deleting profile does NOT delete auth user effectively without triggers.
        // We will just Unlink/Delete profiles from public schema. Auth users remain 'orphaned' or we delete them too (Harder without Admin API loop).

        // Delete Clinic Settings
        await supabase.from('clinic_settings').delete().eq('id', orgId);

        // Delete Profiles (This might fail if they have appointments etc. - True Cascade needed)
        // Ideally: await supabase.from('profiles').delete().eq('organization_id', orgId);
        // But let's try deleting the Organization and rely on DB constraints or handle error.

        // If foreign key error persists, we must delete children.
        const { error: deleteProfilesError } = await supabase
            .from('profiles')
            .delete()
            .eq('organization_id', orgId);

        if (deleteProfilesError) {
            console.warn("Could not delete profiles (might be referenced):", deleteProfilesError);
            // Verify if we can proceed or throw
            // If profiles exist, org delete will fail.
        }

        const { error: deleteError } = await supabase
            .from('organizations')
            .delete()
            .eq('id', orgId)

        if (deleteError) throw deleteError;

        revalidatePath('/admin/tenants')
        return { success: true }

    } catch (error: any) {
        console.error("Delete Tenant Error:", error)
        return { success: false, error: error.message || "Falha ao excluir clínica" }
    }
}
