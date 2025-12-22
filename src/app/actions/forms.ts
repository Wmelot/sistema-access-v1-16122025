'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFormTemplate(id: string, fields: any[]) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('form_templates')
            .update({ fields })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating form template:', error);
            return { success: false, error: error.message };
        }

        if (!data) {
            console.error('RLS Blocked Update: No data returned from update.');
            return { success: false, error: 'Permissão negada ou formulário não encontrado (RLS).' };
        }

        revalidatePath('/dashboard/forms');
        revalidatePath(`/dashboard/forms/builder/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return { success: false, error: error.message || 'Failed to update form template' };
    }
}
