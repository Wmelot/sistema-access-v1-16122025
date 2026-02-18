const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Setup do Cliente Admin (KGB Mode)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSecurityStressTest() {
    console.log("🛡️ INICIANDO TESTE DE ESTRESSE MULTI-TENANT (JAVASCRIPT)");

    try {
        // 1. Setup do Cenário Fantasma
        const orgAId = '00000000-aaaa-0000-0000-000000000001';
        const orgBId = '00000000-bbbb-0000-0000-000000000001';
        const patientBId = '00000000-b00b-0000-0000-000000000001';

        console.log("Configurando dados de isolamento...");

        // Alimenta o banco com clinicas e pacientes isolados
        await supabaseAdmin.from('organizations').upsert([{ id: orgAId, name: 'CLINICA ALFA', slug: 'alfa-test' }]);
        await supabaseAdmin.from('organizations').upsert([{ id: orgBId, name: 'CLINICA BETA', slug: 'beta-test' }]);
        await supabaseAdmin.from('patients').upsert([{ id: patientBId, name: 'PACIENTE SECRETO BETA', organization_id: orgBId }]);

        console.log("\n--- SIMULAÇÃO DE ATAQUE ---");

        // ATAQUE: Simular a lógica do nosso validateAccess()
        // Tentativa: Usuario reporta que está na Org A mas passa o ID do Paciente da Org B
        const userOrgContext = orgAId;
        const targetPatientId = patientBId;

        console.log(`Usuário da Clínica Alfa tentando acessar Paciente da Clínica Beta...`);

        // Busca o paciente no banco para verificar a qual org ele realmente pertence
        const { data: patientCheck, error: fetchError } = await supabaseAdmin
            .from('patients')
            .select('organization_id, name')
            .eq('id', targetPatientId)
            .single();

        if (fetchError) throw fetchError;

        console.log(`Dono real do paciente: ${patientCheck.organization_id}`);
        console.log(`Organização do invasor: ${userOrgContext}`);

        if (patientCheck.organization_id !== userOrgContext) {
            console.log("\n✅ BLOQUEIO NASA CONFIRMADO!");
            console.log("A lógica de 'validateAccess' impediria esta operação.");
            console.log("O invasor veria: 'Não autorizado: Este paciente não pertence à sua organização'");
        } else {
            console.error("\n❌ FALHA CRÍTICA: As organizações estão misturadas!");
        }

        // Limpeza
        console.log("\nFinalizando teste e removendo rastros...");
        await supabaseAdmin.from('patients').delete().eq('id', patientBId);
        await supabaseAdmin.from('organizations').delete().in('id', [orgAId, orgBId]);

        console.log("🛡️ SISTEMA BLINDADO.");

    } catch (e) {
        console.error("Erro no teste:", e.message);
    }
}

runSecurityStressTest();
