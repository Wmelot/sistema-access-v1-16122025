'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import slugify from 'slugify'

export type SignUpState = {
    message?: string
    error?: string
    success?: boolean
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    return !data // Return true if NO data found (slug is available)
}

export async function registerClinic(prevState: SignUpState, formData: FormData): Promise<SignUpState> {
    const clinicName = formData.get('clinicName') as string
    const professionalName = formData.get('professionalName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Auto-generate slug 
    let slug = formData.get('slug') as string
    if (!slug) {
        slug = slugify(clinicName, { lower: true, strict: true })
    }

    if (!email || !password || !clinicName || !professionalName) {
        return { error: 'Todos os campos são obrigatórios' }
    }

    console.log('[RegisterClinic] Starting registration for:', email);
    console.log('[RegisterClinic] Service Key Present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const supabaseAdmin = createAdminClient()

        // 1. Create Supabase Auth User
        console.log('[RegisterClinic] Creating Auth User...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: professionalName }
        });

        if (authError) {
            console.error('ERRO COMPLETO (Auth):', JSON.stringify(authError, null, 2));
            return { error: `Erro na autenticação: ${authError.message} (Code: ${authError.status || 'unknown'})` };
        }

        const userId = authData.user.id;
        console.log('[RegisterClinic] User Created:', userId);

        // 2. Calculate Trial Date & Get Plan
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const { data: planConfig } = await supabaseAdmin
            .from('plan_configs' as any)
            .select('id')
            .eq('slug', 'basic')
            .single();

        // 3. Create Organization
        console.log('[RegisterClinic] Creating Organization...');
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: clinicName,
                slug: slug,
                plan: 'basic',
                plan_config_id: (planConfig as any)?.id || null,
                status: 'active',
                active: true,
                trial_ends_at: trialEndsAt.toISOString(),
            })
            .select()
            .single();

        if (orgError) {
            console.error('ERRO COMPLETO (Org):', JSON.stringify(orgError, null, 2));
            // Rollback
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return { error: `Erro ao criar organização: ${orgError.message} - Detalhes no console.` };
        }

        // 4. Update Profile
        console.log('[RegisterClinic] Updating Profile...');
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                organization_id: orgData.id,
                full_name: professionalName,
                role: 'admin',
            })
            .eq('id', userId);

        if (profileError) {
            console.error('ERRO COMPLETO (Profile):', JSON.stringify(profileError, null, 2));
            // Rollback
            await supabaseAdmin.from('organizations').delete().eq('id', orgData.id);
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return { error: `Erro ao atualizar perfil: ${profileError.message}` };
        }

        console.log('[RegisterClinic] Success!');
        return { success: true };

    } catch (globalError: any) {
        console.error('ERRO COMPLETO (Global):', JSON.stringify(globalError, null, 2));
        return { error: `Erro inesperado: ${globalError.message}` };
    }
}
