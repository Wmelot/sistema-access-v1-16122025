import { createClient } from "@/lib/supabase/server"

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

if (!ASAAS_API_KEY) {
    console.warn("⚠️ ASAAS_API_KEY is missing. Asaas integration will fail.")
}

interface AsaasCustomer {
    name: string
    cpfCnpj: string
    email?: string
    mobilePhone?: string
    externalReference?: string
}

interface AsaasPayment {
    customer: string // Customer ID
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
    value: number
    dueDate: string
    description?: string
    externalReference?: string
}

export async function createAsaasCustomer(data: AsaasCustomer) {
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY not configured")

    const res = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create customer')
    return json
}

export async function createAsaasPayment(data: AsaasPayment) {
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY not configured")

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create payment')
    return json
}

export async function getPixQrCode(paymentId: string) {
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY not configured")

    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: {
            'access_token': ASAAS_API_KEY
        }
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to get Pix QRCode')
    return json
}

// Helper to check if a customer exists by email or CPF, if not create
export async function getOrCreateAsaasCustomer(id: string) {
    const { createAdminClient } = await import("@/lib/supabase/server")
    const supabase = await createAdminClient()

    // 1. Check if it's a PROFILE (for commissions or other things)
    const { data: profile } = await supabase.from('profiles')
        .select('id, full_name, email, cpf, asaas_customer_id')
        .eq('id', id)
        .maybeSingle()

    if (profile) {
        if (profile.asaas_customer_id) return profile.asaas_customer_id

        const rawCpf = profile.cpf ? profile.cpf.replace(/\D/g, '') : ''
        const asaasCustomer = await createAsaasCustomer({
            name: profile.full_name,
            cpfCnpj: rawCpf,
            email: profile.email,
            externalReference: profile.id
        })

        if (asaasCustomer.id) {
            await supabase.from('profiles').update({ asaas_customer_id: asaasCustomer.id }).eq('id', profile.id)
            return asaasCustomer.id
        }
    }

    // 2. Check if it's a PATIENT
    const { data: patient } = await supabase.from('patients').select('id, name, email, cpf, asaas_customer_id').eq('id', id).maybeSingle()

    if (patient) {
        if (patient.asaas_customer_id) return patient.asaas_customer_id

        const rawCpf = patient.cpf ? patient.cpf.replace(/\D/g, '') : ''
        const asaasCustomer = await createAsaasCustomer({
            name: patient.name,
            cpfCnpj: rawCpf,
            email: patient.email || '',
            externalReference: patient.id
        })

        if (asaasCustomer.id) {
            await supabase.from('patients').update({ asaas_customer_id: asaasCustomer.id }).eq('id', patient.id)
            return asaasCustomer.id
        }
    }

    throw new Error("Paciente ou Perfil não encontrado no banco de dados para integração Asaas")
}
