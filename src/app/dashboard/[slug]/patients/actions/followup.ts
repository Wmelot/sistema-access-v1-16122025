'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSecureToken } from '@/lib/crypto'


export async function scheduleFollowup(data: {
    patientId: string
    templateId: string
    originalAssessmentId?: string
    scheduledFor: string
    customMessage?: string
    slug?: string
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

    let organizationId: string | undefined
    if (data.slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', data.slug).single()
        if (org) organizationId = org.id
    }
    if (!organizationId) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        organizationId = profile?.organization_id
    }

    const token = generateSecureToken(16)

    const payload: any = {
        patient_id: data.patientId,
        original_assessment_id: data.originalAssessmentId,
        scheduled_date: data.scheduledFor,
        custom_message: data.customMessage,
        token: token,
        link_expires_at: expiresAt.toISOString(),
        status: 'pending',
        created_by: user.id,
        organization_id: organizationId
    }

    if (isUuid) {
        payload.template_id = data.templateId

        // Fetch template to check for associated questionnaire_type
        const { data: templates } = await supabase
            .from('message_templates' as any)
            .select('*')
            .eq('type', 'whatsapp')
            .eq('questionnaire_type', 'followup')
            .eq('id', data.templateId)
            .single()

        const tmpl: any = templates
        if (tmpl?.questionnaire_type && tmpl.questionnaire_type !== 'none') {
            payload.questionnaire_type = tmpl.questionnaire_type
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

    if (data.slug) {
        revalidatePath(`/dashboard/${data.slug}/patients/${data.patientId}`)
    } else {
        revalidatePath(`/dashboard/patients/${data.patientId}`)
    }
    return { success: true, data: followup }
}

export async function getScheduledFollowups(patientId: string, slug?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('assessment_follow_ups')
        .select(`
            *,
            template:form_templates(id, title),
            patient:patients(id, name)
        `)
        .eq('patient_id', patientId)
        .order('scheduled_date', { ascending: true })

    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData?.id) {
            query = query.eq('organization_id', orgData.id)
        }
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching follow-ups:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function cancelFollowup(followupId: string, slug?: string) {
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

    if (slug) {
        revalidatePath(`/dashboard/${slug}/patients`)
    } else {
        revalidatePath('/dashboard/patients')
    }
    return { success: true }
}

export async function validateFollowupToken(token: string) {
    // Bypass for Test Link (More robust check)
    if (token && token.trim().includes('teste-123')) {
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
        .eq('token', token)
        .in('status', ['pending', 'sent'])
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
