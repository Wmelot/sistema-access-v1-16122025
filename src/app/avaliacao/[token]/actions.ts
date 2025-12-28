'use server'

import { createClient } from '@/lib/supabase/server'
import { validateFollowupToken } from '@/app/dashboard/patients/actions/followup'
import { revalidatePath } from 'next/cache'

export async function submitPublicAssessment(item: any, answers: any, scores: any, title: string) {
    const supabase = await createClient()

    // 1. Verify token again (double safety)
    const { success, error } = await validateFollowupToken(item.link_token)
    if (!success) {
        return { success: false, error: error }
    }

    // 2. Create Patient Assessment
    const payload = {
        patient_id: item.patient_id,
        professional_id: item.created_by, // Attribute to the professional who sent it
        type: item.questionnaire_type || item.template?.type || 'custom', // Handle legacy vs new
        title: title,
        data: answers,
        scores: {
            ...scores,
            savedAt: new Date().toISOString(),
            source: 'remote_followup'
        }
    }

    const { error: insertError } = await supabase.from('patient_assessments').insert(payload)

    if (insertError) {
        console.error('Error saving public assessment:', insertError)
        return { success: false, error: 'Erro ao salvar avaliação.' }
    }

    // 3. Mark Follow-up as Completed
    const { error: updateError } = await supabase
        .from('assessment_follow_ups')
        .update({
            status: 'completed',
            updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

    if (updateError) {
        console.error('Error updating follow-up status:', updateError)
        // Not critical, but good to know
    }

    revalidatePath(`/dashboard/patients/${item.patient_id}`)
    return { success: true }
}
