'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getBrazilDate, getBrazilDay, getBrazilHour, getBrazilMinutes, getBrazilDateString } from "@/lib/date-utils"
import { logAction } from "@/lib/logger"
import { updateAppointmentStatus } from "@/actions/appointments"
import { FinancialService } from "@/services/financial-service"
import { sendMessage } from "@/app/dashboard/[slug]/settings/communication/actions"
import { hasPermission } from "@/lib/rbac"
import { normalizePhone } from "@/utils/format-phone"
import { getActiveOrgId, maskDataIfRequired } from "@/lib/auth-actions-utils"


export async function createPatient(formData: FormData, slug?: string) {
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

        // [SECURITY] Get User Organization upfront
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return { error: 'Usuário não autenticado' }

        const supabaseAdmin = await createAdminClient()

        // [SECURITY] Resolve Active Organization (Handles Support Mode)
        let organization_id: string;
        try {
            if (slug) {
                const activeOrg = await getActiveOrgId(slug)
                organization_id = activeOrg.orgId
            } else {
                const { data: profile } = await supabaseAdmin.from('profiles').select('organization_id').eq('id', authUser.id).single()
                const userOrgId = profile?.organization_id
                if (!userOrgId) return { error: 'Usuário sem organização vinculada.' }
                organization_id = userOrgId
            }
        } catch (e: any) {
            return { error: e.message }
        }

        if (cpf) {
            const { data: existingPatient } = await supabase.from('patients').select('id, name').eq('cpf', cpf).single()
            if (existingPatient) return { error: `Este CPF já está cadastrado para o paciente ${existingPatient.name}.` }
        }

        // [PHONE CHECK] - Warning
        const forceCreate = formData.get('_force_create') === 'true'
        if (!forceCreate && phone) {
            const normalizedPhone = normalizePhone(phone) || phone
            const { data: phoneMatches } = await supabase
                .from('patients')
                .select('id, name, cpf, phone')
                .eq('organization_id', organization_id)
                .eq('phone', normalizedPhone)
                .limit(5)

            if (phoneMatches && phoneMatches.length > 0) {
                return {
                    error: 'PATIENT_PHONE_EXISTS',
                    existingPatients: phoneMatches,
                    code: 'DUPLICATE_PHONE'
                }
            }
        }

        // [ADDRESS CHECK] - Warning
        if (!forceCreate && address && number && cep) {
            const { data: addressMatches } = await supabase
                .from('patients')
                .select('id, name, cpf, phone')
                .eq('organization_id', organization_id)
                .contains('address', { street: address, number: number, zip_code: cep })
                .limit(5)

            if (addressMatches && addressMatches.length > 0) {
                return {
                    error: 'PATIENT_ADDRESS_EXISTS',
                    existingPatients: addressMatches,
                    code: 'DUPLICATE_ADDRESS'
                }
            }
        }

        // [DUPLICATE NAME CHECK] - Warning
        if (!forceCreate && full_name) {
            const { data: nameMatches } = await supabaseAdmin
                .from('patients')
                .select('id, name, phone, cpf')
                .eq('organization_id', organization_id)
                .ilike('name', full_name.trim())
                .limit(100)
            if (nameMatches && nameMatches.length > 0) {
                return {
                    error: 'PATIENT_NAME_EXISTS',
                    existingPatients: nameMatches,
                    code: 'DUPLICATE_NAME'
                }
            }
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

        console.log("Creating patient for Org:", organization_id)

        const { data: newPatient, error } = await supabase.from('patients').insert({
            organization_id,
            name: full_name,
            cpf,
            birthdate: date_of_birth || null,
            gender,
            phone: normalizePhone(phone) || phone,
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

        revalidatePath('/dashboard/patients')

        // Log Action
        await logAction('PATIENT_CREATE', { name: full_name }, 'patient', newPatient.id, organization_id)

        return { success: true, patient: newPatient }

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
    limit = 10,
    sort = 'name',
    order = 'asc',
    slug
}: {
    letter?: string;
    query?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    slug?: string;
} = {}) {
    let supabase: any;
    let offset = 0;
    let userOrgId: string | undefined;

    try {
        supabase = await createClient()
        offset = (page - 1) * limit

        // 1. [SECURITY] Get user's organization to enforce isolation
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: [], count: 0 }

        let isSupportMode = false;
        try {
            if (slug) {
                const activeOrg = await getActiveOrgId(slug)
                userOrgId = activeOrg.orgId
                isSupportMode = activeOrg.isSupportMode
            } else {
                const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
                userOrgId = profile?.organization_id
            }
        } catch (e) {
            return { data: [], count: 0 } // Access Denied
        }

        if (!userOrgId) return { data: [], count: 0 }

        // [FIX] Using Admin Client instead of direct PC connection to avoid Pooler/Tenant errors
        const supabaseAdmin = await createAdminClient()
        let queryBuilder = supabaseAdmin
            .from('patients')
            .select('*, birthdate', { count: 'exact' })
            .eq('organization_id', userOrgId)

        if (letter) queryBuilder = queryBuilder.ilike('name', `${letter}%`)
        if (query) queryBuilder = queryBuilder.or(`name.ilike.%${query}%,cpf.ilike.%${query}%,phone.ilike.%${query}%`)

        const validSortColumns = ['name', 'created_at', 'birthdate', 'cpf']
        const sortCol = validSortColumns.includes(sort) ? sort : 'name'
        const dbSortCol = sortCol === 'date_of_birth' ? 'birthdate' : sortCol

        const { data: rows, count: totalCount, error } = await queryBuilder
            .order(dbSortCol, { ascending: order === 'asc' })
            .range(offset, offset + limit - 1)

        if (error) throw error

        // Normalize data to match expected shape
        const normalized = (rows || []).map((p: any) => ({
            ...p,
            date_of_birth: p.birthdate
        }))

        // [PRIVACY] Mask data if in support mode
        const maskedData = await maskDataIfRequired(normalized, isSupportMode)

        return { data: maskedData, count: totalCount || 0 }
    } catch (err: any) {
        console.error("ERROR in getPatients:", err)
        return { data: [], count: 0 }
    }
}

export async function quickCreatePatient(name: string, phone?: string, slug?: string) {
    const supabase = await createClient()
    if (!name || name.trim().length < 3) return { error: 'O nome deve ter pelo menos 3 algarismos.' }

    // [SECURITY] Get user's organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Usuário não autenticado' }

    let organization_id: string;
    try {
        if (slug) {
            const activeOrg = await getActiveOrgId(slug)
            organization_id = activeOrg.orgId
        } else {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            if (!profile?.organization_id) return { error: 'Organização não encontrada.' }
            organization_id = profile.organization_id
        }
    } catch (e: any) {
        return { error: e.message }
    }

    // [DUPLICATE CHECK] - Search by partial name match AND phone number
    const cleanPhone = phone?.replace(/\D/g, '') || null

    // Search by name (partial match)
    const { data: nameMatches } = await supabase
        .from('patients')
        .select('id, name, phone, cpf')
        .eq('organization_id', organization_id)
        .ilike('name', `%${name.trim()}%`)
        .limit(50)

    // Search by phone (if provided)
    let phoneMatches: any[] = []
    if (cleanPhone && cleanPhone.length >= 8) {
        const { data: phoneData } = await supabase
            .from('patients')
            .select('id, name, phone, cpf')
            .eq('organization_id', organization_id)
            .ilike('phone', `%${cleanPhone.slice(-8)}%`)
            .limit(20)
        phoneMatches = phoneData || []
    }

    // Merge and deduplicate
    const allMatches = [...(nameMatches || [])]
    phoneMatches.forEach(pm => {
        if (!allMatches.find(nm => nm.id === pm.id)) {
            allMatches.push(pm)
        }
    })

    if (allMatches.length > 0) {
        return {
            error: 'Paciente já existe.',
            existingPatient: allMatches[0],
            existingPatients: allMatches,
            code: 'DUPLICATE'
        }
    }

    const { data, error } = await supabase.from('patients').insert({
        organization_id,
        name: name.trim(),
        phone: normalizePhone(phone) || phone || null,
    }).select('id, name').single()

    if (error) {
        console.error('Error quick creating patient:', error)
        if (error.code === '23505') return { error: 'Paciente já existe.' }
        return { error: 'Erro ao criar paciente rápido.' }
    }

    await logAction('PATIENT_QUICK_CREATE', { name: name.trim() }, 'patient', data.id, organization_id)
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

export async function getPatient(id: string, slug?: string) {
    const supabase = await createClient()

    // [SECURITY] Enforce Org Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    let userOrgId: string | undefined;
    let isSupportMode = false;
    try {
        if (slug) {
            const activeOrg = await getActiveOrgId(slug)
            userOrgId = activeOrg.orgId
            isSupportMode = activeOrg.isSupportMode
        } else {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            userOrgId = profile?.organization_id
        }
    } catch (e) {
        return null
    }

    if (!userOrgId) return null

    // [FIX] Using Admin Client instead of direct PC connection to avoid Pooler/Tenant errors
    const supabaseAdmin = await createAdminClient()
    const { data: patientData, error } = await supabaseAdmin
        .from('patients')
        .select(`
            *, 
            birthdate,
            related_patient:related_patient_id(id, name)
        `)
        .eq('id', id)
        .eq('organization_id', userOrgId)
        .single()

    if (error || !patientData) return null

    // Normalize
    const data = { ...patientData, date_of_birth: patientData.birthdate }

    // [PRIVACY] Mask data if in support mode
    const finalData = await maskDataIfRequired(data, isSupportMode)

    if (finalData && finalData.address) {
        let parsed: any = null

        if (typeof finalData.address === 'object') {
            parsed = finalData.address
        } else if (typeof finalData.address === 'string' && finalData.address.trim().startsWith('{')) {
            try {
                parsed = JSON.parse(finalData.address)
            } catch (e) {
                // Ignore parse error, treat as string
            }
        }

        if (parsed) {
            (finalData as any).full_address_object = parsed // Keep original if needed
                ; (finalData as any).address = parsed.street || parsed.address || ''
                ; (finalData as any).number = parsed.number || ''
                ; (finalData as any).complement = parsed.complement || ''
                ; (finalData as any).neighborhood = parsed.neighborhood || ''
                ; (finalData as any).city = parsed.city || ''
                ; (finalData as any).state = parsed.state || ''
                ; (finalData as any).zip_code = parsed.zip_code || parsed.cep || ''
        }
    }

    // [FIX] Aggressively serialize ALL Date objects to strings
    if (finalData) {
        Object.keys(finalData).forEach(key => {
            if (finalData[key] instanceof Date) {
                finalData[key] = finalData[key].toISOString()
            }
        })
    }

    return finalData
}


export async function updatePatient(id: string, formData: FormData, slug?: string) {
    const supabase = await createClient()

    // 1. Verify User & Organization Scope (Strict Audit)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Usuário não autenticado' }

    let userOrgId: string;
    try {
        if (slug) {
            const activeOrg = await getActiveOrgId(slug)
            userOrgId = activeOrg.orgId
        } else {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            if (!profile?.organization_id) return { error: 'Organização não identificada.' }
            userOrgId = profile.organization_id
        }
    } catch (e: any) {
        return { error: e.message }
    }

    // Verify if the patient belongs to the user's organization
    const { data: patientCheck } = await supabase.from('patients').select('organization_id').eq('id', id).single()

    // Allow update if patient has NO organization (legacy) or matches user's organization
    // If patient belongs to Org A and User is Org B, DENY.
    if (patientCheck?.organization_id && patientCheck.organization_id !== userOrgId) {
        console.error(`Security Alert: User ${user.id} (Org ${userOrgId}) tried to edit Patient ${id} (Org ${patientCheck.organization_id})`)
        return { error: 'Acesso negado: Este paciente pertence a outra organização.' }
    }

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
    const related_patient_id = formData.get('related_patient_id') as string || null
    const relationship_degree = formData.get('relationship_degree') as string || null
    let price_table_id: string | null = formData.get('price_table_id') as string

    if (!price_table_id || price_table_id === 'none') price_table_id = null

    const cep = formData.get('cep') as string
    const address = formData.get('address') as string
    const number = formData.get('number') as string
    const complement = formData.get('complement') as string
    const neighborhood = formData.get('neighborhood') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string

    // Only update Address if fields are provided to avoid wiping existing JSON
    let addressStorage: any = undefined
    if (address || cep) {
        const addressData = {
            street: address, number, complement, neighborhood, city, state, zip_code: cep,
            full_text: `${address}, ${number}${complement ? ' - ' + complement : ''} - ${neighborhood}, ${city} - ${state}, ${cep}`
        }
        addressStorage = JSON.stringify(addressData)
    }

    const invoice_cpf = formData.get('invoice_cpf') as string || null
    const invoice_name = formData.get('invoice_name') as string || null
    const invoice_address_zip = formData.get('invoice_address_zip') as string || null
    const invoice_address = formData.get('invoice_address') as string || null
    const invoice_number = formData.get('invoice_number') as string || null
    const invoice_neighborhood = formData.get('invoice_neighborhood') as string || null
    const invoice_city = formData.get('invoice_city') as string || null
    const invoice_state = formData.get('invoice_state') as string || null
    const health_data_consent = formData.get('health_data_consent') === 'on'

    const forceCreate = formData.get('_force_create') === 'true'

    // [PHONE CHECK] - Warning
    if (!forceCreate && phone) {
        const normalizedPhone = normalizePhone(phone) || phone
        const { data: phoneMatch } = await supabase
            .from('patients')
            .select('id, name, cpf, phone')
            .eq('organization_id', userOrgId)
            .eq('phone', normalizedPhone)
            .neq('id', id)
            .maybeSingle()

        if (phoneMatch) {
            return {
                error: 'PATIENT_PHONE_EXISTS',
                existingPatients: [phoneMatch],
                code: 'DUPLICATE_PHONE'
            }
        }
    }

    // [ADDRESS CHECK] - Warning
    if (!forceCreate && address && number && cep) {
        const { data: addressMatches } = await supabase
            .from('patients')
            .select('id, name, cpf, phone')
            .eq('organization_id', userOrgId)
            .contains('address', { street: address, number: number, zip_code: cep })
            .neq('id', id)
            .limit(5)

        if (addressMatches && addressMatches.length > 0) {
            return {
                error: 'PATIENT_ADDRESS_EXISTS',
                existingPatients: addressMatches,
                code: 'DUPLICATE_ADDRESS'
            }
        }
    }

    const updatePayload: any = {
        name: full_name,
        cpf,
        birthdate: date_of_birth || null,
        gender,
        phone: normalizePhone(phone) || phone,
        email,
        occupation,
        marketing_source,
        price_table_id,
        related_patient_id: (related_patient_id === 'none' || !related_patient_id) ? null : related_patient_id,
        relationship_degree,
        invoice_cpf,
        invoice_name,
        invoice_address_zip,
        invoice_address,
        invoice_number,
        invoice_neighborhood,
        invoice_city,
        invoice_state,
        health_data_consent
    }

    if (addressStorage) {
        updatePayload.address = addressStorage
    }

    // Link orphan patient to organization if missing
    if (!patientCheck?.organization_id) {
        updatePayload.organization_id = userOrgId
    }

    const { error } = await supabase.from('patients').update(updatePayload).eq('id', id)

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
            id, start_time, end_time, price, status, invoice_id,
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

export async function createInvoice(patientId: string, appointmentIds: string[], total: number, paymentMethod: string, paymentDate: string, installments: number = 1, feeRate: number = 0, extraItems: any[] = [], status: 'paid' | 'pending' = 'paid', slug?: string, cardBrandId?: string | null, acquirerId?: string | null, discount: number = 0, addition: number = 0, organizationId?: string, feeFixed: number = 0) {
    const supabase = await createClient()

    // [CRITICAL FIX] Direct DB Insert to bypass Schema Cache/RLS issues
    let invoiceId: string | null = null;

    // Prepare clean values for SQL
    // Ensure paymentMethod is NULL if pending or invalid, to satisfying potential UUID constraints
    const finalPaymentMethod = (status === 'paid' && paymentMethod && paymentMethod !== 'pending') ? paymentMethod : null;
    const finalPaymentDate = (status === 'paid' && paymentDate) ? paymentDate : null;

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { error: 'Usuário não autenticado.' }

    let organization_id = organizationId; // Use passed ID if available

    if (!organization_id) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        organization_id = profile?.organization_id
    }

    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData) organization_id = orgData.id
    }

    try {
        // [FIX DEFINITIVO] Usando o Cliente Supabase em vez de SQL direto para evitar erro de Tenant.
        // O Supabase Client usa a API REST (HTTP) que é imune aos problemas de conexão do Pooler.
        const { data: result, error: insertError } = await supabase
            .from('invoices')
            .insert({
                patient_id: patientId,
                total: total,
                status: status,
                payment_method: finalPaymentMethod,
                payment_date: finalPaymentDate,
                organization_id: organization_id,
                installments: installments,
                card_brand_id: cardBrandId,
                acquirer_id: acquirerId,
                applied_fee_rate: feeRate,
                fee_fixed: feeFixed
            })
            .select('id')
            .single()

        if (insertError) throw insertError
        invoiceId = result.id
    } catch (dbErr: any) {
        console.error('Invoice Insert Error:', dbErr)
        return { error: `Erro ao criar fatura: ${dbErr.message || 'Erro desconhecido'}` }
    }

    if (!invoiceId) return { error: 'Erro crítico ao criar fatura (ID nulo).' }

    // --- SUBSEQUENT UPDATES (Using Supabase Client for convenience) ---

    // 1. Update Appointments
    let updateError = null
    if (appointmentIds.length === 1) {
        const productsTotal = extraItems.reduce((acc, item) => acc + (item.unitPrice * (item.quantity || 1)), 0)
        const newServicePrice = Math.max(0, total - productsTotal)
        const { error } = await supabase.from('appointments')
            .update({
                invoice_id: invoiceId,
                price: newServicePrice,
                discount: discount,
                addition: addition
            })
            .in('id', appointmentIds)
        updateError = error
    } else {
        const { error } = await supabase.from('appointments')
            .update({ invoice_id: invoiceId })
            .in('id', appointmentIds)
        updateError = error
    }

    // [DEPRECATED] Invoice Items table was removed. 
    // Products are handled separately or in future schema.
    // For now, only Appointments are linked to Invoices.

    // 3. Trigger Commissions
    for (const id of appointmentIds) {
        await FinancialService.calculateAndSaveCommission(supabase, id)
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard')

    await logAction('INVOICE_CREATE', { patientId, amount: total, method: paymentMethod }, 'invoice', invoiceId, organization_id)

    return { success: true }
}

export async function getProducts() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('products').select('*').eq('active', true).order('name')
    if (error) return []
    return data
}

export async function getInvoices(patientId: string, slug?: string) {
    const supabase = await createClient()

    // [SECURITY] Enforce Org Check via Profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase.from('invoices').select('*').eq('patient_id', patientId)

    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData?.id) {
            // [PRIVACY] Master BYPASS
            query = query.eq('organization_id', orgData.id)
        }
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return []
    return data
}

export async function getInvoiceItems(invoiceId: string) {
    const supabase = await createClient()

    // Fallback to fetch appointments linked to the invoice since invoice_items is gone
    const { data: appts, error } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .eq('invoice_id', invoiceId)

    if (error) return []

    return appts.map((appt: any) => ({
        id: appt.id,
        description: 'Atendimento' + (appt.services?.name ? ` - ${appt.services.name}` : ''),
        unit_price: appt.price || 0,
        total_price: appt.price || 0,
        quantity: 1
    }))
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
    const host = headers().get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'http://localhost:3000')

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

/**
 * Unifica dois perfis de pacientes.
 * targetId (Paciente A) é o vencedor que manterá todos os registros.
 * sourceId (Paciente B) será removido após a transferência dos dados.
 */
export async function mergePatients(targetId: string, sourceId: string) {
    const supabase = await createAdminClient()
    const { data: { user: authUser } } = await (await createClient()).auth.getUser()
    if (!authUser) return { error: 'Não autorizado' }

    try {
        // log progress or start transaction if supported, but here we do sequential updates

        // 1. Mover Agendamentos
        await supabase.from('appointments').update({ patient_id: targetId }).eq('patient_id', sourceId)

        // 2. Mover Registros (Evoluções, Avaliações)
        await supabase.from('patient_records').update({ patient_id: targetId }).eq('patient_id', sourceId)

        // 3. Mover Avaliações Legado (se existirem)
        await supabase.from('patient_assessments').update({ patient_id: targetId }).eq('patient_id', sourceId)

        // 4. Mover Faturas (Invoices)
        await supabase.from('invoices').update({ patient_id: targetId }).eq('patient_id', sourceId)

        // 5. Mover Documentos (se existirem)
        await supabase.from('patient_documents').update({ patient_id: targetId }).eq('patient_id', sourceId)

        // 5. Deletar Paciente B (Duplicata)
        const { error: deleteError } = await supabase.from('patients').delete().eq('id', sourceId)
        if (deleteError) {
            console.error("Delete Error in Merge:", deleteError);
            return { error: 'Não foi possível remover a ficha duplicada após mover os dados.' }
        }

        revalidatePath('/dashboard/patients')

        await logAction('PATIENT_MERGE', { targetId, sourceId }, 'patient', targetId)

        return { success: true }
    } catch (err: any) {
        console.error("Merge error:", err)
        return { error: 'Falha ao unificar pacientes: ' + err.message }
    }
}

/**
 * Marca parentesco entre dois pacientes (relação mútua).
 */
export async function markKinship(patientA_id: string, patientB_id: string, degree: string = 'Familiar') {
    const supabase = await createClient()
    try {
        // Atualiza Paciente A apontando para B
        await supabase.from('patients').update({
            related_patient_id: patientB_id,
            relationship_degree: degree
        }).eq('id', patientA_id)

        // Atualiza Paciente B apontando para A
        await supabase.from('patients').update({
            related_patient_id: patientA_id,
            relationship_degree: degree
        }).eq('id', patientB_id)

        await logAction('PATIENT_KINSHIP', { patientA_id, patientB_id, degree }, 'patient', patientA_id)

        revalidatePath('/dashboard/patients')
        return { success: true }
    } catch (err: any) {
        console.error("Kinship error:", err)
        return { error: 'Erro ao marcar parentesco.' }
    }
}
export async function updateRecordContent(recordId: string, content: any) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('patient_records')
        .update({
            content,
            updated_at: new Date().toISOString()
        })
        .eq('id', recordId)

    if (error) {
        console.error("Error updating record content:", error)
        return { success: false, message: 'Erro ao salvar alterações.' }
    }

    return { success: true }
}
