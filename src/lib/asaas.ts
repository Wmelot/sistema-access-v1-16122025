import { createClient } from "@/lib/supabase/server"

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

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
        headers: { 'access_token': ASAAS_API_KEY }
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Failed to get Pix QRCode')
    return json
}

export async function getOrCreateAsaasCustomer(id: string) {
    const { db } = await import("@/lib/db")
    const { createAdminClient } = await import("@/lib/supabase/server")

    // Tenta primeiro na tabela de PACIENTES
    let data: any = null;

    try {
        const { rows } = await db.query('SELECT id, name, email, cpf, asaas_customer_id FROM patients WHERE id = $1', [id])
        if (rows.length > 0) data = rows[0];
    } catch (e) { }

    // Se não achou, tenta na tabela de PERFIS (Profissionais)
    if (!data) {
        try {
            const { rows } = await db.query('SELECT id, full_name as name, email, cpf, asaas_customer_id FROM profiles WHERE id = $1', [id])
            if (rows.length > 0) data = rows[0];
        } catch (e) { }
    }

    // Fallback final via Supabase Admin (para garantir)
    if (!data) {
        const supabase = await createAdminClient();
        const { data: p } = await supabase.from('patients').select('*').eq('id', id).maybeSingle();
        if (p) data = p;
        else {
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
            if (prof) data = { ...prof, name: prof.full_name };
        }
    }

    if (!data) {
        throw new Error(`Paciente/Perfil não encontrado (ID: ${id}). Verifique se o cadastro existe no sistema.`);
    }

    if (data.asaas_customer_id) return data.asaas_customer_id;

    const rawCpf = data.cpf ? data.cpf.replace(/\D/g, '') : '';
    // Aqui está o ponto da Foto 2: se não tem CPF, o Asaas não aceita
    if (!rawCpf) {
        throw new Error("Paciente encontrado, mas sem CPF cadastrado. Acesse o cadastro do paciente e preencha o CPF para gerar cobranças.");
    }

    const customer = await createAsaasCustomer({
        name: data.name,
        cpfCnpj: rawCpf,
        email: data.email || '',
        externalReference: data.id
    });

    if (customer.id) {
        // Atualiza em ambas as tabelas para garantir
        await db.query('UPDATE patients SET asaas_customer_id = $1 WHERE id = $2', [customer.id, data.id]).catch(() => { });
        await db.query('UPDATE profiles SET asaas_customer_id = $1 WHERE id = $2', [customer.id, data.id]).catch(() => { });
        return customer.id;
    }

    throw new Error("Erro ao criar cliente no Asaas.");
}
