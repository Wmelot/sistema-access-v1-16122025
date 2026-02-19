'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getFormTemplates() {
    const supabase = await createClient();

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    const orgId = profile?.organization_id;

    if (!orgId) {
        console.error('User has no organization');
        return [];
    }

    // Bypass RLS to ensure we see System (NULL or Fixed ID) templates
    const adminSupabase = await createAdminClient();

    // 1. Get Allowed System Form IDs for this organization
    const { data: allowedAccess } = await adminSupabase
        .from('organization_form_access')
        .select('form_template_id')
        .eq('organization_id', orgId);

    const { data: orgData } = await adminSupabase
        .from('organizations')
        .select(`plan_config_id, plan_configs ( features )`)
        .eq('id', orgId)
        .single();

    // Extract both pointwise access and plan-level access
    const planForms = Array.isArray((orgData as any)?.plan_configs?.features?.allowed_forms) ? (orgData as any).plan_configs.features.allowed_forms : [];
    const pointwiseForms = (allowedAccess || []).map(a => a.form_template_id);
    const allowedSystemIds = Array.from(new Set([...planForms, ...pointwiseForms]));

    // 2. Fetch all potentially relevant templates
    const { data, error } = await adminSupabase
        .from('form_templates')
        .select('*')
        .is('deleted_at', null)
        .or(`organization_id.eq.${orgId},organization_id.is.null,organization_id.eq.00000000-0000-0000-0000-000000000001`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    // 3. Filter: Always show own forms. Show system forms only if in allowedAccess.
    const filteredTemplates = (data || []).filter(t => {
        const isOwn = t.organization_id === orgId;
        if (isOwn) return true;

        const isSystem = !t.organization_id || t.organization_id === '00000000-0000-0000-0000-000000000001';
        if (isSystem) {
            // [FIX] Master Admin always sees all standardized content (bypass granular access)
            const isMaster = user.email && ['wmelot@gmail.com', 'accessfisio@gmail.com', 'warley@gmail.com'].includes(user.email);
            return isMaster || allowedSystemIds.includes(t.id);
        }

        return false;
    });

    return filteredTemplates;
}

export async function getFormTemplate(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching template:', error);
        return null;
    }

    return data;
}

export async function createFormTemplate(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string || 'assessment';
    const rawVisibility = formData.get('visibility') as string || 'private';

    if (!user) return { success: false, message: 'Usuário não autenticado.' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    const orgId = profile?.organization_id;
    const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001';

    // Enforcement: Only Master can create Public forms
    let visibility_level = rawVisibility;
    if (visibility_level === 'public' && orgId !== MASTER_ORG_ID) {
        console.warn(`[SECURITY] User from Org ${orgId} tried to create PUBLIC form. Forcing PRIVATE.`);
        visibility_level = 'private';
    }

    const { data, error } = await supabase
        .from('form_templates')
        .insert({
            title,
            description,
            type,
            fields: [], // Start empty
            is_active: true,
            user_id: user.id,
            organization_id: orgId,
            visibility_level: visibility_level
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating template:', error);
        return { success: false, message: 'Erro ao criar modelo. Tente novamente.' };
    }

    revalidatePath('/dashboard/forms');
    return { success: true, id: data.id };
}

export async function addOptionToTemplate(templateId: string, fieldId: string, newOption: string) {
    const supabase = await createClient();

    // 1. Fetch current template
    const { data: template, error: fetchError } = await supabase
        .from('form_templates')
        .select('fields')
        .eq('id', templateId)
        .single();

    if (fetchError || !template) {
        return { success: false, message: 'Modelo não encontrado.' };
    }

    // 2. Find and update field
    const fields = template.fields || [];
    const fieldIndex = (fields as any[]).findIndex((f: any) => f.id === fieldId)

    if (fieldIndex === -1) {
        return { success: false, message: 'Campo não encontrado.' };
    }

    const currentOptions = (fields as any)[fieldIndex].options || [];

    // Check if already exists (case insensitive)
    if (currentOptions.some((opt: string) => opt.toLowerCase() === newOption.trim().toLowerCase())) {
        return { success: false, message: 'Opção já existe.' };
    }

    // Add and Sort
    const updatedOptions = [...currentOptions, newOption.trim()].sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );

    (fields as any)[fieldIndex].options = updatedOptions;

    // 3. Save back to DB
    const { error: updateError } = await supabase
        .from('form_templates')
        .update({ fields })
        .eq('id', templateId);

    if (updateError) {
        console.error('Error updating template options:', updateError);
        return { success: false, message: 'Erro ao salvar nova opção. Tente novamente.' };
    }

    revalidatePath(`/dashboard/forms/builder/${templateId}`);
    return { success: true, options: updatedOptions };
}

export async function duplicateFormTemplate(templateId: string) {
    const supabase = await createClient();

    // 1. Fetch original
    const { data: original, error: fetchError } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (fetchError || !original) {
        return { success: false, message: 'Modelo original não encontrado.' };
    }

    // 2. Insert Copy
    const { data: newTemplate, error: createError } = await supabase
        .from('form_templates')
        .insert({
            title: `Cópia de ${original.title}`,
            description: original.description,
            fields: original.fields, // Copy JSONB structure
            is_active: true
        })
        .select('id')
        .single();

    if (createError) {
        console.error('Error duplicating template:', createError);
        return { success: false, message: 'Erro ao duplicar modelo. Tente novamente.' };
    }

    revalidatePath('/dashboard/forms');
    revalidatePath('/dashboard/questionnaires');
    return { success: true, message: 'Modelo duplicado com sucesso!' };
}

export async function deleteFormTemplate(templateId: string, password?: string) {
    const supabase = await createClient();

    // 1. Verify Password
    // 1. Verify Password against Custom Admin Password in Profiles
    if (password) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, message: 'Usuário não autenticado.' };
        }

        // Fetch user profile to check admin_password
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('admin_password')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Error fetching profile for password check:', profileError);
            return { success: false, message: 'Erro ao verificar permissões.' };
        }

        // Direct comparison (assuming simple storage as requested, or hashed if implemented)
        // Based on AdminPasswordCard, it seems to be stored as plain text or handled simply for now.
        // If it's stored plain text:
        if ((profile as any).admin_password !== password) {
            return { success: false, message: 'Senha incorreta.' };
        }

    } else {
        return { success: false, message: 'Senha necessária.' };
    }

    // 2. Soft Delete
    const { error } = await supabase
        .from('form_templates')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', templateId);

    if (error) {
        console.error('Error deleting template:', error);
        return { success: false, message: 'Erro ao excluir modelo. Tente novamente.' };
    }

    revalidatePath('/dashboard/forms');
    revalidatePath('/dashboard/questionnaires');
    return { success: true, message: 'Modelo enviado para a lixeira.' };
}

export async function updateFormTemplateTitle(templateId: string, newTitle: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('form_templates')
        .update({ title: newTitle })
        .eq('id', templateId);

    if (error) {
        console.error('Error renaming template:', error);
        return { success: false, message: 'Erro ao renomear modelo. Tente novamente.' };
    }

    revalidatePath('/dashboard/forms');
    revalidatePath('/dashboard/questionnaires');
    return { success: true, message: 'Modelo renomeado.' };
}

export async function updateFormSettings(templateId: string, settings: {
    is_active: boolean;
    allowed_roles: string[];
    access_config?: any; // [NEW] Granular Access (Layer 3)
}) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('form_templates')
        .update({
            is_active: settings.is_active,
            allowed_roles: settings.allowed_roles,
            access_config: settings.access_config // Save the granular matrix
        })
        .eq('id', templateId);

    if (error) {
        console.error('Error updating form settings:', error);
        return { success: false, message: 'Erro ao salvar configurações.', error: error.message };
    }

    revalidatePath('/dashboard/forms');
    return { success: true, message: 'Configurações atualizadas.' };
}

export async function updateFormCategory(templateId: string, category: string | null) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('form_templates')
        .update({ category })
        .eq('id', templateId);

    if (error) {
        console.error('Error updating category:', error);
        return { success: false, message: 'Erro ao mover modelo.' };
    }

    revalidatePath('/dashboard/forms');
    revalidatePath('/dashboard/questionnaires');
    return { success: true, message: 'Modelo movido com sucesso.' };
}

export async function getOrganizationProfessionals(slug: string) {
    const supabase = await createClient();

    // 1. Resolve Organization ID from Slug
    const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single();
    if (!orgData) return [];

    // 2. Fetch Profiles for this organization
    const { data: professionals, error } = await supabase
        .from('profiles')
        .select('id, full_name, photo_url, specialty, role')
        .eq('organization_id', orgData.id)
        .order('full_name', { ascending: true });

    if (error) {
        console.error('Error fetching org professionals:', error);
        return [];
    }

    return professionals || [];
}
