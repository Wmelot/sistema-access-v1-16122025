'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logAction } from "@/lib/logger"
import { calculateAndSaveCommission } from "@/app/dashboard/schedule/actions"
import { hasPermission } from "@/lib/rbac"
import { updateAppointmentStatus } from "@/app/dashboard/schedule/actions" // [NEW] Link to Schedule
import { sendMessage } from "@/app/dashboard/settings/communication/actions" // [NEW] Messaging

export async function createPatient(formData: FormData) {
    try {
        const supabase = await createClient()

        const full_name = formData.get('full_name') as string
        let cpf: string | null = formData.get('cpf') as string
        if (!cpf || cpf.length === 0) cpf = null

        let date_of_birth = formData.get('date_of_birth') as string

        // Convert DD/MM/YYYY to YYYY-MM-DD
        if (date_of_birth && date_of_birth.includes('/')) {
            const [day, month, year] = date_of_birth.split('/')
            date_of_birth = `${year}-${month}-${day}`
        }

        const gender = formData.get('gender') as string || null
        const phone = formData.get('phone') as string || null
        const email = formData.get('email') as string || null

        // Address fields
        const cep = formData.get('cep') as string || ''
        const address = formData.get('address') as string || ''
        const number = formData.get('number') as string || ''
        const complement = formData.get('complement') as string || ''
        const neighborhood = formData.get('neighborhood') as string || ''
        const city = formData.get('city') as string || ''
        const state = formData.get('state') as string || ''

        const fullAddress = `${address}, ${number}${complement ? ' - ' + complement : ''} - ${neighborhood}, ${city} - ${state}, ${cep}`

        const addressData = {
            street: address,
            number,
            complement,
            neighborhood,
            city,
            state,
            zip_code: cep,
            full_text: fullAddress
        }
        const addressStorage = JSON.stringify(addressData)

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
        const occupation = formData.get('occupation') as string || null
        const marketing_source = formData.get('marketing_source') as string || null
        let related_patient_id: string | null = formData.get('related_patient_id') as string
        const relationship_degree = formData.get('relationship_degree') as string || null
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

        // LGPD Consent
        const health_data_consent = formData.get('health_data_consent') === 'on'

        const { data: newPatient, error } = await supabase.from('patients').insert({
            name: full_name,
            cpf,
            date_of_birth: date_of_birth || null,
            gender,
            phone,
            email,
            address: addressStorage,
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
            invoice_state,
            health_data_consent
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
        }

        revalidatePath('/dashboard/patients')
        return { success: true, patient: newPatient }

    } catch (err: any) {
        console.error("UNEXPECTED ERROR in createPatient:", err)
        return { error: `Erro inesperado: ${err.message}` }
    }
}

// Pagination Interface
export async function getPatients({
    letter,
    query,
    page = 1,
    limit = 50,
    sort,
    order = 'asc'
}: {
    letter?: string;
    query?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
} = {}) {
    try {
        const supabase = await createClient()
        const from = (page - 1) * limit
        const to = from + limit - 1

        let dbQuery = supabase
            .from('patients')
            .select('*', { count: 'exact' })
            .range(from, to)

        // Apply Sorting
        if (sort && ['name', 'cpf', 'email', 'phone', 'created_at'].includes(sort)) {
            dbQuery = dbQuery.order(sort, { ascending: order === 'asc' })
        } else {
            // Default sort
            dbQuery = dbQuery.order('name', { ascending: true })
        }

        if (letter) {
            dbQuery = dbQuery.ilike('name', `${letter}%`)
        }

        if (query) {
            dbQuery = dbQuery.ilike('name', `%${query}%`)
        }

        const { data, error, count } = await dbQuery

        if (error) {
            console.error('Error fetching patients:', error)
            return { data: [], count: 0 }
        }

        return { data: data || [], count: count || 0 }
    } catch (err) {
        console.error('SERVER ACTION ERROR (getPatients):', err)
        return { data: [], count: 0 }
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
    if (error) return null

    // [FIX] Parse JSON address if present to allow proper editing
    if (data && data.address && (data.address.startsWith('{') || data.address.trim().startsWith('{'))) {
        try {
            const parsed = JSON.parse(data.address)
            // Mutate data to expose discrete fields that PatientForm expects
            // PatientForm maps: address -> street (logradouro), number -> number, etc.
            data.address = parsed.street || parsed.address || '' // Map street to address (legacy prop name for Logradouro)
            data.number = parsed.number || ''
            data.complement = parsed.complement || ''
            data.neighborhood = parsed.neighborhood || ''
            data.city = parsed.city || ''
            data.state = parsed.state || ''
            data.cep = parsed.zip_code || parsed.cep || ''
        } catch (e) {
            // Failed to parse, assume legacy string.
            // data.address remains as string. Other fields remain undefined.
        }
    }

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

    const addressData = {
        street: address,
        number,
        complement,
        neighborhood,
        city,
        state,
        zip_code: cep
    }
    const addressStorage = JSON.stringify(addressData)

    // Invoice Fields
    const invoice_cpf = formData.get('invoice_cpf') as string || null
    const invoice_name = formData.get('invoice_name') as string || null
    const invoice_address_zip = formData.get('invoice_address_zip') as string || null
    const invoice_address = formData.get('invoice_address') as string || null
    const invoice_number = formData.get('invoice_number') as string || null
    const invoice_neighborhood = formData.get('invoice_neighborhood') as string || null
    const invoice_city = formData.get('invoice_city') as string || null
    const invoice_state = formData.get('invoice_state') as string || null

    // LGPD Consent
    const health_data_consent = formData.get('health_data_consent') === 'on'

    const { error } = await supabase.from('patients').update({
        name: full_name,
        cpf,
        date_of_birth: date_of_birth || null,
        gender,
        phone,
        email,
        address: addressStorage, // Updated address as JSON
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
        invoice_state,
        health_data_consent
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

export async function createInvoice(patientId: string, appointmentIds: string[], total: number, paymentMethod: string, paymentDate: string, installments: number = 1, feeRate: number = 0, extraItems: any[] = [], status: 'paid' | 'pending' = 'paid') {
    const supabase = await createClient()

    const netTotal = total - (total * (feeRate / 100))

    // 0. Fetch Appointments Data (Needed for Item Description/Price)
    const { data: appointmentsRaw } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .in('id', appointmentIds)

    // [IDEMPOTENCY CHECK] Check if any appointment already has an invoice
    const alreadyBilled = appointmentsRaw?.find(a => a.invoice_id !== null)
    if (alreadyBilled) {
        console.warn(`[createInvoice] Blocked duplicate invoice for appointment ${alreadyBilled.id} (Invoice ${alreadyBilled.invoice_id})`)
        return { error: 'Atenção: Já existe uma fatura gerada para este atendimento. Verifique o histórico financeiro.' }
    }

    // 1. Create Invoice Record
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
            patient_id: patientId,
            total,
            status, // Use passed status

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

    // 2. Link Appointments to Invoice AND Update Price (if single appointment)
    let updateError = null

    if (appointmentIds.length === 1) {
        // Correctly calculate Service Price part: Total - Products
        // extraItems = [{ unit_price, quantity, ... }]
        const productsTotal = extraItems.reduce((acc, item) => acc + (item.unitPrice * (item.quantity || 1)), 0)
        const newServicePrice = Math.max(0, total - productsTotal)

        const { error } = await supabase
            .from('appointments')
            .update({
                invoice_id: invoice.id,
                price: newServicePrice  // [FIX] Update price to reflect financial change
            })
            .in('id', appointmentIds)
        updateError = error
    } else {
        // Multiple appointments, just link invoice
        const { error } = await supabase
            .from('appointments')
            .update({ invoice_id: invoice.id })
            .in('id', appointmentIds)
        updateError = error
    }

    if (updateError) {
        return { error: 'Erro ao vincular agendamentos à fatura.' }
    }

    // 3. Populate invoice_items (For Appointments)
    const itemsToInsert: any[] = appointmentIds.map(id => ({
        invoice_id: invoice.id,
        appointment_id: id,
        description: 'Atendimento' + (appointmentsRaw?.find(a => a.id === id)?.services?.name ? ` - ${appointmentsRaw.find(a => a.id === id).services.name}` : ''),
        unit_price: appointmentsRaw?.find(a => a.id === id)?.price || 0,
        cost_price: 0, // Appointments are services, assumption: no direct product cost
        total_price: appointmentsRaw?.find(a => a.id === id)?.price || 0,
        quantity: 1,
        product_id: null // Appointments are not products
    }))

    // 3.1. Populate invoice_items (For Extra Products)
    if (extraItems && extraItems.length > 0) {
        // extraItems format: { productId: string, name: string, quantity: number, unitPrice: number, costPrice: number }
        extraItems.forEach((item: any) => {
            itemsToInsert.push({
                invoice_id: invoice.id,
                appointment_id: null,
                description: item.name,
                cost_price: item.costPrice || 0, // Save cost price
                total_price: item.unitPrice * item.quantity,
                quantity: item.quantity,
                product_id: item.productId // [NEW] Save Product ID for history
            } as any)
        })
    }

    const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert.map(item => ({
            invoice_id: item.invoice_id,
            appointment_id: item.appointment_id,
            description: item.description,
            unit_price: item.unit_price,
            cost_price: item.cost_price,
            total_price: item.total_price,
            quantity: item.quantity,
            product_id: item.product_id // [NEW] Link to Product
        })))

    if (itemsError) {
        console.error('Error creating invoice items:', itemsError)
    }

    // 4. Trigger Commission Calculation (Using shared logic)
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .in('id', appointmentIds)

    if (appointments) {
        for (const appointment of appointments) {
            await calculateAndSaveCommission(supabase, appointment)
        }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function getProducts() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name')

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }
    return data
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
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true })

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

    // [NEW] Auto-Complete Appointment logic
    // We need to fetch the appointment_id from the record first
    const { data: record, error: fetchError } = await supabase
        .from('patient_records')
        .select('appointment_id')
        .eq('id', recordId)
        .single()

    if (record && record.appointment_id) {
        console.log(`[Auto-Complete] Finalizing appointment ${record.appointment_id} linked to record ${recordId}`)
        // We use the shared action to update status + handle commission
        await updateAppointmentStatus(record.appointment_id, 'completed')
    }

    // Revalidate paths
    // We don't know the patientId here easily without fetching, but we can revalidate the specific record page if we knew the URL.
    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function deleteRecord(recordId: string, password?: string) {
    const supabase = await createClient()

    // 1. Security Check (Password) (Biometrics Phase 1)
    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })

            if (authError) {
                return { success: false, message: 'Senha incorreta.' }
            }
        }
    } else {
        return { success: false, message: 'Confirmação de segurança necessária.' }
    }

    // 2. Perform Deletion
    const { error } = await supabase
        .from('patient_records')
        .delete()
        .eq('id', recordId)

    if (error) {
        console.error('Error deleting record:', error)
        return { success: false, message: 'Erro ao excluir avaliação.' }
    }

    await logAction("DELETE_RECORD", { recordId }, 'patient_record', recordId)
    revalidatePath('/dashboard/patients')
    return { success: true }
}


export async function searchCep(cep: string) {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return { error: 'CEP inválido' }

    try {
        // 1. Try ViaCEP
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            signal: AbortSignal.timeout(5000) // 5s timeout
        })
        if (response.ok) {
            const data = await response.json()
            if (!data.erro) {
                return { data }
            }
        }
    } catch (viacepError) {
        console.warn('ViaCEP failed, trying BrasilAPI...', viacepError)
    }

    try {
        // 2. Fallback to BrasilAPI
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
            signal: AbortSignal.timeout(5000)
        })

        if (!response.ok) {
            if (response.status === 404) return { error: 'CEP não encontrado' }
            throw new Error('BrasilAPI error')
        }

        const data = await response.json()

        // Map BrasilAPI format to match ViaCEP (so the frontend doesn't break)
        return {
            data: {
                logradouro: data.street,
                bairro: data.neighborhood,
                localidade: data.city,
                uf: data.state
            }
        }

    } catch (brasilApiError) {
        console.error('All CEP services failed:', brasilApiError)
        return { error: 'Não foi possível consultar o CEP. Digite o endereço manualmente.' }
    }
}

export async function updateInvoiceStatus(invoiceId: string, status: 'paid' | 'pending', paymentMethod?: string, paymentDate?: string, installments?: number) {
    const supabase = await createClient()

    const updates: any = { status }
    if (paymentMethod) updates.payment_method = paymentMethod
    if (paymentDate) updates.payment_date = paymentDate
    if (installments) updates.installments = installments

    const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)

    if (error) {
        console.error('Error updating invoice status:', error)
        return { error: 'Erro ao atualizar status da fatura.' }
    }

    revalidatePath('/dashboard/patients')
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard')
    return { success: true }
}

// --- LGPD REMOTE CONSENT ---
export async function generateConsentToken(patientId: string, sendWhatsApp: boolean = false) {
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 1. Fetch Patient Info (if sending message)
    let patientPhone = null
    let patientName = 'Paciente'
    if (sendWhatsApp) {
        const { data: p } = await supabase.from('patients').select('phone, name').eq('id', patientId).single()
        if (!p?.phone) return { error: 'Paciente sem telefone cadastrado.' }
        patientPhone = p.phone
        patientName = p.name.split(' ')[0] // First name
    }

    // 2. Generate Token (Direct Insert - Bypass RPC/Cache)
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    const { error } = await supabase
        .from('consent_tokens')
        .insert({
            patient_id: patientId,
            token: token,
            expires_at: expiresAt.toISOString()
        })

    if (error) {
        console.error('Error generating token (Direct):', error)
        await supabase.from('system_logs').insert({
            action: 'ERROR_CONSENT_GENERATE',
            table_name: 'consent_tokens',
            details: JSON.stringify(error),
            user_id: (await supabase.auth.getUser()).data.user?.id
        })
        return { error: `Erro ao gerar link: ${error.message}` }
    }

    const url = `${baseUrl}/consent/${token}`


    // 3. Send Message if requested
    if (sendWhatsApp && patientPhone) {
        const message = `Olá ${patientName}, para continuarmos seu tratamento na Access Fisioterapia, precisamos que assine o termo de consentimento LGPD: ${url}`
        const result = await sendMessage(patientPhone, message)
        if (!result.success) {
            return { url, warning: `Link gerado, mas erro no envio: ${result.error}` }
        }
        return { url, success: true }
    }

    return { url }
}

// --- LGPD DATA EXPORT ---
export async function exportPatientData(patientId: string) {
    const supabase = await createClient()

    // 1. Fetch Patient Profile
    const { data: patient, error: pError } = await supabase.from('patients').select('*').eq('id', patientId).single()
    if (pError) return { error: "Erro ao buscar dados do paciente" }

    // 2. Fetch Appointments
    const { data: appointments } = await supabase.from('appointments').select('*').eq('patient_id', patientId).order('start_time', { ascending: false })

    // 3. Fetch Clinical Records (Evolutions & Assessments)
    const { data: records } = await supabase.from('clinical_records').select('*, professionals(full_name), form_templates(title, type)').eq('patient_id', patientId).order('created_at', { ascending: false })

    // 4. Fetch Invoices
    const { data: invoices } = await supabase.from('invoices').select('*').eq('patient_id', patientId).order('created_at', { ascending: false })

    // Construct Export Object
    const exportData = {
        metadata: {
            exported_at: new Date().toISOString(),
            system: "Access Fisioterapia",
            legal_basis: "LGPD - Portability Right (Art. 18, V)"
        },
        patient_data: patient,
        history: {
            appointments: appointments || [],
            clinical_records: records || [],
            financial_records: invoices || []
        }
    }

    return { data: exportData }
}

// --- ACTIVE/INACTIVE STATUS ---
export async function togglePatientStatus(patientId: string, newStatus: 'active' | 'inactive') {
    const supabase = await createClient()

    // Direct Update - Bypass RPC/Cache
    const { error } = await supabase
        .from('patients')
        .update({ status: newStatus })
        .eq('id', patientId)

    if (error) {
        console.error('Error toggling status:', error)
        return { error: 'Erro ao alterar status do paciente.' }
    }

    revalidatePath('/dashboard/patients')
    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}
