'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateFormTemplate(id: string, fields: any[]) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('form_templates')
            .update({ fields })
            .eq('id', id);

        if (error) {
            console.error('Error updating form template:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/forms');
        revalidatePath(`/dashboard/forms/builder/${id}`);
        return { success: true };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'Failed to update form template' };
    }
}
