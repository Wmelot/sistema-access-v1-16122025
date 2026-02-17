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
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'
    value: number
    dueDate: string
    description?: string
    externalReference?: string
}

export async function createAsaasCustomer(data: AsaasCustomer, apiKey?: string) {
    const key = apiKey || ASAAS_API_KEY
    if (!key) throw new Error("Asaas API Key not configured")

    const res = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': key
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create Asaas customer')
    return json
}

export async function createAsaasPayment(data: AsaasPayment, apiKey?: string) {
    const key = apiKey || ASAAS_API_KEY
    if (!key) throw new Error("Asaas API Key not configured")

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': key
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create Asaas payment')
    return json
}

export async function getPixQrCode(paymentId: string, apiKey?: string) {
    const key = apiKey || ASAAS_API_KEY
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: {
            'access_token': key
        }
    })
    return await res.json()
}

/**
 * [FIX DEFINITIVO] BUSCA DE PACIENTE SEM ERRO DE TENANT
 * Usamos o Supabase Admin Client (Protocolo HTTP/REST).
 * Este método É IMUNE ao erro "Tenant or user not found" do Pooler.
 * [NEW] Agora também busca a chave de API específica da organização se existir.
 */
export async function getOrCreateAsaasCustomer(id: string) {
    console.log(`[ASAAS] Buscando paciente/perfil via Admin Client: ${id}`);

    const supabase = await createAdminClient();

    // 1. Tenta buscar em Pacientes
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, name, email, cpf, asaas_customer_id, organization_id')
        .eq('id', id)
        .maybeSingle();

    let organizationId = patient?.organization_id;
    let targetPatient = patient;

    // 2. Tenta buscar em Perfis (Fallback) se não for paciente
    if (!patient) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email, cpf, asaas_customer_id, organization_id')
            .eq('id', id)
            .maybeSingle();

        if (profile) {
            organizationId = profile.organization_id;
            targetPatient = {
                id: profile.id,
                name: profile.full_name,
                email: profile.email,
                cpf: profile.cpf,
                asaas_customer_id: profile.asaas_customer_id,
                organization_id: profile.organization_id
            } as any;
        }
    }

    if (!targetPatient) {
        throw new Error(`Dados cadastrais não localizados para o ID: ${id}. Verifique se o cadastro existe.`);
    }

    // [NEW] Buscar Chave de API da Organização
    let customApiKey: string | undefined;
    if (organizationId) {
        const { data: integration } = await supabase
            .from('api_integrations')
            .select('config')
            .eq('organization_id', organizationId)
            .eq('provider', 'asaas')
            .eq('is_active', true)
            .maybeSingle();

        if (integration && (integration.config as any)?.api_key) {
            customApiKey = (integration.config as any).api_key;
            console.log(`[ASAAS] Usando chave customizada para org: ${organizationId}`);
        }
    }

    if (targetPatient.asaas_customer_id) return {
        customerId: targetPatient.asaas_customer_id,
        apiKey: customApiKey
    };

    const rawCpf = targetPatient.cpf ? targetPatient.cpf.replace(/\D/g, '') : '';
    if (!rawCpf) throw new Error(`O paciente ${targetPatient.name} está sem CPF no cadastro.`);

    const customer = await createAsaasCustomer({
        name: targetPatient.name,
        cpfCnpj: rawCpf,
        email: targetPatient.email || '',
        externalReference: targetPatient.id
    }, customApiKey);

    if (customer.id) {
        // Update the correct table
        const table = (targetPatient as any).full_name ? 'profiles' : 'patients';
        await supabase.from(table).update({ asaas_customer_id: customer.id }).eq('id', targetPatient.id);

        return {
            customerId: customer.id,
            apiKey: customApiKey
        };
    }

    throw new Error(`Falha ao criar cliente no Asaas para: ${targetPatient.name}`);
}

export async function createAsaasInvoice(paymentId: string, apiKey?: string) {
    const key = apiKey || ASAAS_API_KEY
    if (!key) throw new Error("Asaas API Key not configured")

    // Nota Fiscal de Serviço (NFS-e) logic
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/invoices`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': key
        },
        body: JSON.stringify({
            // Default configuration for service invoices
            // Usually requires previously configured municipal settings in Asaas dashboard
            effectiveDate: new Date().toISOString().split('T')[0]
        })
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Erro ao emitir nota fiscal no Asaas')
    return json
}
