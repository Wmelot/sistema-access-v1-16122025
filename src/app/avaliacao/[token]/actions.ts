'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { validateFollowupToken } from '@/app/dashboard/[slug]/patients/actions/followup'
import { revalidatePath } from 'next/cache'

export async function submitPublicAssessment(item: any, answers: any, scores: any, title: string) {
    // 0. Bypass for Mock/Test
    if (item.id === 'mock-id') {
        return { success: true }
    }

    const supabase = await createAdminClient()
    console.log('[DEBUG_ACTION] Starting submitPublicAssessment', { itemId: item.id, title })

    // 1. Verify token again (double safety)
    try {
        const { success, error } = await validateFollowupToken(item.token)
        if (!success) {
            console.error('[DEBUG_ACTION] Token validation failed', error)
            return { success: false, error: typeof error === 'string' ? error : 'Link inválido ou expirado' }
        }
    } catch (e) {
        console.error('[DEBUG_ACTION] Exception in validateFollowupToken', e)
        return { success: false, error: 'Erro interno ao validar link.' }
    }

    // 2. Create Patient Assessment
    const payload = {
        patient_id: item.patient_id,
        professional_id: item.created_by,
        organization_id: item.organization_id,
        type: item.questionnaire_type || item.template?.type || 'custom',
        title: title,
        data: answers,
        scores: {
            ...scores,
            savedAt: new Date().toISOString(),
            source: 'remote_followup'
        }
    }

    console.log('[DEBUG_ACTION] Inserting assessment payload', { patientId: item.patient_id, orgId: item.organization_id })

    const { error: insertError } = await supabase.from('patient_assessments').insert(payload)

    if (insertError) {
        console.error('[DEBUG_ACTION] Error saving public assessment:', insertError)
        // Ensure we return a STRING error, not the Supabase object
        return { success: false, error: 'Erro ao salvar avaliação.' }
    }

    // 2.5 Create Reminder for Professional
    try {
        const { data: patient } = await supabase.from('patients').select('name').eq('id', item.patient_id).single()

        // Determine who should be notified (Creator + All Admins)
        let targetUserIds: string[] = []
        if (item.created_by) targetUserIds.push(item.created_by)

        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', item.organization_id)
            .in('role', ['admin', 'owner', 'master'])

        if (admins) {
            admins.forEach(a => {
                if (!targetUserIds.includes(a.id)) targetUserIds.push(a.id)
            })
        }

        if (targetUserIds.length > 0) {
            const remindersPayload = targetUserIds.map(uid => ({
                user_id: uid,
                creator_id: uid, // Mark as self-created so it shows in the widget
                organization_id: item.organization_id,
                content: `📋 Questionário respondido: ${title} | Paciente: ${patient?.name || 'Não identificado'} | NAV:${item.slug || 'slug'}:${item.patient_id}`,
                due_date: new Date().toISOString(),
                is_read: false,
                status: 'pending'
            }))

            console.log('[DEBUG_ACTION] Inserting reminders for:', targetUserIds)
            const { error: reminderError } = await supabase.from('reminders').insert(remindersPayload)

            if (reminderError) {
                console.error('[DEBUG_ACTION] Reminder insert failed:', reminderError)
            } else {
                console.log('[DEBUG_ACTION] Reminders inserted successfully')
            }
        } else {
            console.warn('[DEBUG_ACTION] No user found to notify for assessment completion', item.id)
        }
    } catch (reminderErr) {
        console.error('[DEBUG_ACTION] Exception creating reminder:', reminderErr)
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
        console.error('[DEBUG_ACTION] Error updating follow-up status:', updateError)
    }

    revalidatePath(`/dashboard/patients/${item.patient_id}`)
    return { success: true }
}
