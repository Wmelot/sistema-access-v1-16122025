'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { calculateAndSaveCommission, updateAppointmentStatus } from "@/actions/appointments"
import { sendMessage } from "@/app/dashboard/settings/communication/actions"
import { hasPermission } from "@/lib/rbac"

export async function createPatient(formData: FormData) {
    try {
        const supabase = await createClient()

        const full_name = formData.get('full_name') as string
        let cpf: string | null = formData.get('cpf') as string
        if (!cpf || cpf.length === 0) cpf = null
        let date_of_birth = formData.get('date_of_birth') as string

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

        if (cpf) {
            const { data: existingPatient } = await supabase.from('patients').select('id').eq('cpf', cpf).single()
            if (existingPatient) return { error: 'Este CPF já está cadastrado para outro paciente.' }
        }

        const occupation = formData.get('occupation') as string || null
        const marketing_source = formData.get('marketing_source') as string || null
        let related_patient_id: string | null = formData.get('related_patient_id') as string
        const relationship_degree = formData.get('relationship_degree') as string || null
        let price_table_id: string | null = formData.get('price_table_id') as string

        if (!related_patient_id || related_patient_id === 'none') related_patient_id = null
        if (!price_table_id || price_table_id === 'none') price_table_id = null

        const invoice_cpf = formData.get('invoice_cpf') as string || null
        const invoice_name = formData.get('invoice_name') as string || null
        const invoice_address_zip = formData.get('invoice_address_zip') as string || null
        const invoice_address = formData.get('invoice_address') as string || null
        const invoice_number = formData.get('invoice_number') as string || null
        const invoice_neighborhood = formData.get('invoice_neighborhood') as string || null
        const invoice_city = formData.get('invoice_city') as string || null
        const invoice_state = formData.get('invoice_state') as string || null
        const health_data_consent = formData.get('health_data_consent') === 'on'

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Usuário não autenticado' }

        // Use Admin Client to bypass RLS on profiles (avoid recursion risk)
        const supabaseAdmin = await createAdminClient()
        const { data: profile } = await supabaseAdmin.from('profiles').select('organization_id').eq('id', user.id).single()

        const organization_id = profile?.organization_id

        if (!organization_id) {
            console.error("Critical: User has no organization_id", user.id)
            return { error: 'Erro crítico: Perfil de usuário sem organização vinculada.' }
        }

        console.log("Creating patient for Org:", organization_id)

        const { data: newPatient, error } = await supabase.from('patients').insert({
            organization_id,
            name: full_name,
            cpf,
            birthdate: date_of_birth || null,
            gender,
            phone,
            email,
            address: addressData, // Pass object directly for JSONB normalization
            occupation,
            marketing_source,
            related_patient_id,
            relationship_degree,
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
        }).select('id').single()

        if (error) {
            console.error('Error creating patient:', error)
            if (error.code === '23505') return { error: 'Este CPF já está cadastrado.' }
            // Return detailed error for debugging
            return { error: `Erro banco: ${error.message || JSON.stringify(error)} (Code: ${error.code})` }
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

// ... (previous code)

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

        if (sort && ['name', 'cpf', 'email', 'phone', 'created_at'].includes(sort)) {
            dbQuery = dbQuery.order(sort, { ascending: order === 'asc' })
        } else {
            dbQuery = dbQuery.order('name', { ascending: true })
        }

        if (letter) dbQuery = dbQuery.ilike('name', `${letter}%`)
        if (query) dbQuery = dbQuery.ilike('name', `%${query}%`)

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
    if (!name || name.trim().length < 3) return { error: 'O nome deve ter pelo menos 3 algarismos.' }

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
    const canDelete = await hasPermission('system.view_logs')
    if (!canDelete) return { error: 'Permissão negada. Apenas Master pode realizar esta ação.' }

    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })
            if (signInError) return { error: 'Senha incorreta' }
        } else {
            return { error: 'Usuário não autenticado' }
        }
    } else {
        return { error: 'Senha necessária para deletar' }
    }

    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) return { error: 'Erro ao excluir paciente. Verifique se existem consultas vinculadas.' }

    await logAction("DELETE_PATIENT", { id }, 'patient', id)
    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function getPatient(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()

    if (error) return null

    if (data && data.address) {
        let parsed: any = null

        if (typeof data.address === 'object') {
            parsed = data.address
        } else if (typeof data.address === 'string' && data.address.trim().startsWith('{')) {
            try {
                parsed = JSON.parse(data.address)
            } catch (e) {
                // Ignore parse error, treat as string
            }
        }

        if (parsed) {
            data.full_address_object = parsed // Keep original if needed
            data.address = parsed.street || parsed.address || ''
            data.number = parsed.number || ''
            data.complement = parsed.complement || ''
            data.neighborhood = parsed.neighborhood || ''
            data.city = parsed.city || ''
            data.state = parsed.state || ''
            data.zip_code = parsed.zip_code || parsed.cep || ''
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

    if (!price_table_id || price_table_id === 'none') price_table_id = null

    const cep = formData.get('cep') as string
    const address = formData.get('address') as string
    const number = formData.get('number') as string
    const complement = formData.get('complement') as string
    const neighborhood = formData.get('neighborhood') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string

    const fullAddress = `${address}, ${number}${complement ? ' - ' + complement : ''} - ${neighborhood}, ${city} - ${state}, ${cep}`

    const addressData = {
        street: address, number, complement, neighborhood, city, state, zip_code: cep
    }
    const addressStorage = JSON.stringify(addressData)

    const invoice_cpf = formData.get('invoice_cpf') as string || null
    const invoice_name = formData.get('invoice_name') as string || null
    const invoice_address_zip = formData.get('invoice_address_zip') as string || null
    const invoice_address = formData.get('invoice_address') as string || null
    const invoice_number = formData.get('invoice_number') as string || null
    const invoice_neighborhood = formData.get('invoice_neighborhood') as string || null
    const invoice_city = formData.get('invoice_city') as string || null
    const invoice_state = formData.get('invoice_state') as string || null
    const health_data_consent = formData.get('health_data_consent') === 'on'

    const { error } = await supabase.from('patients').update({
        name: full_name,
        cpf,
        date_of_birth: date_of_birth || null,
        gender,
        phone,
        email,
        address: addressStorage,
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
        if (error.code === '23505') return { error: 'CPF duplicado.' }
        return { error: 'Erro ao atualizar paciente.' }
    }

    await logAction("UPDATE_PATIENT", { id, name: full_name }, 'patient', id)
    revalidatePath(`/dashboard/patients/${id}`)
    revalidatePath('/dashboard/patients')
}

// ... (previous code)

// --- FINANCIAL / BILLING ---

export async function getUnbilledAppointments(patientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id, start_time, end_time, price, status,
            service_id, services (name),
            professional_id, profiles (full_name)
        `)
        .eq('patient_id', patientId)
        .is('invoice_id', null)
        .neq('status', 'cancelled')
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

    const { data: appointmentsRaw } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .in('id', appointmentIds)

    const alreadyBilled = appointmentsRaw?.find(a => a.invoice_id !== null)
    if (alreadyBilled) return { error: 'Atenção: Já existe uma fatura gerada para este atendimento.' }

    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
            patient_id: patientId, total, status,
            payment_method: paymentMethod, payment_date: paymentDate,
            installments, applied_fee_rate: feeRate, net_total: netTotal
        })
        .select()
        .single()

    if (invoiceError) return { error: 'Erro ao criar fatura.' }

    let updateError = null
    if (appointmentIds.length === 1) {
        const productsTotal = extraItems.reduce((acc, item) => acc + (item.unitPrice * (item.quantity || 1)), 0)
        const newServicePrice = Math.max(0, total - productsTotal)
        const { error } = await supabase.from('appointments')
            .update({ invoice_id: invoice.id, price: newServicePrice })
            .in('id', appointmentIds)
        updateError = error
    } else {
        const { error } = await supabase.from('appointments')
            .update({ invoice_id: invoice.id })
            .in('id', appointmentIds)
        updateError = error
    }

    if (updateError) return { error: 'Erro ao vincular agendamentos.' }

    const itemsToInsert: any[] = appointmentIds.map(id => ({
        invoice_id: invoice.id,
        appointment_id: id,
        description: 'Atendimento' + (appointmentsRaw?.find(a => a.id === id)?.services?.name ? ` - ${appointmentsRaw.find(a => a.id === id).services.name}` : ''),
        unit_price: appointmentsRaw?.find(a => a.id === id)?.price || 0,
        cost_price: 0,
        total_price: appointmentsRaw?.find(a => a.id === id)?.price || 0,
        quantity: 1,
        product_id: null
    }))

    if (extraItems && extraItems.length > 0) {
        extraItems.forEach((item: any) => {
            itemsToInsert.push({
                invoice_id: invoice.id,
                appointment_id: null,
                description: item.name,
                cost_price: item.costPrice || 0,
                total_price: item.unitPrice * item.quantity,
                quantity: item.quantity,
                product_id: item.productId
            } as any)
        })
    }

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert.map(item => ({
        invoice_id: item.invoice_id,
        appointment_id: item.appointment_id,
        description: item.description,
        unit_price: item.unit_price,
        cost_price: item.cost_price,
        total_price: item.total_price,
        quantity: item.quantity,
        product_id: item.product_id
    })))

    if (itemsError) console.error('Error creating items:', itemsError)

    const { data: appointments } = await supabase.from('appointments').select('*').in('id', appointmentIds)
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
    const { data, error } = await supabase.from('products').select('*').eq('active', true).order('name')
    if (error) return []
    return data
}

export async function getInvoices(patientId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('invoices').select('*').eq('patient_id', patientId).order('created_at', { ascending: false })
    if (error) return []
    return data
}

export async function getInvoiceItems(invoiceId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: true })
    if (error) return []
    return data
}

// --- RECORDS ---

export async function finalizeRecord(recordId: string, content?: any) {
    const supabase = await createClient()
    const updates: any = { status: 'finalized', updated_at: new Date().toISOString() }
    if (content) updates.content = content

    const { error } = await supabase.from('patient_records').update(updates).eq('id', recordId)

    if (error) return { success: false, message: 'Erro ao finalizar.' }
    await logAction("FINALIZE_RECORD", { recordId }, 'patient_record', recordId)

    const { data: record } = await supabase.from('patient_records').select('appointment_id').eq('id', recordId).single()
    if (record && record.appointment_id) {
        await updateAppointmentStatus(record.appointment_id, 'completed')
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function deleteRecord(recordId: string, password?: string) {
    const supabase = await createClient()

    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error } = await supabase.auth.signInWithPassword({ email: user.email, password })
            if (error) return { success: false, message: 'Senha incorreta.' }
        }
    } else {
        return { success: false, message: 'Senha necessária.' }
    }

    const { error } = await supabase.from('patient_records').delete().eq('id', recordId)
    if (error) return { success: false, message: 'Erro ao excluir.' }

    await logAction("DELETE_RECORD", { recordId }, 'patient_record', recordId)
    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function searchCep(cep: string) {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return { error: 'CEP inválido' }

    try {
        const r1 = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, { signal: AbortSignal.timeout(5000) })
        if (r1.ok) {
            const d1 = await r1.json()
            if (!d1.erro) return { data: d1 }
        }
    } catch (e) { }

    try {
        const r2 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, { signal: AbortSignal.timeout(5000) })
        if (!r2.ok) throw new Error('Fail')
        const d2 = await r2.json()
        return { data: { logradouro: d2.street, bairro: d2.neighborhood, localidade: d2.city, uf: d2.state } }
    } catch (e) {
        return { error: 'CEP não encontrado.' }
    }
}

export async function updateInvoiceStatus(invoiceId: string, status: 'paid' | 'pending', paymentMethod?: string, paymentDate?: string, installments?: number) {
    const supabase = await createClient()
    const updates: any = { status }
    if (paymentMethod) updates.payment_method = paymentMethod
    if (paymentDate) updates.payment_date = paymentDate
    if (installments) updates.installments = installments

    await supabase.from('invoices').update(updates).eq('id', invoiceId)
    revalidatePath('/dashboard')
    return { success: true }
}

export async function generateConsentToken(patientId: string, sendWhatsApp: boolean = false) {
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let patientPhone = null
    let patientName = 'Paciente'
    if (sendWhatsApp) {
        const { data: p } = await supabase.from('patients').select('phone, name').eq('id', patientId).single()
        if (!p?.phone) return { error: 'Paciente sem telefone.' }
        patientPhone = p.phone
        patientName = p.name.split(' ')[0]
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error } = await supabase.from('consent_tokens').insert({
        patient_id: patientId, token, expires_at: expiresAt.toISOString()
    })

    if (error) return { error: 'Erro ao gerar link.' }
    const url = `${baseUrl}/consent/${token}`

    if (sendWhatsApp && patientPhone) {
        const message = `Olá ${patientName}, assine o termo LGPD: ${url}`
        const result = await sendMessage(patientPhone, message)
        if (!result.success) return { url, warning: 'Erro no envio WhatsApp.' }
        return { url, success: true }
    }

    // ... (previous code)

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
    // Note: 'clinical_records' seems to be a view or previous table name? Detailed check might be needed if it fails.
    // But copying as is.
    const { data: records } = await supabase.from('patient_records').select('*, profiles(full_name), form_templates(title, type)').eq('patient_id', patientId).order('created_at', { ascending: false })

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



