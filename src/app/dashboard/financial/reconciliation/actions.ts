
'use server'

import { createClient } from "@/lib/supabase/server"
import { parseOFX } from "@/lib/ofx-parser"

export async function processBankFile(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: "Arquivo inválido" }

    const text = await file.text()
    const transactions = parseOFX(text)

    // Save to DB (bank_transactions) and Find Matches
    const supabase = await createClient()

    const results = []

    for (const tx of transactions) {
        let match = null

        if (tx.amount < 0) {
            // Expense Logic (Existing)
            const { data: matches } = await supabase
                .from('financial_payables')
                .select('*')
                .eq('amount', Math.abs(tx.amount))
                .eq('status', 'pending')
                .limit(1)
            match = matches?.[0] || null
        } else {
            // Income Logic (New)
            // Search in appointments (price ~= amount)
            // TODO: Date buffer check? For now strict amount.
            const { data: matches } = await supabase
                .from('appointments')
                .select('*') // Need patient name?
                .eq('price', tx.amount)
                .in('status', ['scheduled', 'completed', 'pending']) // which statuses mean 'unpaid'? 'scheduled' for sure.
                .is('paid_at', null) // Only unpaid
                .limit(1)

            if (matches?.[0]) {
                // Fetch patient name for better context
                const { data: patient } = await supabase.from('patients').select('name').eq('id', matches[0].patient_id).single()
                match = { ...matches[0], description: `Agendamento: ${patient?.name || 'Paciente'}` } // Adapting to match structure
                match = { ...match, type: 'appointment' } // Tag it
            }
        }

        results.push({
            ...tx,
            bank_id: 'temp_' + Math.random(), // DB storage for bank_tx needed later?
            suggested_match: match
        })
    }

    return { data: results }
}

export async function reconcileTransaction(bankId: string, systemId: string) {
    // 1. Mark Payable as Paid
    // 2. Link objects
    const supabase = await createClient()

    // Use systemId to update payable
    if (systemId) {
        await supabase.from('financial_payables').update({
            status: 'paid',
            paid_at: new Date().toISOString()
        }).eq('id', systemId)
    }

    return { succes: true }
}

export async function createTransactionFromBank(tx: any) {
    // Create new payable (paid) or expense record
    const supabase = await createClient()

    await supabase.from('financial_payables').insert({
        description: tx.description,
        amount: Math.abs(tx.amount),
        due_date: tx.date,
        status: 'paid',
        paid_at: new Date().toISOString(),
        recurrence: 'none',
        category: tx.category || 'general',
        is_excluded: tx.is_excluded || false,
        linked_professional_id: tx.linked_professional_id || null
    })

    return { success: true }
}
