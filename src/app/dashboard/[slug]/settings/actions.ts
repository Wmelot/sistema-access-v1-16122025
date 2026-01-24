'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ClinicSettings = {
    id: string;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip: string;
    };
    logo_url?: string;
    document_logo_url?: string;
    primary_color?: string;
    pix_key?: string;
    features?: Record<string, any>;
    trial_ends_at?: string;
    status?: string;
};

export async function getClinicSettings(slug?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // 1. Resolve Organization ID
        let orgId: string | undefined;
        let orgData: any = {};

        if (slug) {
            const { data: org } = await supabase
                .from('organizations')
                .select('id, name, primary_color, logo_url, plan, trial_ends_at, status, slug')
                .eq('slug', slug)
                .single();

            if (org) {
                orgData = org;
                orgId = org.id;
            } else {
                console.error(`getClinicSettings: Slug '${slug}' provided but no org found.`);
                return null; // Layout will handle null checks
            }
        } else {
            // Get from User Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();
            orgId = profile?.organization_id;

            if (orgId) {
                const { data: org } = await supabase
                    .from('organizations')
                    .select('id, name, primary_color, logo_url, plan, trial_ends_at, status')
                    .eq('id', orgId)
                    .single();
                if (org) orgData = org;
            }
        }

        // 2. Fetch Extended Settings (Address, CNPJ, etc.)
        // We now expect clinic_settings to share the SAME ID as the organization for tenants.
        let extendedSettings: any = {};
        if (orgId) {
            const { data: settings } = await supabase
                .from('clinic_settings')
                .select('*')
                .eq('id', orgId) // KEY CHANGE: Matching ID
                .single();

            if (settings) extendedSettings = settings;
        } else {
            // Fallback for purely legacy no-org scenario?
            // Likely unused in strict multi-tenant, but keeping safe basic fetch
            const { data: settings } = await supabase.from('clinic_settings').select('*').limit(1).single();
            if (settings) extendedSettings = settings;
        }

        // 3. Final Merge Strategy:
        // Organization (branding) OVERRIDES ClinicSettings (details)
        const finalSettings = {
            ...extendedSettings,
            // Explicitly force clinic-wide branding from the organizations table
            id: orgId,
            name: orgData.name || extendedSettings.name || "Minha Clínica",
            logo_url: orgData.logo_url || extendedSettings.logo_url || null,
            primary_color: orgData.primary_color || extendedSettings.primary_color || null,
            slug: orgData.slug || slug,
            plan: orgData.plan,
            status: orgData.status,
            trial_ends_at: orgData.trial_ends_at
        };

        return finalSettings as unknown as ClinicSettings;

    } catch (err) {
        console.error("Error in getClinicSettings:", err);
        return null;
    }
}

import { createClient as createAdminClient } from '@supabase/supabase-js';

// use 'server-only' is implied in actions, but good to remember
// We use the SERVICE ROLE key here to bypass RLS policies on this critical configuration table.
// This ensures that even if the user's session is weird or policies are tight, the backend can always save the settings.

// REMOVED PG IMPORT AND POOL because it causes connection errors if DATABASE_URL is not perfect.
// Using Supabase Client (HTTP) is safer and consistent with the rest of the app.
// We previously used PG to bypass schema cache, but since we fixed the schema with "NOTIFY pgrst", Supabase Client is now fine.

export async function updateClinicSettings(formData: FormData) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const cookieSupabase = await createClient();
    const { data: { user } } = await cookieSupabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Usuário não autenticado.' };
    }

    const slug = formData.get('slug') as string;

    // Permissions Check
    // 1. If Master (hardcoded emails or role), allow everything.
    // 2. If not Master, check if user belongs to the organization (Slug) and has 'owner' or 'admin' role.
    // Simplifying for now: using the existing check but allowing context.

    // STRICT MASTER CHECK: wmelot@gmail.com
    let isMaster = false;
    if (user.email === 'wmelot@gmail.com' || user.email === 'accessfisio@gmail.com') {
        isMaster = true;
    } else {
        const { data: role } = await cookieSupabase.from('profiles').select('roles(name)').eq('id', user.id).single();
        const roleName = (role as any)?.roles?.name;
        if (roleName === 'Master') isMaster = true;
    }

    // Determine target context
    if (slug) {
        // We are updating a specific Tenant (Organization)

        // 1. Resolve Organization ID from Slug
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single();

        if (orgError || !orgData) {
            return { success: false, message: 'Organização não encontrada.' };
        }

        const orgId = orgData.id;

        // Permissions Check (Simplified for speed, assuming Layout protection or Basic User/Master check)
        if (!isMaster) {
            // Verify user belongs to this org
            const { data: profile } = await cookieSupabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile?.organization_id !== orgId) {
                return { success: false, message: 'Acesso negado para esta organização.' };
            }
        }

        try {
            const name = formData.get('name') as string;
            const primary_color = formData.get('primary_color') as string;
            const logo_url = formData.get('logo_url') as string;
            const document_logo_url = formData.get('document_logo_url') as string;

            // Gather Extended Settings
            const cnpj = formData.get('cnpj') as string;
            const email = formData.get('email') as string;
            const phone = formData.get('phone') as string;
            const website = formData.get('website') as string;
            const pix_key = formData.get('pix_key') as string;
            const address = {
                street: formData.get('address.street'),
                number: formData.get('address.number'),
                complement: formData.get('address.complement'),
                neighborhood: formData.get('address.neighborhood'),
                city: formData.get('address.city'),
                state: formData.get('address.state'),
                zip: formData.get('address.zip'),
            };

            // 0. CHECK FOR EXISTING CNPJ
            // We want to avoid two different organizations having the same CNPJ.
            if (cnpj && cnpj.trim().length > 0) {
                const { data: existingCnpjOrg } = await supabase
                    .from('clinic_settings')
                    .select('id')
                    .eq('cnpj', cnpj)
                    .neq('id', orgId) // Must be DIFFERENT from current
                    .single();

                if (existingCnpjOrg) {
                    return { success: false, message: 'Este CNPJ já está cadastrado em outra organização.' };
                }
            }

            // 1. Update Branding in Organizations Table
            const orgPayload: any = {
                name,
                primary_color,
                logo_url,
                updated_at: new Date().toISOString()
            };

            const { error: updError } = await supabase
                .from('organizations')
                .update(orgPayload)
                .eq('id', orgId);

            if (updError) throw updError;

            // 2. Upsert Extended Settings in Clinic Settings Table
            // Strategy: Use organization.id as clinic_settings.id to link them 1:1
            const settingsPayload = {
                id: orgId, // LINKAGE KEY
                name, // Sync name
                primary_color, // Sync color
                logo_url, // Sync logo
                document_logo_url,
                cnpj,
                email,
                phone,
                website,
                pix_key,
                address,
                updated_at: new Date().toISOString()
            };

            const { error: settingsError } = await supabase
                .from('clinic_settings')
                .upsert(settingsPayload);

            if (settingsError) throw settingsError;

            revalidatePath(`/dashboard/${slug}`);
            revalidatePath(`/dashboard/${slug}`, 'layout');
            revalidatePath(`/dashboard/${slug}/settings`);
            revalidatePath(`/dashboard/${slug}/settings`, 'page');
            return { success: true, message: 'Identidade da Clínica salva com sucesso!' };

        } catch (error: any) {
            console.error('Error updating Organization:', error);
            return { success: false, message: `Falha ao salvar: ${error.message}` };
        }

    } else {

        // LEGACY SINGLE TENANT MODE (Updates clinic_settings table)
        if (!isMaster) {
            return { success: false, message: 'Acesso negado (Modo Legacy).' };
        }

        try {
            const name = formData.get('name') as string;
            const cnpj = formData.get('cnpj') as string;
            const email = formData.get('email') as string;
            const phone = formData.get('phone') as string;
            const website = formData.get('website') as string;
            const primary_color = formData.get('primary_color') as string;
            const logo_url = formData.get('logo_url') as string;
            const document_logo_url = formData.get('document_logo_url') as string;
            const pix_key = formData.get('pix_key') as string;

            // Address handling
            const address = {
                street: formData.get('address.street'),
                number: formData.get('address.number'),
                complement: formData.get('address.complement'),
                neighborhood: formData.get('address.neighborhood'),
                city: formData.get('address.city'),
                state: formData.get('address.state'),
                zip: formData.get('address.zip'),
            };

            const payload = {
                name,
                cnpj,
                email,
                phone,
                website,
                primary_color,
                logo_url,
                document_logo_url,
                pix_key,
                address,
                updated_at: new Date().toISOString()
            };

            // Check internal ID or just fetch single
            const { data: existing } = await supabase.from('clinic_settings').select('id').single();

            let error;
            if (existing?.id) {
                const { error: updError } = await supabase
                    .from('clinic_settings')
                    .update(payload)
                    .eq('id', existing.id);
                error = updError;
            } else {
                const { error: insError } = await supabase
                    .from('clinic_settings')
                    .insert([payload]);
                error = insError;
            }

            if (error) throw error;

            revalidatePath('/dashboard/settings');
            return { success: true, message: 'Configurações salvas com sucesso!' };

        } catch (error: any) {
            console.error('Error saving settings (Admin):', error);
            return { success: false, message: `Falha ao salvar: ${error.message || 'Erro desconhecido'}` };
        }
    }
}
