'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPatientRecords(patientId: string, type?: 'assessment' | 'evolution', slug?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('patient_records')
        .select(`
            id,
            created_at,
            content,
            organization_id,
            appointment_id,
            appointments (
                status
            ),
            form_templates (
                title,
                type,
                ai_generation_script
            ),
            professionals:profiles (
                full_name
            )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData?.id) {
            query = query.eq('organization_id', orgData.id)
        }
    }


    const { data: rawData, error } = await query

    if (error) {
        console.error('Error fetching records:', error)
        return []
    }

    // [FIXED] Filter by type manually since 'record_type' column doesn't exist (it's inside 'content')
    // [NEW] Also filter out records from CANCELLED appointments
    let data = (rawData || []).filter((r: any) => {
        const apptData = Array.isArray(r.appointments) ? r.appointments[0] : r.appointments
        const apptStatus = apptData?.status
        if (apptStatus === 'cancelled') return false
        return true
    })

    if (type) {
        data = data.filter((r: any) => {
            const rType = r.content?._record_type || r.form_templates?.type
            // Map legacy or varied types to standardized ones
            const normalizedType = rType === 'evaluation' ? 'assessment' : rType
            return normalizedType === type
        })
    }

    return data
}
