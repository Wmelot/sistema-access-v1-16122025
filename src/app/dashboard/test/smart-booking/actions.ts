'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getProfessionals() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'professional')
        .order('name')

    if (error) {
        console.error('Error fetching professionals:', error)
        return []
    }

    return data || []
}

export async function getServices() {
    const { data, error } = await supabase
        .from('services')
        .select('id, name, duration')
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('Error fetching services:', error)
        return []
    }

    return data || []
}
