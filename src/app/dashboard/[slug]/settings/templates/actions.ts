"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTemplateSettingsData() {
    const supabase = await createClient()

    // 1. Get Professionals
    const { data: professionals } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'professional') // Adjust if role logic differs
        .order('full_name')

    // 2. Get Templates
    const { data: templates } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_active', true)
        .order('title')

    // 3. Get All Preferences
    const { data: preferences } = await supabase
        .from('user_template_preferences')
        .select('*')

    return {
        professionals: professionals || [],
        templates: templates || [],
        preferences: preferences || []
    }
}

export async function updateTemplatePreference(userId: string, templateId: string, updates: { is_favorite?: boolean, is_allowed?: boolean }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('user_template_preferences')
        .upsert({
            user_id: userId,
            template_id: templateId,
            ...updates,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, template_id' })

    if (error) {
        console.error(error)
        return { success: false }
    }

    revalidatePath('/dashboard/settings/templates')
    return { success: true }
}
