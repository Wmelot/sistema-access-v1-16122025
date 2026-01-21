'use server'

import { createClient } from "@/lib/supabase/server"
import { sendMessage } from "@/app/dashboard/[slug]/settings/communication/actions"

export async function sendQuestionnaire(patientId: string, questionnaireName: string, customMessage?: string) {
    if (!patientId || (!questionnaireName && !customMessage)) {
        return { success: false, error: "ID do paciente ou dados de envio inválidos." }
    }

    const supabase = await createClient()

    // 1. Fetch Patient Phone
    const { data: patient, error } = await supabase
        .from('patients')
        .select('phone, name')
        .eq('id', patientId)
        .single()

    if (error || !patient) {
        return { success: false, error: "Paciente não encontrado." }
    }

    if (!patient.phone) {
        return { success: false, error: "Paciente não possui telefone cadastrado." }
    }

    // 2. Construct Message
    const firstName = patient.name.split(' ')[0]
    const message = customMessage || `Olá ${firstName}, por favor responda o questionário: *${questionnaireName}*`

    // 3. Send via Z-API (using existing action)
    // sendMessage handles config fetching and provider selection (Z-API or Evolution)
    return await sendMessage(patient.phone, message)
}
