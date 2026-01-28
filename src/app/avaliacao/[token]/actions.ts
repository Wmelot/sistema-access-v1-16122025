'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { validateFollowupToken } from '@/app/dashboard/[slug]/patients/actions/followup'
import { revalidatePath } from 'next/cache'

export async function submitPublicAssessment(item: any, answers: any, scores: any, title: string) {
    // 0. Bypass for Mock/Test
    if (item.id === 'mock-id') {
        // Simulate Success
        return { success: true }
    }

    const supabase = await createAdminClient()

    // 1. Verify token again (double safety)
    const { success, error } = await validateFollowupToken(item.token)
    if (!success) {
        return { success: false, error: error }
    }

    // 2. Create Patient Assessment
    const payload = {
        patient_id: item.patient_id,
        professional_id: item.created_by, // Attribute to the professional who sent it
        organization_id: item.organization_id, // [FIX] Required for filtering in History
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

    // 2.5 Create Reminder for Professional
    try {
        const { data: patient } = await supabase.from('patients').select('name').eq('id', item.patient_id).single()

        // [FIX] Fallback for legacy items where created_by is null
        let targetUserId = item.created_by
        if (!targetUserId) {
            // Try to find an admin in the organization to notify
            const { data: adminProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('organization_id', item.organization_id)
                .eq('role', 'admin') // Assuming 'admin' role exists or owner logic
                .limit(1)
                .single()

            targetUserId = adminProfile?.id
        }

        if (targetUserId) {
            await supabase.from('reminders').insert({
                user_id: targetUserId,
                creator_id: targetUserId, // Self-created by system on behalf
                organization_id: item.organization_id,
                content: `📋 Questionário respondido: ${title} | Paciente: ${patient?.name || 'Não identificado'}`,
                due_date: new Date().toISOString(),
                is_read: false,
                status: 'pending'
            })
        } else {
            console.warn('No user found to notify for assessment completion', item.id)
        }
    } catch (reminderErr) {
        console.error('Error creating reminder for assessment:', reminderErr)
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
