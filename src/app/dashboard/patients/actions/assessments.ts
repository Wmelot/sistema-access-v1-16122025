'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssessment(patientId: string, type: string, data: any, scores: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { error } = await supabase.from('patient_assessments').insert({
        patient_id: patientId,
        professional_id: user.id, // Assuming the professional is the logged in user
        type,
        data,
        scores
    })

    if (error) {
        console.error('Error creating assessment:', error)
        throw new Error('Failed to create assessment')
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
}

export async function getAssessments(patientId: string) {
    const supabase = await createClient()

    // We might want to join with professionals table to get the name, 
    // but for now let's just get the raw data
    const { data, error } = await supabase
        .from('patient_assessments')
        .select(`
            *,
            professionals (
                name
            )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching assessments:', error)
        // If table doesn't exist or other error, return empty array to prevent page crash
        return []
    }

    return data
}
