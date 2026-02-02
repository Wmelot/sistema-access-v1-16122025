import { db } from "@/lib/db"
import { createAdminClient } from "@/lib/supabase/server"

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
// Pegamos a chave do env ou do fallback
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmN2NkMTg0LTc2MGYtNDRhOS04MGZiLTAxYjRlMGM2OGUyMjo6JGFhY2hfYjI0ZTM2YWUtMzFmNi00MDYwLWE2NzItNTdhNGYxNGYxZTc3'

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
    if (!ASAAS_API_KEY) throw new Error("Asaas API Key não configurada.")

    const res = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Erro ao criar cliente no Asaas')
    return json
}

export async function createAsaasPayment(data: AsaasPayment) {
    if (!ASAAS_API_KEY) throw new Error("Asaas API Key não configurada.")

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas')
    return json
}

export async function getPixQrCode(paymentId: string) {
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: { 'access_token': ASAAS_API_KEY }
    })
    const json = await res.json()
    return json
}

/**
 * [FIX DEFINITIVO] BUSCA DE PACIENTE PARA ASAAS
 * Não falha. Busca por SQL direto (ignora RLS) e faz fallback no Admin Client.
 */
export async function getOrCreateAsaasCustomer(id: string) {
    console.log(`[ASAAS] Buscando dados para: ${id}`);

    let patientData: any = null;

    // 1. TENTA SQL DIRETO (REFORÇADO)
    try {
        const { rows } = await db.query(`
            SELECT id, name, email, cpf, asaas_customer_id 
            FROM patients 
            WHERE id = $1
        `, [id]);

        if (rows && rows.length > 0) {
            patientData = rows[0];
            console.log('[ASAAS] Paciente localizado via SQL Direto.');
        }
    } catch (e: any) {
        console.error('[ASAAS] Erro na query SQL:', e.message);
    }

    // 2. FALLBACK: PERFIS (Para profissionais)
    if (!patientData) {
        try {
            const { rows: profiles } = await db.query(`
                SELECT id, full_name as name, email, cpf, asaas_customer_id 
                FROM profiles 
                WHERE id = $1
            `, [id]);
            if (profiles && profiles.length > 0) {
                patientData = profiles[0];
                console.log('[ASAAS] Localizado em Perfis via SQL.');
            }
        } catch (e) { }
    }

    // 3. FALLBACK FINAL: ADMIN CLIENT (CRITICAL RESERVE)
    if (!patientData) {
        console.log('[ASAAS] Tentando Admin Client como última reserva...');
        const admin = await createAdminClient();
        const { data: p } = await admin.from('patients').select('*').eq('id', id).maybeSingle();
        if (p) {
            patientData = p;
        } else {
            const { data: prof } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
            if (prof) patientData = { ...prof, name: prof.full_name };
        }
    }

    if (!patientData) {
        throw new Error(`Paciente com ID ${id.substring(0, 8)}... não encontrado. Verifique se ele existe no sistema.`);
    }

    // Se já tem ID do Asaas, retorna
    if (patientData.asaas_customer_id) return patientData.asaas_customer_id;

    // Se não tem CPF, para aqui com erro claro
    const rawCpf = patientData.cpf ? patientData.cpf.replace(/\D/g, '') : '';
    if (!rawCpf) {
        throw new Error(`Paciente ${patientData.name} está sem CPF. O Asaas exige CPF para gerar cobrança.`);
    }

    // Cria no Asaas
    console.log('[ASAAS] Criando novo cliente no Asaas...');
    const customer = await createAsaasCustomer({
        name: patientData.name,
        cpfCnpj: rawCpf,
        email: patientData.email || '',
        externalReference: patientData.id
    });

    if (customer.id) {
        // Atualiza o banco (Silencioso se falhar, mas tenta registrar)
        await db.query('UPDATE patients SET asaas_customer_id = $1 WHERE id = $2', [customer.id, patientData.id]).catch(() => { });
        await db.query('UPDATE profiles SET asaas_customer_id = $1 WHERE id = $2', [customer.id, patientData.id]).catch(() => { });
        return customer.id;
    }

    throw new Error('Não foi possível registrar o cliente no Asaas.');
}
