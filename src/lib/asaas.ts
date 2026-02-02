import { createAdminClient } from "@/lib/supabase/admin"

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
// Fallback key for emergency use
const FALLBACK_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmN2NkMTg0LTc2MGYtNDRhOS04MGZiLTAxYjRlMGM2OGUyMjo6JGFhY2hfYjI0ZTM2YWUtMzFmNi00MDYwLWE2NzItNTdhNGYxNGYxZTc3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || FALLBACK_KEY

interface AsaasCustomer {
    name: string
    cpfCnpj: string
    email?: string
    mobilePhone?: string
    externalReference?: string
}

interface AsaasPayment {
    customer: string
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
    value: number
    dueDate: string
    description?: string
    externalReference?: string
}

export async function createAsaasCustomer(data: AsaasCustomer) {
    if (!ASAAS_API_KEY) throw new Error("Asaas API Key not configured")

    const res = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create Asaas customer')
    return json
}

export async function createAsaasPayment(data: AsaasPayment) {
    if (!ASAAS_API_KEY) throw new Error("Asaas API Key not configured")

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create Asaas payment')
    return json
}

export async function getPixQrCode(paymentId: string) {
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: {
            'access_token': ASAAS_API_KEY
        }
    })
    return await res.json()
}

/**
 * [FIX DEFINITIVO] BUSCA DE PACIENTE SEM ERRO DE TENANT
 * Usamos o Supabase Admin Client (Protocolo HTTP/REST).
 * Este método É IMUNE ao erro "Tenant or user not found" do Pooler.
 */
export async function getOrCreateAsaasCustomer(id: string) {
    console.log(`[ASAAS] Buscando paciente/perfil via Admin Client: ${id}`);

    const supabase = await createAdminClient();

    // 1. Tenta buscar em Pacientes
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, name, email, cpf, asaas_customer_id')
        .eq('id', id)
        .maybeSingle();

    console.log(`[ASAAS] Resultado busca Paciente (${id}):`, patient, patientError);

    if (patient) {
        if (patient.asaas_customer_id) return patient.asaas_customer_id;

        const rawCpf = patient.cpf ? patient.cpf.replace(/\D/g, '') : '';
        if (!rawCpf) throw new Error(`O paciente ${patient.name} está sem CPF no cadastro.`);

        const customer = await createAsaasCustomer({
            name: patient.name,
            cpfCnpj: rawCpf,
            email: patient.email || '',
            externalReference: patient.id
        });

        if (customer.id) {
            await supabase.from('patients').update({ asaas_customer_id: customer.id }).eq('id', patient.id);
            return customer.id;
        }
    }

    // 2. Tenta buscar em Perfis (Fallback)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, cpf, asaas_customer_id')
        .eq('id', id)
        .maybeSingle();

    console.log(`[ASAAS] Resultado busca Perfil (${id}):`, profile, profileError);

    if (profile) {
        if (profile.asaas_customer_id) return profile.asaas_customer_id;

        const rawCpf = profile.cpf ? profile.cpf.replace(/\D/g, '') : '';
        if (!rawCpf) throw new Error(`O perfil ${profile.full_name} está sem CPF.`);

        const customer = await createAsaasCustomer({
            name: profile.full_name,
            cpfCnpj: rawCpf,
            email: profile.email || '',
            externalReference: profile.id
        });

        if (customer.id) {
            await supabase.from('profiles').update({ asaas_customer_id: customer.id }).eq('id', profile.id);
            return customer.id;
        }
    }

    throw new Error(`Dados cadastrais não localizados para o ID: ${id}. Verifique se o cadastro existe.`);
}
