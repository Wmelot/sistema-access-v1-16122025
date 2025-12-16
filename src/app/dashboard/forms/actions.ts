'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getFormTemplates() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('form_templates')
        .select('*')
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
