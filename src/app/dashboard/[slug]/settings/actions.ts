'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
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
    google_review_url?: string;
    features?: Record<string, any>;
    trial_ends_at?: string;
    status?: string;
    support_access_active?: boolean;
    support_access_until?: string;
};

export async function getClinicSettings(slug?: string) {
    try {
        const supabase = await createClient(); // For session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const adminSupabase = await createAdminClient();

        let orgId: string | undefined;
        let orgData: any = null;

        if (slug) {
            const { data: org } = await adminSupabase
                .from('organizations')
                .select('*')
                .eq('slug', slug)
                .single();
            if (org) {
                console.log(`[getClinicSettings] Found Org by Slug: ${slug} -> Name: ${org.name}`);
                orgId = org.id;
                orgData = org;
            } else {
                console.error(`[getClinicSettings] NO Org found for slug: ${slug}`);
            }
        }

        if (!orgId) {
            const { data: profile } = await adminSupabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();
            orgId = profile?.organization_id;

            if (orgId && !orgData) {
                const { data: org } = await adminSupabase
                    .from('organizations')
                    .select('*')
                    .eq('id', orgId)
                    .single();
                orgData = org;
            }
        }

        if (!orgId) return null;

        // Fetch extended settings using admin client to guarantee results
        const { data: extendedSettings } = await adminSupabase
            .from('clinic_settings')
            .select('*')
            .eq('id', orgId)
            .single();

        const finalSettings = {
            ...(extendedSettings || {}),
            id: orgId,
            name: orgData?.name || extendedSettings?.name || "Minha Clínica",
            logo_url: orgData?.logo_url || extendedSettings?.logo_url || null,
            primary_color: orgData?.primary_color || extendedSettings?.primary_color || null,
            google_review_url: extendedSettings?.google_review_url || null,
            slug: orgData?.slug || slug,
            plan: orgData?.plan,
            status: orgData?.status,
            trial_ends_at: orgData?.trial_ends_at,
            support_access_active: orgData?.support_access_active,
            support_access_until: orgData?.support_access_until,
            features: orgData?.features || extendedSettings?.features || {}
        };

        // If Access Fisioterapia, ensure all modules appear active (Master Support)
        if (orgId === '9571532e-fdf8-4aaa-b236-416fd6459566') {
            finalSettings.features = {
                ...(finalSettings.features || {}),
                agenda_module: true,
                records_module: true,
                financial_module: true,
                marketing_module: true,
                ai_assistant: true,
                advanced_reports: true,
                whatsapp_integration: true,
                teleconsultation: true,
                zapi_messaging: true,
                protocol_management: true,
                form_management: true
            };
        }

        console.log(`[getClinicSettings] Slug: ${slug} | Resolved Name: ${finalSettings.name} | Has Logo: ${!!finalSettings.logo_url}`);

        return finalSettings as unknown as ClinicSettings;

    } catch (err) {
        console.error("Critical error in getClinicSettings:", err);
        return null;
    }
}

// Use server-only is implied in actions, but good to remember
// We use the internal createAdminClient which properly uses the SERVICE ROLE key.
// This ensures that even if the user's session is weird or policies are tight, the backend can always save/fetch settings.

export async function updateClinicSettings(formData: FormData) {
    const supabase = await createAdminClient();

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
            const google_review_url = formData.get('google_review_url') as string;
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
                google_review_url,
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
            const google_review_url = formData.get('google_review_url') as string;

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
                google_review_url,
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

export async function getProfessionalExceptions(profileId: string) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('professional_schedule_exceptions')
        .select('*')
        .eq('profile_id', profileId)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching exceptions:', error);
        return [];
    }
    return data;
}

export async function saveProfessionalException(data: {
    profileId: string,
    organizationId: string,
    date: string,
    startTime: string,
    endTime: string,
    isBlocked?: boolean
}) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('professional_schedule_exceptions')
        .upsert({
            profile_id: data.profileId,
            organization_id: data.organizationId,
            date: data.date,
            start_time: data.startTime,
            end_time: data.endTime,
            is_blocked: data.isBlocked || false,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error saving exception:', error);
        throw error;
    }
    return { success: true };
}

export async function deleteProfessionalException(id: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('professional_schedule_exceptions')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}
