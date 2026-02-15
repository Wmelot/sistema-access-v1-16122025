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

    if (!item.organization_id) {
        console.error('[DEBUG_ACTION] Blocked: No organization_id for assessment', item.id)
        return { success: false, error: 'Erro de configuração: Organização não identificada.' }
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
            // Determine special content based on assessment result
            let specialTag = '📋'
            let extraInfo = ''

            if (scores?.alert) {
                if (item.questionnaire_type === 'insoles_1y' || title.includes('1 Ano')) {
                    specialTag = '💰 OPORTUNIDADE DE VENDA'
                    extraInfo = ' | Paciente solicitou nova palmilha/reavaliação.'
                } else if (item.questionnaire_type === 'insoles_40d' || title.includes('40 Dias')) {
                    specialTag = '🚨 REVISÃO TÉCNICA'
                    extraInfo = ' | Paciente relatou desconforto ou falta de ajuste.'
                }
            }

            const remindersPayload = targetUserIds.map(uid => ({
                user_id: uid,
                creator_id: uid,
                organization_id: item.organization_id,
                content: `${specialTag}: ${title} | Paciente: ${patient?.name || 'Não identificado'}${extraInfo} | NAV:${item.slug || 'slug'}:${item.patient_id}`,
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

export async function confirmInsoleOrder(item: any, orderType: 'upsell' | 'renewal', amount: number) {
    const supabase = await createAdminClient()
    const { getOrCreateAsaasCustomer, createAsaasPayment } = await import('@/lib/asaas')

    try {
        const { data: patient } = await supabase.from('patients').select('*').eq('id', item.patient_id).single()
        if (!patient) return { success: false, error: 'Paciente não localizado.' }

        // 1. Asaas Integration
        let paymentLink = null
        try {
            const asaasData = await getOrCreateAsaasCustomer(patient.id)
            const asaasCustomerId = typeof asaasData === 'string' ? asaasData : asaasData.customerId
            const asaasApiKey = typeof asaasData === 'string' ? undefined : asaasData.apiKey

            const payment = await createAsaasPayment({
                customer: asaasCustomerId,
                billingType: 'PIX',
                value: amount,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: `Novo Par de Palmilhas - ${orderType === 'upsell' ? 'Par Reserva' : 'Renovação'}`,
                externalReference: `insole_${item.id}`
            }, asaasApiKey)

            paymentLink = payment.invoiceUrl
        } catch (asaasErr) {
            console.error('[InsoleOrder] Asaas Error:', asaasErr)
            // Continue even if Asaas fails, we still want the reminder
        }

        // 2. Notify Professionals (High Priority)
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

        const tag = orderType === 'upsell' ? '💰 NOVO PEDIDO REPROVADO' : '🔄 RENOVAÇÃO SOLICITADA'
        const remindersPayload = targetUserIds.map(uid => ({
            user_id: uid,
            creator_id: uid,
            organization_id: item.organization_id,
            content: `🔥 URGENTE: ${tag} | Paciente: ${patient.name} | Valor: R$ ${amount.toFixed(2)} | Link: ${paymentLink || 'PIX Manual'} | NAV:sales:${patient.id}`,
            due_date: new Date().toISOString(),
            is_read: false,
            status: 'pending'
        }))

        await supabase.from('reminders').insert(remindersPayload)

        return {
            success: true,
            paymentLink,
            message: 'Pedido confirmado! Seu fisioterapeuta já foi notificado.'
        }
    } catch (err: any) {
        console.error('[InsoleOrder] General Error:', err)
        return { success: false, error: 'Erro ao processar pedido.' }
    }
}

export async function getProfessionalInfo(professionalId: string) {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, photo_url')
        .eq('id', professionalId)
        .single()

    if (error) return null
    return data
}

export async function requestAdjustment(item: any) {
    const supabase = await createAdminClient()
    try {
        const { data: patient } = await supabase.from('patients').select('name').eq('id', item.patient_id).single()

        // Notify Professionals
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

        const remindersPayload = targetUserIds.map(uid => ({
            user_id: uid,
            creator_id: uid,
            organization_id: item.organization_id,
            content: `🚨 AJUSTE SOLICITADO: Paciente ${patient?.name} relatou desconforto. Paciente direcionado para agendamento online. | NAV:patients:${item.patient_id}`,
            due_date: new Date().toISOString(),
            is_read: false,
            status: 'pending'
        }))

        await supabase.from('reminders').insert(remindersPayload)

        const prof = await getProfessionalInfo(item.created_by)
        return { success: true, professional: prof }
    } catch (err) {
        return { success: false, error: 'Erro ao processar solicitação.' }
    }
}

export async function getAdjustmentAvailability(professionalId: string, date: string) {
    const { getPublicAvailability } = await import('@/app/book/actions')
    // We search for 15 min duration as requested
    // The getPublicAvailability already has smart logic for adjacency
    return await getPublicAvailability(professionalId, date, 15)
}

export async function getOccupiedDays(professionalId: string) {
    const supabase = await createAdminClient()
    const now = new Date().toISOString()
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('professional_id', professionalId)
        .gte('start_time', now)
        .lte('start_time', thirtyDaysLater)
        .neq('status', 'cancelled')

    if (!data) return []

    const occupiedDates = data.map(app => app.start_time.split('T')[0])
    return Array.from(new Set(occupiedDates))
}


