'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { createInvoice } from "@/actions/patients"
import { FinancialService } from "@/services/financial-service"

/**
 * Updates the status of an appointment to 'paid' and records payment details.
 */
export async function confirmAppointmentPayment(
    appointmentId: string,
    paymentData: {
        methodId: string,
        cardBrandId?: string,
        installments?: number,
        date?: string
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Usuário não autenticado' }

    // 1. Fetch Appointment to check if it has an invoice
    const { data: appt, error: fetchError } = await supabase
        .from('appointments')
        .select('id, patient_id, price, invoice_id, organization_id')
        .eq('id', appointmentId)
        .single()

    if (fetchError || !appt) return { error: 'Atendimento não encontrado' }

    const finalDate = paymentData.date || new Date().toISOString()

    try {
        if (appt.invoice_id) {
            // Already has invoice, update it
            const { error: invError } = await supabase
                .from('invoices')
                .update({
                    status: 'paid',
                    payment_method: paymentData.methodId,
                    payment_date: finalDate,
                    card_brand_id: paymentData.cardBrandId || null,
                    installments: paymentData.installments || 1
                })
                .eq('id', appt.invoice_id)

            if (invError) throw invError
        } else {
            // Create New Invoice
            const result = await createInvoice(
                appt.patient_id,
                [appt.id],
                appt.price || 0,
                paymentData.methodId,
                finalDate,
                paymentData.installments || 1,
                0, // fee (will be calculated by createInvoice if possible)
                [], // extraItems
                'paid', // status
                undefined, // slug
                paymentData.cardBrandId || null,
                null, // acquirer
                0, // discount
                0, // addition
                appt.organization_id
            )

            if (result.error) throw new Error(result.error)
        }

        // 2. IMPORTANT: Update the appointment status to 'paid' 
        // We use 'paid' instead of 'completed' because the MyStatementTab filters for ['billed', 'paid']
        // and uses status === 'paid' to show 'Recebido'
        const { error: apptError } = await supabase
            .from('appointments')
            .update({ status: 'paid' })
            .eq('id', appointmentId)

        if (apptError) throw apptError

        // 3. Sync Financials (Commissions, etc.)
        await FinancialService.syncInvoiceAndCommission(
            supabase,
            appointmentId,
            'paid',
            { method: paymentData.methodId, date: finalDate }
        )

        await logAction('CONFIRM_PAYMENT', { appointmentId, method: paymentData.methodId })

        revalidatePath('/dashboard/financial')
        return { success: true }

    } catch (err: any) {
        console.error('[confirmAppointmentPayment] Error:', err.message)
        return { error: err.message || 'Erro ao processar pagamento' }
    }
}

/**
 * Updates the status of an appointment to 'paid' (Internal/Old legacy)
 */
export async function updateAppointmentStatus(appointmentId: string, status: string) {
    const supabase = await createClient()

    // Fallback if someone uses old confirm button
    if (status === 'paid') {
        return confirmAppointmentPayment(appointmentId, { methodId: '2f31e744-047c-40a7-9a5d-fc499fd5582d' }) // Default to Money
    }

    const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/financial')
    return { success: true }
}
