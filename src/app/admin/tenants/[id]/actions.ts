'use server';

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { verifyAdminPassword } from "@/actions/admin-password";

export async function getTenantDetails(id: string) {
    const supabase = createAdminClient();

    console.log(`[getTenantDetails] Fetching for ID: ${id}`);
    console.log(`[getTenantDetails] Service Key present: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

    // 1. Fetch Organization 
    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !org) {
        console.error(`[getTenantDetails] FATAL ERROR for ID ${id}:`, JSON.stringify(error, null, 2));
        return { error: "Organization not found" };
    }

    // 1b. Fetch Plan Config manually to avoid Schema Cache issues with Joins
    let planConfig = null;
    const orgData = org as any; // Cast to any to bypass missing type definition for plan_config_id
    if (orgData.plan_config_id) {
        // Cast supabase to any to query table not in auto-generated types if necessary
        const { data: pc } = await (supabase as any)
            .from('plan_configs')
            .select('id, name, slug, features, max_professionals')
            .eq('id', orgData.plan_config_id)
            .single();
        planConfig = pc;
    }

    // Attach plan_config to org object for compatibility
    orgData.plan_config = planConfig;

    console.log(`[getTenantDetails] Found org: ${org?.name}`);

    // 2. Fetch Aggregated Metrics (Real-time count)
    // We need to switch context or use admin client to count users/appts for this specific org?
    // Actually, RLS might block us if we just query 'profiles' without being that org.
    // BUT we are Super Admin (Master). We can use createAdminClient OR rely on the fact we are Master.
    // Let's us createAdminClient for safety and consistent access.

    // TODO: Implement specific counting logic if RLS blocks standard queries.
    // For now, let's assume we can query by filtering organization_id if we are Master.

    const { count: patientCount } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', id);

    const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', id);

    // 2c. Fetch ALL Profiles (for Staff List) - [NEW]
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at, active') // active might be inferred or distinct
        .eq('organization_id', id)
        .order('full_name', { ascending: true });

    const { count: professionalCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', id);

    // 3. Fetch Owner/Admin Profile
    // Trying to find a profile with role 'admin' or 'owner', or falling back to the oldest created profile.
    let ownerProfile = null;

    // First try: specific role if exists (common pattern)
    const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .eq('organization_id', id)
        // .eq('role', 'admin') // Uncomment if role column exists and is used
        .order('created_at', { ascending: true }) // Oldest user is likely owner
        .limit(1);

    if (adminProfiles && adminProfiles.length > 0) {
        ownerProfile = adminProfiles[0];
    }

    return {
        org,
        owner: ownerProfile,
        metrics: {
            patients: patientCount || 0,
            appointments: appointmentCount || 0,
            professionals: professionalCount || 0
        },
        profiles: allProfiles || [] // Return the list of profiles
    };
}

export async function toggleTenantStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient(); // Or admin client? createClient works if Master.

    // Interpret current "boolean" status implies we toggle between 'active' and 'suspended'
    const newStatus = currentStatus ? 'suspended' : 'active';

    // We update BOTH for backward compatibility until boolean is dropped, or just status
    const { error } = await supabase
        .from('organizations')
        .update({ status: newStatus, active: !currentStatus } as any)
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath(`/admin/tenants/${id}`);
    revalidatePath('/admin/tenants');
    return { success: true };
}

export async function deleteTenantSafely(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/tenants');
    return { success: true };
}

export async function updateTenantResponsible(tenantId: string, email: string, password: string) {
    // 0. Verify Master Password
    const isVerified = await verifyAdminPassword(password);
    if (!isVerified) {
        return { error: 'Senha administrativa incorreta. Ação abortada.' };
    }

    const supabase = createAdminClient();

    // 1. Find user by email in public.profiles (assuming sync)
    const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (searchError || !profile) {
        return { error: 'Usuário não encontrado com este e-mail.' };
    }

    // 2. Update the user to be the admin of this tenant
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            organization_id: tenantId,
            role: 'admin'
        })
        .eq('id', profile.id);

    if (updateError) {
        return { error: `Erro ao vincular usuário: ${updateError.message}` };
    }

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}

export async function forceSuperAdminClaim(tenantId: string) {
    const supabase = createAdminClient();

    // 1. Find the Master User (Warley)
    const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'wmelot@gmail.com')
        .single();

    if (searchError || !profile) {
        return { error: 'Super Admin "wmelot@gmail.com" não encontrado no sistema.' };
    }

    // 2. Force link to this tenant
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            organization_id: tenantId,
            role: 'admin'
        })
        .eq('id', profile.id);

    if (updateError) {
        return { error: `Erro ao forçar vínculo: ${updateError.message}` };
    }

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}

export async function updateTenantFeatures(tenantId: string, features: any) {
    const supabase = createAdminClient();

    // First get current org to merge or just replace? 
    // Usually we update the 'features' column (jsonb)

    const { error } = await supabase
        .from('organizations')
        .update({ features: features } as any)
        .eq('id', tenantId);

    if (error) {
        return { error: `Erro ao atualizar recursos: ${error.message}` };
    }

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}
export async function updateTenantPlan(tenantId: string, planId: string) {
    const supabase = createAdminClient();

    // 1. Fetch the new plan config to get its default features
    const { data: planConfig } = await (supabase as any)
        .from('plan_configs')
        .select('*')
        .eq('id', planId)
        .single();

    if (!planConfig) return { error: "Plano não encontrado." };

    // 2. Update the organization with the new plan and its default features
    const { error } = await supabase
        .from('organizations')
        .update({
            plan_config_id: planId,
            plan: planConfig.slug, // Sync legacy plan slug
            features: planConfig.features // Reset features to plan defaults? Usually yes for a clean switch.
        } as any)
        .eq('id', tenantId);

    if (error) return { error: `Erro ao atualizar plano: ${error.message}` };

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}

export async function getAvailablePlans() {
    const supabase = createAdminClient();
    const { data } = await (supabase as any)
        .from('plan_configs')
        .select('id, name, slug')
        .order('name');
    return data || [];
}

// --- GRANULAR ACCESS CONTROLS ---

export async function getTenantFormAccess(tenantId: string) {
    const supabase = createAdminClient();
    const { data: allowed } = await supabase.from('organization_form_access').select('form_template_id').eq('organization_id', tenantId);
    const { data: all } = await supabase.from('form_templates').select('id, title').order('title');
    return {
        all: all || [],
        allowedIds: (allowed || []).map(a => a.form_template_id)
    };
}

export async function toggleFormAccess(tenantId: string, templateId: string, allowed: boolean) {
    const supabase = createAdminClient();
    if (allowed) {
        await supabase.from('organization_form_access').insert({ organization_id: tenantId, form_template_id: templateId });
    } else {
        await supabase.from('organization_form_access').delete().match({ organization_id: tenantId, form_template_id: templateId });
    }
    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}

export async function getTenantProtocolAccess(tenantId: string) {
    const supabase = createAdminClient();
    const { data: allowed } = await supabase.from('organization_protocol_access').select('protocol_id').eq('organization_id', tenantId);

    // Fetch system protocols from DB if any, plus custom ones from Master
    const { data: all } = await supabase.from('clinical_protocols').select('id, title').order('title');

    return {
        all: all || [],
        allowedIds: (allowed || []).map(a => a.protocol_id)
    };
}

export async function toggleProtocolAccess(tenantId: string, protocolId: string, allowed: boolean) {
    const supabase = createAdminClient();
    if (allowed) {
        await supabase.from('organization_protocol_access').insert({ organization_id: tenantId, protocol_id: protocolId });
    } else {
        await supabase.from('organization_protocol_access').delete().match({ organization_id: tenantId, protocol_id: protocolId });
    }
    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}
// --- Z-API CONFIGURATION ---

export async function getTenantZapiConfig(tenantId: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('organization_id', tenantId)
        .eq('provider', 'zapi')
        .maybeSingle();

    return data;
}

export async function saveTenantZapiConfig(tenantId: string, zapiConfig: any) {
    const supabase = createAdminClient();

    // Check if exists
    const { data: existing } = await supabase
        .from('api_integrations')
        .select('id')
        .eq('organization_id', tenantId)
        .eq('provider', 'zapi')
        .maybeSingle();

    if (existing) {
        await supabase.from('api_integrations').update({
            config: zapiConfig,
            is_active: true,
            updated_at: new Date().toISOString()
        }).eq('id', existing.id);
    } else {
        await supabase.from('api_integrations').insert({
            organization_id: tenantId,
            provider: 'zapi',
            config: zapiConfig,
            is_active: true
        });
    }

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true };
}
