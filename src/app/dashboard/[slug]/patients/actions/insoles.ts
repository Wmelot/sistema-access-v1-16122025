'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays, format } from "date-fns"
import { sendMessage, getWhatsappConfig } from "@/app/dashboard/[slug]/settings/communication/actions"

export async function registerInsoleDelivery(patientId: string, deliveryDate: Date, slug?: string) {
    const supabase = await createClient()

    try {
        // 1. Fetch Organization Context
        const { data: { user } } = await supabase.auth.getUser()
        let organizationId = null

        if (user) {
            const { data: userProfile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = userProfile?.organization_id
        }

        if (slug) {
            const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
            if (orgData) organizationId = orgData.id
        }

        // Fallback to patient's org
        if (!organizationId) {
            const { data: patient } = await supabase.from('patients').select('organization_id').eq('id', patientId).single()
            organizationId = patient?.organization_id
        }

        // 2. Calculate scheduled dates
        const deliveryAsDate = new Date(deliveryDate)
        // Set to noon to avoid any timezone/DST shifts causing off-by-one
        deliveryAsDate.setHours(12, 0, 0, 0)

        const date40d = addDays(deliveryAsDate, 40)
        const date1y = addDays(deliveryAsDate, 365) // Standard 1 year (365 days)

        console.log(`[Insoles] Registering delivery for patient ${patientId} on ${deliveryAsDate.toISOString()}`)
        console.log(`[Insoles] Scheduled 40d: ${date40d.toISOString()}`)
        console.log(`[Insoles] Scheduled 1y: ${date1y.toISOString()}`)

        // 2.5 Cancel ANY previous PENDING insole follow-ups for this patient
        // This prevents "zombie" or duplicate messages if professional re-registers
        const { error: cancelError } = await supabase
            .from('assessment_follow_ups')
            .update({ status: 'cancelled' })
            .eq('patient_id', patientId)
            .in('type', ['insoles_40d', 'insoles_1y'])
            .eq('status', 'pending');

        if (cancelError) {
            console.warn(`[Insoles] Non-critical error cancelling previous follow-ups: ${cancelError.message}`);
        }

        // 3. Insert Insole 40 days follow-up
        const { error: error40d } = await supabase
            .from('assessment_follow_ups')
            .insert({
                patient_id: patientId,
                organization_id: organizationId,
                type: 'insoles_40d',
                delivery_date: deliveryAsDate.toISOString(),
                scheduled_date: date40d.toISOString(),
                status: 'pending',
                token: crypto.randomUUID()
            })

        if (error40d) throw new Error(`Error scheduling 40d: ${error40d.message}`)

        // 4. Insert Insole 1 year follow-up
        const { error: error1y } = await supabase
            .from('assessment_follow_ups')
            .insert({
                patient_id: patientId,
                organization_id: organizationId,
                type: 'insoles_1y',
                delivery_date: deliveryAsDate.toISOString(),
                scheduled_date: date1y.toISOString(),
                status: 'pending',
                token: crypto.randomUUID()
            })

        if (error1y) throw new Error(`Error scheduling 1y: ${error1y.message}`)

        if (slug) {
            revalidatePath(`/dashboard/${slug}/patients/${patientId}`)
        } else {
            revalidatePath(`/dashboard/patients/${patientId}`)
        }
        return { success: true, message: 'Entrega registrada e acompanhamentos agendados.' }

    } catch (error: any) {
        console.error("Failed to register insole delivery:", error)
        return { success: false, message: error.message || 'Erro ao registrar entrega.' }
    }
}

export async function getInsoleFollowUps(patientId: string, slug?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('assessment_follow_ups')
        .select('*')
        .eq('patient_id', patientId)
        .in('type', ['insoles_40d', 'insoles_1y'])

    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData?.id) {
            query = query.eq('organization_id', orgData.id)
        }
    }

    const { data, error } = await query.order('scheduled_date', { ascending: true })

    if (error) {
        console.error("Error fetching follow-ups:", error)
        return []
    }

    return data
}

export async function cancelFollowUp(followUpId: string, patientId: string, slug?: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('assessment_follow_ups')
        .update({ status: 'cancelled' })
        .eq('id', followUpId)

    if (error) {
        return { success: false, message: 'Erro ao cancelar.' }
    }

    if (slug) {
        revalidatePath(`/dashboard/${slug}/patients/${patientId}`)
    } else {
        revalidatePath(`/dashboard/patients/${patientId}`)
    }
    return { success: true }
}
export async function triggerInsoleMaintenance(data: {
    patientId: string,
    scheduledDate: Date,
    type: 'insoles_1y' | 'insoles_40d',
    slug: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: 'Não autorizado' }

    try {
        // 1. Fetch Organization Context
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', data.slug).single()
        if (!orgData) throw new Error('Organização não encontrada')

        // 2. Fetch Patient Info for the message (phone name etc) - Not needed for simple insert
        // but needed for the "Send Now" logic if we want to bypass the scheduler.
        // However, we'll just insert it as 'pending' with the selected date.

        // 3. Insert or Update Follow-up
        const token = crypto.randomUUID()
        const { error } = await supabase
            .from('assessment_follow_ups')
            .insert({
                patient_id: data.patientId,
                organization_id: orgData.id,
                type: data.type,
                scheduled_date: data.scheduledDate.toISOString(),
                delivery_date: new Date().toISOString(), // Fallback
                status: 'pending',
                token: token,
                created_by: user.id
            })

        if (error) throw error

        // 4. Send Now if requested
        if (data.scheduledDate <= new Date()) {
            try {
                const { data: patient } = await supabase.from('patients').select('name, phone').eq('id', data.patientId).single()
                const config = await getWhatsappConfig(data.slug)

                if (patient?.phone && config) {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
                    const link = `${baseUrl}/avaliacao/${token}`
                    const firstName = patient.name?.split(' ')[0] || 'Paciente'

                    let templateTitle = 'Avaliação'
                    if (data.type === 'insoles_40d') templateTitle = 'Acompanhamento de Palmilhas (40 dias)'
                    if (data.type === 'insoles_1y') templateTitle = 'Renovação de Palmilhas (1 ano)'

                    const messageText = `Olá ${firstName}, por favor preencha o *${templateTitle}* clicando aqui:\n\n${link}`

                    const sendRes = await sendMessage(patient.phone, messageText, config)
                    if (sendRes.success) {
                        await supabase.from('assessment_follow_ups').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('token', token)
                    }
                }
            } catch (sendErr) {
                console.error("[Insoles] Error sending immediate message:", sendErr)
            }
        }

        revalidatePath(`/dashboard/${data.slug}/patients/${data.patientId}`)
        return { success: true, message: 'Mensagem processada com sucesso!' }
    } catch (error: any) {
        console.error("[Insoles] Error triggering maintenance:", error)
        return { success: false, message: error.message || 'Erro ao agendar.' }
    }
}
