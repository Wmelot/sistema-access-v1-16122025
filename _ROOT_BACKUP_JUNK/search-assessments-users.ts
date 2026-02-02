import { createClient } from '@supabase/supabase-js';

// 🔵 BASE ATUAL (robptuukezhqvtasjyhz)
const currentDB = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

// 🟢 BASE ANTIGA (ptpxqzocurdfihaqlkqb)
const oldDB = createClient(
    'https://ptpxqzocurdfihaqlkqb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhxem9jdXJkZmloYXFsa3FiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0NzE2NSwiZXhwIjoyMDg0NDIzMTY1fQ.392pAIhsxgR8uq39ptjq0J77O_1ZigUQCStnJlOB4f0'
);

// Tabelas relacionadas a avaliações e formulários
const ASSESSMENT_TABLES = [
    'assessments',
    'patient_assessments',
    'assessment_follow_ups',
    'form_responses',
    'questionnaires',
    'questionnaire_responses',
    'evaluations',
    'evaluation_forms',
    'clinical_assessments',
    'physical_assessments',
    'biomechanics_assessments',
    'womens_health_assessments',
    'smart_assessments',
];

async function findAssessmentData(db: any, dbName: string) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 BUSCANDO DADOS DE AVALIAÇÕES: ${dbName}`);
    console.log(`${'='.repeat(80)}\n`);

    const foundData: any = {};
    let totalRecords = 0;

    for (const table of ASSESSMENT_TABLES) {
        try {
            const { count, error, data } = await db
                .from(table)
                .select('*', { count: 'exact' });

            if (!error && count && count > 0) {
                foundData[table] = { count, data };
                totalRecords += count;

                console.log(`✅ ${table.padEnd(35)} → ${count} registros`);

                // Mostrar primeiros registros
                if (data && data.length > 0) {
                    console.log(`   📋 Amostra dos dados:`);
                    data.slice(0, 2).forEach((record: any, idx: number) => {
                        const preview = JSON.stringify(record).substring(0, 120);
                        console.log(`      ${idx + 1}. ${preview}...`);
                    });
                    console.log('');
                }
            }
        } catch (err: any) {
            // Silenciar erros de tabelas inexistentes
        }
    }

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📊 RESUMO ${dbName}:`);
    console.log(`   ✅ Tabelas com dados de avaliações: ${Object.keys(foundData).length}`);
    console.log(`   📈 Total de registros de avaliações: ${totalRecords}`);
    console.log(`${'─'.repeat(80)}\n`);

    return foundData;
}

async function searchProfessionalsAndUsers() {
    console.log('\n🚀 BUSCANDO DADOS DE PROFISSIONAIS, USUÁRIOS E AVALIAÇÕES...\n');

    // Buscar avaliações
    const currentAssessments = await findAssessmentData(currentDB, '🔵 BASE ATUAL');
    const oldAssessments = await findAssessmentData(oldDB, '🟢 BASE ANTIGA');

    // Buscar profissionais e usuários em tabelas alternativas
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 BUSCANDO PROFISSIONAIS E USUÁRIOS EM TABELAS ALTERNATIVAS`);
    console.log(`${'='.repeat(80)}\n`);

    const alternativeTables = [
        'profiles',
        'user_profiles',
        'professional_profiles',
        'staff',
        'team_members',
        'practitioners',
        'therapists',
        'clinicians',
    ];

    for (const table of alternativeTables) {
        try {
            const { count, error, data } = await currentDB
                .from(table)
                .select('*', { count: 'exact' });

            if (!error && count && count > 0) {
                console.log(`✅ ${table.padEnd(30)} → ${count} registros`);

                if (data && data.length > 0) {
                    console.log(`   📋 Primeiros registros:`);
                    data.slice(0, 3).forEach((record: any, idx: number) => {
                        console.log(`      ${idx + 1}. ${JSON.stringify(record).substring(0, 100)}...`);
                    });
                    console.log('');
                }
            }
        } catch (err) {
            // Silenciar
        }
    }

    // Verificar auth.users via query direta
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🔐 VERIFICANDO TABELA auth.users (Supabase Auth)`);
    console.log(`${'─'.repeat(80)}\n`);

    try {
        // Tentar acessar via Management API
        const { data: authUsers, error } = await currentDB.auth.admin.listUsers();

        if (!error && authUsers?.users) {
            console.log(`✅ auth.users → ${authUsers.users.length} usuários encontrados\n`);

            authUsers.users.forEach((user: any, idx: number) => {
                console.log(`   ${idx + 1}. Email: ${user.email || 'N/A'}`);
                console.log(`      ID: ${user.id}`);
                console.log(`      Created: ${user.created_at}`);
                console.log(`      Metadata: ${JSON.stringify(user.user_metadata || {}).substring(0, 80)}...`);
                console.log('');
            });
        } else {
            console.log('⚠️  Não foi possível acessar auth.users via Admin API');
            console.log('   Erro:', error?.message || 'Desconhecido');
        }
    } catch (err: any) {
        console.log('⚠️  Erro ao acessar auth.users:', err.message);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ BUSCA COMPLETA FINALIZADA`);
    console.log(`${'='.repeat(80)}\n`);

    // Salvar resultados
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/wmelo/Axiom/assessment-data-search-results.json',
        JSON.stringify({ currentAssessments, oldAssessments }, null, 2)
    );

    console.log(`💾 Resultados salvos em: assessment-data-search-results.json\n`);
}

searchProfessionalsAndUsers();
