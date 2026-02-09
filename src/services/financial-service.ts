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

        // Fetch professional profile to check if partner
        const { data: prof } = await supabase.from('profiles').select('is_partner, tax_percent, professional_expenses').eq('id', appointment.professional_id).single()

        if (prof?.is_partner) {
            // PARTNER LOGIC (Modelo Axiom)
            // Receiving 100% of Net after taxes and expenses
            const gross = Number(appointment.price)

            // 1. Get Machine Fee
            let feeAmount = 0
            const { data: invItems } = await supabase.from('invoice_items').select('invoice_id').eq('appointment_id', appointmentId).single()
            const invoiceId = appointment.invoice_id || invItems?.invoice_id

            if (invoiceId) {
                const { data: invoice } = await supabase.from('invoices').select('payment_method, installments, applied_fee_rate, fee_fixed').eq('id', invoiceId).single()
                if (invoice) {
                    let feeRate = Number(invoice.applied_fee_rate || 0)
                    if (feeRate === 0 && invoice.payment_method) {
                        const { data: fees } = await supabase.from('payment_method_fees').select('fee_percent').eq('method', invoice.payment_method).eq('installments', invoice.installments || 1).single()
                        if (fees) feeRate = fees.fee_percent
                    }
                    const feeFixed = Number(invoice.fee_fixed || 0)
                    feeAmount = (gross * (feeRate / 100)) + feeFixed
                }
            }

            // 2. Apply Partner Taxes and Personal Expenses
            const taxAmount = (gross * ((prof.tax_percent || 0) / 100))
            const expenses = Number(prof.professional_expenses || 0)

            let commissionValue = gross - feeAmount - taxAmount - expenses
            if (commissionValue < 0) commissionValue = 0

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
            return
        }

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
                    const { data: invoice } = await supabase.from('invoices').select('payment_method, installments, applied_fee_rate, fee_fixed').eq('id', invoiceId).single()
                    if (invoice) {
                        let feeRate = Number(invoice.applied_fee_rate || 0)
                        if (feeRate === 0 && invoice.payment_method) {
                            const { data: fees } = await supabase.from('payment_method_fees').select('fee_percent').eq('method', invoice.payment_method).eq('installments', invoice.installments || 1).single()
                            if (fees) feeRate = fees.fee_percent
                        }
                        const feeFixed = Number(invoice.fee_fixed || 0)
                        basis = (basis * (1 - (feeRate / 100))) - feeFixed
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
