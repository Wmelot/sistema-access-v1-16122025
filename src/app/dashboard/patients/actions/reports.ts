'use server'

import { createClient } from '@/lib/supabase/server'
import { getWhatsappConfig } from '@/app/dashboard/settings/communication/actions'
import { revalidatePath } from 'next/cache'

interface SendReportParams {
    patientId: string
    content: string
    reportType: string
}

export async function sendReportViaWhatsapp({ patientId, content, reportType }: SendReportParams) {
    const supabase = await createClient()

    // 1. Get Patient Info
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('phone, name')
        .eq('id', patientId)
        .single()

    if (patientError || !patient) {
        return { success: false, error: "Paciente não encontrado." }
    }

    if (!patient.phone) {
        return { success: false, error: "Paciente não possui telefone cadastrado." }
    }

    // 2. Get WhatsApp Config
    const config = await getWhatsappConfig()
    if (!config) {
        return { success: false, error: "WhatsApp não configurado. Vá em Configurações > Comunicação." }
    }

    // 3. Prepare Phone and Message
    let cleanPhone = patient.phone.replace(/\D/g, '')
    if (cleanPhone.length <= 11) {
        cleanPhone = '55' + cleanPhone
    }

    let finalMessage = content
    let destinationNumber = cleanPhone

    // --- SAFETY MODE CHECK ---
    if (config.testMode?.isActive) {
        if (!config.testMode.safeNumber) {
            return { success: false, error: "Modo de Teste ativo mas sem número seguro." }
        }
        destinationNumber = config.testMode.safeNumber.replace(/\D/g, '')
        finalMessage = `[MODO TESTE] Relatório para: ${patient.name} (${cleanPhone})\n\n${content}`
    }
    // -------------------------

    try {
        let sentId = null;

        if (config.provider === 'zapi' && config.zapi) {
            const { instanceId, token, clientToken } = config.zapi

            const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(clientToken ? { 'Client-Token': clientToken } : {})
                },
                body: JSON.stringify({
                    phone: destinationNumber,
                    message: finalMessage
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(JSON.stringify(data))
            sentId = data.id || data.messageId

        } else if (config.provider === 'evolution' && config.evolution) {
            const { url, apiKey, instanceName } = config.evolution
            const baseUrl = url.replace(/\/$/, "")

            const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                },
                body: JSON.stringify({
                    number: destinationNumber,
                    text: finalMessage
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(JSON.stringify(data))
            sentId = data.key?.id
        } else {
            return { success: false, error: "Provedor inválido." }
        }

        // 4. Log the action (Optional: create a new table 'patient_reports' or just use 'message_logs')
        // For now, logging to message_logs via Supabase would be good practice if we want history.
        // But the requirement is just "send". Let's stick to simple success return unless requested.

        return { success: true, messageId: sentId }

    } catch (e: any) {
        console.error("Error sending report:", e)
        return { success: false, error: e.message || "Erro ao enviar mensagem." }
    }
}
