'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'


export async function createAssessment(patientId: string, type: string, data: any, scores: any, title?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Fetch User Organization
    const { data: userProfile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = userProfile?.organization_id

    if (!organizationId) throw new Error('Organization context missing.')

    // 2. Verify Patient belongs to same Org (Security)
    const { data: patient } = await supabase.from('patients').select('organization_id').eq('id', patientId).single()

    if (patient?.organization_id && patient.organization_id !== organizationId) {
        throw new Error('Access Denied: Patient belongs to another organization.')
    }

    const payload = {
        patient_id: patientId,
        professional_id: user.id,
        organization_id: organizationId, // Explicit Tenant ID
        type,
        title: title || type,
        data,
        scores: {
            ...scores,
            savedAt: new Date().toISOString()
        }
    }

    const { error } = await supabase.from('patient_assessments').insert(payload)

    if (error) {
        console.error('Error creating assessment:', error)
        throw new Error(`Failed to create assessment: ${error.message} (${error.code})`)
    }

    revalidatePath('/dashboard/patients')
    revalidatePath(`/dashboard/patients/${patientId}`)
}


export async function getAssessments(patientId: string) {
    const supabase = await createClient()

    // Needs to fetch ONLY standardized questionnaires (patient_assessments)
    const { data, error } = await supabase
        .from('patient_assessments')
        .select(`
            *,
            profiles (
                full_name
            )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching assessments:', error)
        return []
    }

    // Map to ensure 'title' exists and match UI expectations if needed, but mostly raw return is fine
    // as per original code.
    return data || []
}
