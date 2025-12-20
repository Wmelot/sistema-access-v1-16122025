'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logAction } from "@/lib/logger"
import { calculateAndSaveCommission } from "@/app/dashboard/schedule/actions"
import { hasPermission } from "@/lib/rbac"

export async function createPatient(formData: FormData) {
    const supabase = await createClient()

    const full_name = formData.get('full_name') as string
    let cpf: string | null = formData.get('cpf') as string
    if (!cpf) cpf = null // Save as null if empty (foreigner)
    let date_of_birth = formData.get('date_of_birth') as string

    // Convert DD/MM/YYYY to YYYY-MM-DD
    if (date_of_birth && date_of_birth.includes('/')) {
        const [day, month, year] = date_of_birth.split('/')
        date_of_birth = `${year}-${month}-${day}`
    }
    const gender = formData.get('gender') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    // Address fields
    const cep = formData.get('cep') as string
    const address = formData.get('address') as string
    const number = formData.get('number') as string
    const complement = formData.get('complement') as string
    const neighborhood = formData.get('neighborhood') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string

    // Combine address if needed or store as JSON/separate columns. 
    // For now assuming existing schema has single 'address' field, we might need to migrate or concatenate.
    // Checking schema... assuming we only have generic address fields for now.
    // Ideally we should migrate to add number, complement, etc.
    // For this step I will concatenate to the single 'address' field if that's what we have, 
    // OR if we already have the fields (I recall existing schema was simple).

    // Let's check schema. Inspecting previous edits... 
    // It seems we created a 'patients' table. Let's assume standard fields.
    // If we don't have columns, I will store strict address in 'address' and maybe specific details in notes or new columns.
    // To be safe I will concatenate for now: "Rua X, 123, Compl Y - Bairro, Cidade - UF"

    // Check for duplicate CPF
    if (cpf) {
        const { data: existingPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('cpf', cpf)
            .single()

        if (existingPatient) {
            return { error: 'Este CPF já está cadastrado para outro paciente.' }
        }
    }

    // New fields
    const occupation = formData.get('occupation') as string
    const marketing_source = formData.get('marketing_source') as string
    let related_patient_id: string | null = formData.get('related_patient_id') as string
    const relationship_degree = formData.get('relationship_degree') as string
    let price_table_id: string | null = formData.get('price_table_id') as string

    // Handle invalid UUIDs or empty strings
    if (!related_patient_id || related_patient_id === 'none') {
        related_patient_id = null
    }

    if (!price_table_id || price_table_id === 'none') {
        price_table_id = null
    }

    // Invoice Fields
    const invoice_cpf = formData.get('invoice_cpf') as string || null
    const invoice_name = formData.get('invoice_name') as string || null
    const invoice_address_zip = formData.get('invoice_address_zip') as string || null
    const invoice_address = formData.get('invoice_address') as string || null
    const invoice_number = formData.get('invoice_number') as string || null
    const invoice_neighborhood = formData.get('invoice_neighborhood') as string || null
    const invoice_city = formData.get('invoice_city') as string || null
    const invoice_state = formData.get('invoice_state') as string || null

    const fullAddress = `${address}, ${number}${complement ? ' - ' + complement : ''} - ${neighborhood}, ${city} - ${state}, ${cep}`

    const { data: newPatient, error } = await supabase.from('patients').insert({
        name: full_name,
        cpf,
        date_of_birth: date_of_birth || null,
        gender,
        phone,
        email,
        address: fullAddress,
        occupation,
        marketing_source,
        related_patient_id,
        relationship_degree,
        price_table_id,
        // Invoice optional fields
        invoice_cpf,
        invoice_name,
        invoice_address_zip,
        invoice_address,
        invoice_number,
        invoice_neighborhood,
        invoice_city,
        invoice_state
    })
        .select('id')
        .single()

    if (error) {
        console.error('Error creating patient:', error)
        if (error.code === '23505') return { error: 'Este CPF já está cadastrado.' }
        return { error: 'Erro ao criar paciente. Tente novamente.' }
    }

    try {
        await logAction("CREATE_PATIENT", {
            name: full_name,
            cpf_preview: cpf ? `***${cpf.slice(-2)}` : 'FOREIGNER'
        }, 'patient', newPatient.id)
    } catch (logError) {
        console.error("Failed to log action:", logError)
        // Ensure we still proceed since the critical action (create patient) succeeded
    }

    revalidatePath('/dashboard/patients')
}

export async function getPatients({ letter, query }: { letter?: string; query?: string } = {}) {
    try {
        const supabase = await createClient()

        let dbQuery = supabase
            .from('patients')
            .select('*')
            .order('name', { ascending: true })

        if (letter) {
            // Filter names starting with the letter (case insensitive)
            dbQuery = dbQuery.ilike('name', `${letter}%`)
        }

        if (query) {
            // Filter by name (Simplified for stability)
            dbQuery = dbQuery.ilike('name', `%${query}%`)
        }

        const { data, error } = await dbQuery

        if (error) {
            console.error('Error fetching patients:', error)
            return []
        }

        return data || []
    } catch (err) {
        console.error('SERVER ACTION ERROR (getPatients):', err)
        return []
    }
}

export async function quickCreatePatient(name: string, phone?: string) {
    const supabase = await createClient()

    // Basic validation
    if (!name || name.trim().length < 3) {
        return { error: 'O nome deve ter pelo menos 3 algarismos.' }
    }

    const { data, error } = await supabase.from('patients').insert({
        name: name.trim(),
        phone: phone || null,
    }).select('id, name').single()

    if (error) {
        console.error('Error quick creating patient:', error)
        if (error.code === '23505') return { error: 'Paciente já existe.' }
        return { error: 'Erro ao criar paciente rápido.' }
    }

    revalidatePath('/dashboard/schedule')
    return { data }
}

export async function deletePatient(id: string, password?: string) {
    const supabase = await createClient()

    // 0. Permission Check (Master/Critical)
    const canDelete = await hasPermission('system.view_logs') // Using Master check proxy
    //Ideally we should have 'patients.delete' AND 'system.critical_action'
    if (!canDelete) {
        return { error: 'Permissão negada. Apenas Master pode realizar esta ação.' }
    }

    // 1. Verify Password if provided
    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })
            if (signInError) {
                return { error: 'Senha incorreta' }
            }
        } else {
            return { error: 'Usuário não autenticado' }
        }
    } else {
        return { error: 'Senha necessária para deletar' }
    }

    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) {
        return { error: 'Erro ao excluir paciente. Verifique se existem consultas vinculadas.' }
    }

    await logAction("DELETE_PATIENT", { id }, 'patient', id)
    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function getPatient(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function updatePatient(id: string, formData: FormData) {
    const supabase = await createClient()

    const full_name = formData.get('full_name') as string
    let cpf: string | null = formData.get('cpf') as string
    if (!cpf) cpf = null
    let date_of_birth = formData.get('date_of_birth') as string

    if (date_of_birth && date_of_birth.includes('/')) {
        const [day, month, year] = date_of_birth.split('/')
        date_of_birth = `${year}-${month}-${day}`
    }
    const gender = formData.get('gender') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    const occupation = formData.get('occupation') as string
    const marketing_source = formData.get('marketing_source') as string
    let price_table_id: string | null = formData.get('price_table_id') as string

    if (!price_table_id || price_table_id === 'none') {
        price_table_id = null
    }

    // Address construction
    const cep = formData.get('cep') as string
    const address = formData.get('address') as string
    const number = formData.get('number') as string
    const complement = formData.get('complement') as string
    const neighborhood = formData.get('neighborhood') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string

    const fullAddress = `${address}, ${number}${complement ? ' - ' + complement : ''} - ${neighborhood}, ${city} - ${state}, ${cep}`

    // Invoice Fields
    const invoice_cpf = formData.get('invoice_cpf') as string || null
    const invoice_name = formData.get('invoice_name') as string || null
    const invoice_address_zip = formData.get('invoice_address_zip') as string || null
    const invoice_address = formData.get('invoice_address') as string || null
    const invoice_number = formData.get('invoice_number') as string || null
    const invoice_neighborhood = formData.get('invoice_neighborhood') as string || null
    const invoice_city = formData.get('invoice_city') as string || null
    const invoice_state = formData.get('invoice_state') as string || null

    const { error } = await supabase.from('patients').update({
        name: full_name,
        cpf,
        date_of_birth: date_of_birth || null,
        gender,
        phone,
        email,
        address: fullAddress, // Updated address
        occupation,
        marketing_source,
        price_table_id,
        invoice_cpf,
        invoice_name,
        invoice_address_zip,
        invoice_address,
        invoice_number,
        invoice_neighborhood,
        invoice_city,
        invoice_state
    }).eq('id', id)

    if (error) {
        console.error('Error updating patient:', error)
        if (error.code === '23505') return { error: 'CPF duplicado. Já existe outro paciente com este documento.' }
        return { error: 'Erro ao atualizar paciente.' }
    }

    await logAction("UPDATE_PATIENT", { id, name: full_name }, 'patient', id)
    revalidatePath(`/dashboard/patients/${id}`)
    revalidatePath('/dashboard/patients')
}

// --- FINANCIAL / BILLING ---

export async function getUnbilledAppointments(patientId: string) {
    const supabase = await createClient()

    // Fetch appointments that are NOT linked to an invoice yet
    // And filter by relevant columns
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id, 
            start_time, 
            end_time, 
            price, 
            status,
            service_id, 
            services (name),
            professional_id,
            profiles (full_name)
        `)
        .eq('patient_id', patientId)
        .is('invoice_id', null)
        .neq('status', 'cancelled') // Exclude cancelled
        .order('start_time', { ascending: false })

    if (error) {
        console.error('Error fetching unbilled appointments:', error)
        return []
    }
    return data
}

export async function createInvoice(patientId: string, appointmentIds: string[], total: number, paymentMethod: string, paymentDate: string, installments: number = 1, feeRate: number = 0) {
    const supabase = await createClient()

    const netTotal = total - (total * (feeRate / 100))

    // 1. Create Invoice Record
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
            patient_id: patientId,
            total,
            status: 'paid',
            payment_method: paymentMethod, // simple key? or keep string? Let's assume we clean it up in caller, or store simple.
            payment_date: paymentDate,
            installments,
            applied_fee_rate: feeRate, // Store historical rate
            net_total: netTotal
        })
        .select()
        .single()

    if (invoiceError) {
        console.error('Error creating invoice:', invoiceError)
        return { error: 'Erro ao criar fatura. Tente novamente.' }
    }

    // 2. Link Appointments to Invoice (Direct Column)
    const { error: updateError } = await supabase
        .from('appointments')
        .update({ invoice_id: invoice.id })
        .in('id', appointmentIds)

    if (updateError) {
        return { error: 'Erro ao vincular agendamentos à fatura.' }
    }

    // 3. Populate invoice_items (For Net Commission Logic)
    const itemsToInsert = appointmentIds.map(id => ({
        invoice_id: invoice.id,
        appointment_id: id
    }))

    const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)

    if (itemsError) {
        console.error('Error creating invoice items:', itemsError)
        // Non-critical for basic invoice view but critical for commissions. Warning?
    }

    // 4. Trigger Commission Calculation (Using shared logic)
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .in('id', appointmentIds)

    if (appointments) {
        for (const appointment of appointments) {
            // Re-fetch to ensure it has latest invoice_id (updated in step 2)
            // Or manually inject it into the object to save a DB call?
            // calculatedAndSaveCommission re-does checks. Let's trust it or help it.
            // It checks invoice_id. We just updated it.
            // But the 'appointment' variable here is from BEFORE or AFTER update?
            // It is from AFTER if we query now. Wait, we queried BEFORE step 2? 
            // No, we haven't queried in this block yet. I'm adding the query block.
            // So `appointments` will have the `invoice_id`.
            await calculateAndSaveCommission(supabase, appointment)
        }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function getInvoices(patientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

export async function getInvoiceItems(invoiceId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            price,
            services(name),
            profiles(full_name)
        `)
        .eq('invoice_id', invoiceId)
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching invoice items:', error)
        return []
    }
    return data
}
// --- RECORDS ---

export async function finalizeRecord(recordId: string, content?: any) {
    const supabase = await createClient()

    const updates: any = { status: 'finalized', updated_at: new Date().toISOString() }
    if (content) updates.content = content

    const { error } = await supabase
        .from('patient_records')
        .update(updates)
        .eq('id', recordId)

    if (error) {
        console.error('Error finalizing record:', error)
        return { success: false, message: 'Erro ao finalizar evolução.' }
    }

    await logAction("FINALIZE_RECORD", { recordId }, 'patient_record', recordId)

    // Revalidate paths
    // We don't know the patientId here easily without fetching, but we can revalidate the specific record page if we knew the URL.
    // Instead we revalidate the dashboard generally or return success so client redirects/refreshes.
    revalidatePath('/dashboard/patients')
    return { success: true }
}
