import { createClient } from "@/lib/supabase/server"

// Chave reserva caso a variável de ambiente não esteja no painel da Vercel
const FALLBACK_ASAAS_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmN2NkMTg0LTc2MGYtNDRhOS04MGZiLTAxYjRlMGM2OGUyMjo6JGFhY2hfYjI0ZTM2YWUtMzFmNi00MDYwLWE2NzItNTdhNGYxNGYxZTc3'
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'

function getAsaasKey() {
    const key = process.env.ASAAS_API_KEY || FALLBACK_ASAAS_KEY;
    return key;
}

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
    const key = getAsaasKey();
    const res = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': key
        },
        body: JSON.stringify(data)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create customer')
    return json
}

export async function createAsaasPayment(data: AsaasPayment) {
    const key = getAsaasKey();
    const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': key
        },
        body: JSON.stringify(data)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to create payment')
    return json
}

export async function getPixQrCode(paymentId: string) {
    const key = getAsaasKey();
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: { 'access_token': key }
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to get Pix QRCode')
    return json
}

export async function getOrCreateAsaasCustomer(id: string) {
    const { db } = await import("@/lib/db")
    const { createAdminClient } = await import("@/lib/supabase/server")

    let data: any = null;
    try {
        const { rows } = await db.query('SELECT id, name, email, cpf, asaas_customer_id FROM patients WHERE id = $1', [id])
        if (rows.length > 0) data = rows[0];
    } catch (e) { }

    if (!data) {
        try {
            const { rows } = await db.query('SELECT id, full_name as name, email, cpf, asaas_customer_id FROM profiles WHERE id = $1', [id])
            if (rows.length > 0) data = rows[0];
        } catch (e) { }
    }

    if (!data) {
        const supabase = await createAdminClient();
        const { data: p } = await supabase.from('patients').select('*').eq('id', id).maybeSingle();
        if (p) data = p;
        else {
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
            if (prof) data = { ...prof, name: prof.full_name };
        }
    }

    if (!data) throw new Error(`Paciente/Perfil não encontrado (ID: ${id})`);
    if (data.asaas_customer_id) return data.asaas_customer_id;

    const rawCpf = data.cpf ? data.cpf.replace(/\D/g, '') : '';
    if (!rawCpf) throw new Error("Paciente encontrado, mas sem CPF cadastrado.");

    const customer = await createAsaasCustomer({
        name: data.name,
        cpfCnpj: rawCpf,
        email: data.email || '',
        externalReference: data.id
    });

    if (customer.id) {
        await db.query('UPDATE patients SET asaas_customer_id = $1 WHERE id = $2', [customer.id, data.id]).catch(() => { });
        await db.query('UPDATE profiles SET asaas_customer_id = $1 WHERE id = $2', [customer.id, data.id]).catch(() => { });
        return customer.id;
    }

    throw new Error("Erro ao criar cliente no Asaas.");
}
