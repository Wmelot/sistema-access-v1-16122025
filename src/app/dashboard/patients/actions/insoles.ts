'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays, format } from "date-fns"

export async function registerInsoleDelivery(patientId: string, deliveryDate: Date) {
    const supabase = await createClient()

    try {
        // 1. Calculate scheduled dates
        const date40d = addDays(deliveryDate, 40)
        const date1y = addDays(deliveryDate, 380) // 1 year + approx 2 weeks margin as referenced

        // 2. Insert Insole 40 days follow-up
        const { error: error40d } = await supabase
            .from('assessment_follow_ups')
            .insert({
                patient_id: patientId,
                type: 'insoles_40d',
                delivery_date: deliveryDate.toISOString(),
                scheduled_date: date40d.toISOString(),
                status: 'pending',
                token: crypto.randomUUID()
            })

        if (error40d) throw new Error(`Error scheduling 40d: ${error40d.message}`)

        // 3. Insert Insole 1 year follow-up
        const { error: error1y } = await supabase
            .from('assessment_follow_ups')
            .insert({
                patient_id: patientId,
                type: 'insoles_1y',
                delivery_date: deliveryDate.toISOString(),
                scheduled_date: date1y.toISOString(),
                status: 'pending',
                token: crypto.randomUUID()
            })

        if (error1y) throw new Error(`Error scheduling 1y: ${error1y.message}`)

        revalidatePath(`/dashboard/patients/${patientId}`)
        return { success: true, message: 'Entrega registrada e acompanhamentos agendados.' }

    } catch (error: any) {
        console.error("Failed to register insole delivery:", error)
        return { success: false, message: error.message || 'Erro ao registrar entrega.' }
    }
}

export async function getInsoleFollowUps(patientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('assessment_follow_ups')
        .select('*')
        .eq('patient_id', patientId)
        .in('type', ['insoles_40d', 'insoles_1y'])
        .order('scheduled_date', { ascending: true })

    if (error) {
        console.error("Error fetching follow-ups:", error)
        return []
    }

    return data
}

export async function cancelFollowUp(followUpId: string, patientId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('assessment_follow_ups')
        .update({ status: 'cancelled' })
        .eq('id', followUpId)

    if (error) {
        return { success: false, message: 'Erro ao cancelar.' }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}
