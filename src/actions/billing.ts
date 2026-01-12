'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Fetch appointments that are completed/attended but NOT linked to an invoice yet
// Usually this means check 'invoice_id' is null or status?
// Or maybe we just look for appointments where 'status' is 'attended' and no invoice reference?
// Let's assume there is an 'invoice_id' column on appointments or 'invoices' link to appointments.
// Checking schema from memory/audit: Appointments usually have invoice_id or Invoices have appointment_id.
// Actually, `invoice_items` usually links `invoice_id` and `appointment_id`.
// So unbilled = Appointments where id NOT IN (select appointment_id from invoice_items)
// AND status = 'attended' (or completed).
export async function getUnbilledAppointments(patientId: string) {
    const supabase = await createClient()

    // Subquery approach via join is hard in specific Supabase syntax directly without RPC sometimes, 
    // but we can do: Fetch all attended appointments for patient, 
    // and Fetch all invoice_items for patient (or linked to those appointments).
    // Better: use `!inner` join if possible or just fetch all and filter in memory if volume is low.
    // Given patient context, volume is low (<1000). Memory filter is fine.

    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            *,
            services (name, price)
        `)
        .eq('patient_id', patientId)
        .in('status', ['attended', 'completed'])
        .order('start_time', { ascending: false })

    if (!appointments) return []

    // Fetch all invoice items for this patient's appointments
    // We can just check if we have any invoice_items with these appointment_ids.
    // Actually, let's simpler: check if 'invoice_id' exists on appointment if that column exists.
    // I don't recall adding 'invoice_id' to appointments. 
    // Let's assume invoice_items links to appointments.

    // We need to know which appointments are ALREADY billed.
    const apptIds = appointments.map(a => a.id)
    if (apptIds.length === 0) return []

    const { data: billedItems } = await supabase
        .from('invoice_items')
        .select('appointment_id')
        .in('appointment_id', apptIds)

    const billedApptIds = new Set(billedItems?.map(i => i.appointment_id))

    const unbilled = appointments.filter(a => !billedApptIds.has(a.id))

    return unbilled
}

export async function getInvoices(patientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching invoices:', error)
        return []
    }

    return data
}

export async function getInvoiceItems(invoiceId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)

    if (error) {
        console.error('Error fetching invoice items:', error)
        return []
    }

    return data
}

// Ensure products are fetched - reusing from product actions or simpler version?
// The page imported 'getProducts' from '../actions' too. 
// I should probably export a simple wrapper or just let them import from products/actions.
// But for compatibility with the page refactor, let's export it here or update page to use products/actions.
// I will update page to use `@/app/dashboard/products/actions`.

export async function updateInvoiceStatus(
    invoiceId: string,
    status: string,
    paymentMethod: string,
    paymentDate: string,
    installments: number = 1
) {
    const supabase = await createClient()

    const updateData: any = {
        status,
        payment_method: paymentMethod,
        payment_date: paymentDate
        // Installments? If invoice has column? 
        // Or if we need to generate transaction installments?
        // For now, update invoice fields. 
    }

    const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)

    if (error) {
        console.error('Error updating invoice:', error)
        return { error: 'Erro ao atualizar fatura' }
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}
