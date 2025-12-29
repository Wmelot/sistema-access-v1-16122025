'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssessment(patientId: string, type: string, data: any, scores: any, title?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const payload = {
        patient_id: patientId,
        professional_id: user.id, // Assuming the professional is the logged in user
        type,
        // template_id: type, // Removed as column appears to be missing. type serves this purpose.
        title: title || type, // Store title for display
        data,
        scores: {
            ...scores,
            savedAt: new Date().toISOString()
        }
    }

    const { data: insertedData, error } = await supabase.from('patient_assessments').insert(payload).select()

    if (error) {
        console.error('Error creating assessment:', error)
        throw new Error(`Failed to create assessment: ${error.message} (${error.code})`)
    }

    revalidatePath('/dashboard', 'layout')
    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath(`/dashboard/attendance`)
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
