'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getFormTemplates() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    return data;
}

export async function createFormTemplate(formData: FormData) {
    const supabase = await createClient();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    const { data, error } = await supabase
        .from('form_templates')
        .insert({
            title,
            description,
            fields: [], // Start empty
            is_active: true
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating template:', error);
        return { success: false, message: 'Erro ao criar modelo.' };
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
    const fieldIndex = fields.findIndex((f: any) => f.id === fieldId);

    if (fieldIndex === -1) {
        return { success: false, message: 'Campo não encontrado.' };
    }

    const currentOptions = fields[fieldIndex].options || [];

    // Check if already exists (case insensitive)
    if (currentOptions.some((opt: string) => opt.toLowerCase() === newOption.trim().toLowerCase())) {
        return { success: false, message: 'Opção já existe.' };
    }

    // Add and Sort
    const updatedOptions = [...currentOptions, newOption.trim()].sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );

    fields[fieldIndex].options = updatedOptions;

    // 3. Save back to DB
    const { error: updateError } = await supabase
        .from('form_templates')
        .update({ fields })
        .eq('id', templateId);

    if (updateError) {
        console.error('Error updating template options:', updateError);
        return { success: false, message: 'Erro ao salvar nova opção.' };
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
        return { success: false, message: 'Erro ao duplicar modelo.' };
    }

    revalidatePath('/dashboard/forms');
    return { success: true, message: 'Modelo duplicado com sucesso!' };
}

export async function deleteFormTemplate(templateId: string, password?: string) {
    const supabase = await createClient();

    // 1. Verify Password
    if (password) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });
            if (signInError) {
                return { success: false, message: 'Senha incorreta.' };
            }
        } else {
            return { success: false, message: 'Usuário não autenticado.' };
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
        return { success: false, message: 'Erro ao excluir modelo.' };
    }

    revalidatePath('/dashboard/forms');
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
        return { success: false, message: 'Erro ao renomear modelo.' };
    }

    revalidatePath('/dashboard/forms');
    return { success: true, message: 'Modelo renomeado.' };
}
