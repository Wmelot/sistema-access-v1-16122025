'use server'

import { createClient } from '@/lib/supabase/server'
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

    const { data: followup, error } = await supabase
        .from('assessment_follow_ups')
        .insert({
            patient_id: data.patientId,
            template_id: data.templateId,
            original_assessment_id: data.originalAssessmentId,
            scheduled_for: data.scheduledFor,
            custom_message: data.customMessage,
            link_expires_at: expiresAt.toISOString(),
            created_by: user.id,
        })
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
    const supabase = await createClient()

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
