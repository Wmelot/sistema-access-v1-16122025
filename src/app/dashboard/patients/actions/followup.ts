'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function scheduleFollowup(data: {
    patientId: string
    templateId: string
    originalAssessmentId?: string
    scheduledFor: string
    customMessage?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Calculate link expiration (30 days from scheduled date)
    const scheduledDate = new Date(data.scheduledFor)
    const expiresAt = new Date(scheduledDate)
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Check if templateId is UUID (database template) or Slug (legacy)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.templateId)

    const payload: any = {
        patient_id: data.patientId,
        original_assessment_id: data.originalAssessmentId,
        scheduled_for: data.scheduledFor,
        custom_message: data.customMessage,
        link_expires_at: expiresAt.toISOString(),
        created_by: user.id,
    }

    if (isUuid) {
        payload.template_id = data.templateId

        // Fetch template to check for associated questionnaire_type
        const { data: template } = await supabase
            .from('message_templates')
            .select('questionnaire_type')
            .eq('id', data.templateId)
            .single()

        if (template?.questionnaire_type && template.questionnaire_type !== 'none') {
            payload.questionnaire_type = template.questionnaire_type
        }
    } else {
        payload.questionnaire_type = data.templateId // New column for legacy types like 'spadi'
    }

    const { data: followup, error } = await supabase
        .from('assessment_follow_ups')
        .insert(payload)
        .select()
        .single()

    if (error) {
        console.error('Error scheduling follow-up:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/dashboard/patients/${data.patientId}`)
    return { success: true, data: followup }
}

export async function getScheduledFollowups(patientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('assessment_follow_ups')
        .select(`
            *,
            template:form_templates(id, title),
            patient:patients(id, name)
        `)
        .eq('patient_id', patientId)
        .order('scheduled_for', { ascending: true })

    if (error) {
        console.error('Error fetching follow-ups:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function cancelFollowup(followupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('assessment_follow_ups')
        .update({ status: 'cancelled' })
        .eq('id', followupId)
        .eq('created_by', user.id)

    if (error) {
        console.error('Error cancelling follow-up:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function validateFollowupToken(token: string) {
    // Bypass for Test Link
    if (token === 'teste-123') {
        return {
            success: true,
            data: {
                id: 'mock-id',
                questionnaire_type: 'insoles_40d',
                status: 'pending',
                patient: { name: 'Paciente de Teste' },
                link_expires_at: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            }
        }
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('assessment_follow_ups')
        .select(`
            *,
            template:form_templates(*),
            patient:patients(id, name, email, phone)
        `)
        .eq('link_token', token)
        .eq('status', 'pending')
        .single()

    if (error || !data) {
        return { success: false, error: 'Link inválido ou expirado' }
    }

    // Check if link is expired
    if (data.link_expires_at && new Date(data.link_expires_at) < new Date()) {
        return { success: false, error: 'Link expirado' }
    }

    return { success: true, data }
}
