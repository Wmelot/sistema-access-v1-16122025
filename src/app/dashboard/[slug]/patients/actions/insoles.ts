'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays, format } from "date-fns"

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
        const date40d = addDays(deliveryDate, 40)
        const date1y = addDays(deliveryDate, 380)

        // 3. Insert Insole 40 days follow-up
        const { error: error40d } = await supabase
            .from('assessment_follow_ups')
            .insert({
                patient_id: patientId,
                organization_id: organizationId,
                type: 'insoles_40d',
                delivery_date: deliveryDate.toISOString(),
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
                delivery_date: deliveryDate.toISOString(),
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
