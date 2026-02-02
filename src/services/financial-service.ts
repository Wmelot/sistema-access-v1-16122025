import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Centralized service for all financial operations.
 * Handles Invoices, Commissions, and Billing synchronization.
 */
export const FinancialService = {
    /**
     * Synchronizes an invoice and its commission based on appointment status.
     * Logic migrated from appointments.ts
     */
    async syncInvoiceAndCommission(
        supabase: SupabaseClient,
        appointmentId: string,
        status: string,
        paymentDetails?: { method: string, date?: string },
        keepFinancial: boolean = false
    ) {
        const { data: appointment } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()

        if (appointment) {
            let invoiceStatus = null;
            if (status === 'billed' || status === 'attended' || status === 'completed' || status === 'paid') {
                invoiceStatus = 'paid'
            } else if (['scheduled', 'cancelled', 'no_show', 'blocked'].includes(status)) {
                if (!keepFinancial) {
                    invoiceStatus = 'cancelled'
                }
            }

            if (invoiceStatus) {
                const { data: invItems } = await supabase.from('invoice_items').select('invoice_id').eq('appointment_id', appointmentId).single()
                const invoiceId = appointment.invoice_id || invItems?.invoice_id

                if (invoiceId) {
                    const updatePayload: any = { status: invoiceStatus }
                    if (invoiceStatus === 'paid' && paymentDetails?.method) {
                        updatePayload.payment_method = paymentDetails.method
                        updatePayload.payment_date = paymentDetails.date || new Date().toISOString()
                    }
                    await supabase.from('invoices').update(updatePayload).eq('id', invoiceId)
                }
            }

            // Commission logic
            if (status === 'billed' || status === 'attended' || status === 'completed' || status === 'paid') {
                try {
                    await this.calculateAndSaveCommission(supabase, appointmentId)
                } catch (commError) {
                    console.error('[FinancialService] Commission error:', commError)
                }
            } else {
                if (!keepFinancial) {
                    await supabase.from('financial_commissions').delete().eq('appointment_id', appointmentId)
                }
            }
        }
    },

    /**
     * Calculates and saves commission for a professional.
     */
    async calculateAndSaveCommission(supabase: SupabaseClient, appointmentId: string) {
        const { data: appointment } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
        if (!appointment) return

        // Fetch commission rules
        const { data: rules } = await supabase
            .from('professional_commission_rules')
            .select('*')
            .eq('professional_id', appointment.professional_id)

        if (!rules || rules.length === 0) return

        let rule = rules.find((r: any) => r.service_id === appointment.service_id)
        if (!rule) rule = rules.find((r: any) => r.service_id === null)

        if (rule) {
            let basis = Number(appointment.price)

            // Adjust basis if net calculation is required
            if (rule.calculation_basis === 'net') {
                const { data: invItems } = await supabase.from('invoice_items').select('invoice_id').eq('appointment_id', appointmentId).single()
                const invoiceId = appointment.invoice_id || invItems?.invoice_id

                if (invoiceId) {
                    const { data: invoice } = await supabase.from('invoices').select('payment_method, installments, applied_fee_rate').eq('id', invoiceId).single()
                    if (invoice) {
                        let feePercent = Number(invoice.applied_fee_rate || 0)
                        if (feePercent === 0 && invoice.payment_method) {
                            const { data: fees } = await supabase.from('payment_method_fees').select('fee_percent').eq('method', invoice.payment_method).eq('installments', invoice.installments || 1).single()
                            if (fees) feePercent = fees.fee_percent
                        }
                        basis = basis * (1 - (feePercent / 100))
                    }
                }
            }

            let commissionValue = rule.type === 'percentage'
                ? basis * (rule.value / 100)
                : Number(rule.value)

            const { data: existingComm } = await supabase.from('financial_commissions').select('id, status').eq('appointment_id', appointmentId).single()

            if (existingComm) {
                if (existingComm.status === 'paid') return
                await supabase.from('financial_commissions').update({
                    amount: commissionValue,
                    professional_id: appointment.professional_id,
                    updated_at: new Date().toISOString()
                }).eq('id', existingComm.id)
            } else {
                await supabase.from('financial_commissions').insert({
                    appointment_id: appointmentId,
                    professional_id: appointment.professional_id,
                    amount: commissionValue,
                    status: 'pending',
                    organization_id: appointment.organization_id
                })
            }
        }
    }
}
