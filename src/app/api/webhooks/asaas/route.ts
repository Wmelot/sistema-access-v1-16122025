
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { event, payment } = body

        console.log(`[Asaas Webhook] Received event: ${event}`, payment.id)

        // Events: PAYMENT_RECEIVED, PAYMENT_CONFIRMED
        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            const supabase = await createClient()
            const externalReference = payment.externalReference

            if (!externalReference) {
                console.warn(`[Asaas Webhook] No externalReference found for payment ${payment.id}`)
                return NextResponse.json({ received: true })
            }

            // We expect externalReference to be the transaction ID
            const { data: transaction, error: fetchError } = await supabase
                .from('transactions')
                .select('id, status')
                .eq('id', externalReference)
                .single()

            if (fetchError || !transaction) {
                console.warn(`[Asaas Webhook] Transaction ${externalReference} not found in database`)
                return NextResponse.json({ received: true })
            }

            if (transaction.status === 'paid') {
                console.log(`[Asaas Webhook] Transaction ${externalReference} already marked as paid`)
                return NextResponse.json({ received: true })
            }

            // Update transaction
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    status: 'paid',
                    paid_at: payment.confirmedDate ? new Date(payment.confirmedDate).toISOString() : new Date().toISOString(),
                    payment_method: payment.billingType === 'PIX' ? 'pix' : 'boleto', // Simplified mapping
                    amount: payment.value
                })
                .eq('id', externalReference)

            if (updateError) {
                console.error(`[Asaas Webhook] Error updating transaction ${externalReference}:`, updateError)
                return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
            }

            console.log(`[Asaas Webhook] Transaction ${externalReference} updated to paid`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[Asaas Webhook] Error processing webhook:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
