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

export async function getClinicSettings() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // 1. Get User's Organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        const orgId = profile?.organization_id;

        // 2. Fetch Legacy Settings (Address, CNPJ)
        // Ideally checking org_id if column exists, else take first (legacy behavior for now)
        const { data: settings } = await supabase
            .from('clinic_settings')
            .select('*')
            .single();

        // 3. Fetch Organization SaaS Data (Features, Plan Colors)
        let orgFeatures = {};
        let orgData = {};

        if (orgId) {
            const { data: org } = await supabase
                .from('organizations')
                .select('features, name, primary_color, logo_url, plan, trial_ends_at, status')
                .eq('id', orgId)
                .single();

            if (org) {
                orgFeatures = (org as any).features || {};
                orgData = org;
            }
        }

        // 4. Merge: Organization data overrides legacy single-tenant settings where applicable
        // This ensures the SaaS Plan controls the features and branding
        return {
            ...settings,
            ...orgData,
            features: orgFeatures
        } as unknown as ClinicSettings;

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

    // 1. Verify User Identity & Master Privilege
    const cookieSupabase = await createClient();
    const { data: { user } } = await cookieSupabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Usuário não autenticado.' };
    }

    // STRICT MASTER CHECK: wmelot@gmail.com
    if (user.email !== 'wmelot@gmail.com' && user.email !== 'accessfisio@gmail.com') {
        const { data: role } = await cookieSupabase.from('profiles').select('roles(name)').eq('id', user.id).single();
        const roleName = (role as any)?.roles?.name;
        // Also allow if Role Name is explicitly 'Master', but email check is safest as requested.
        if (roleName !== 'Master') {
            return { success: false, message: 'Acesso negado. Apenas o Master pode alterar configurações da clínica (Whitelabel).' };
        }
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
            address, // Supabase client handles JSON serialization automatically
            updated_at: new Date().toISOString()
        };

        // Check internal ID or just fetch single
        const { data: existing, error: fetchError } = await supabase.from('clinic_settings').select('id').single();

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

        if (error) {
            console.error('Supabase Admin Error:', error);
            throw new Error(error.message);
        }

        revalidatePath('/dashboard/settings');
        return { success: true, message: 'Configurações salvas com sucesso!' };

    } catch (error: any) {
        console.error('Error saving settings (Admin):', error);
        return { success: false, message: `Falha ao salvar: ${error.message || 'Erro desconhecido'}` };
    }
}
