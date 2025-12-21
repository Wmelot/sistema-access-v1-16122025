'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPatientRecords(patientId: string, type?: 'assessment' | 'evolution') {
    const supabase = await createClient()

    let query = supabase
        .from('patient_records')
        .select(`
            id,
            created_at,
            status,
            record_type,
            form_templates (
                title,
                type
            ),
            professionals:professional_id (
                full_name
            )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (type) {
        query = query.eq('record_type', type)
    }

    const { data, error } = await query

    if (error) {
        // If column doesn't exist yet, this might fail. Return empty.
        console.error('Error fetching records raw:', error)
        console.error('Error fetching records message:', error.message)
        console.error('Error fetching records details:', error.details)
        console.error('Error fetching records hint:', error.hint)
        return []
    }

    return data
}
