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

// Lista de TODAS as tabelas possíveis
const TABLES = [
    'patients',
    'professionals',
    'users',
    'organizations',
    'protocols',
    'assessments',
    'appointments',
    'services',
    'schedules',
    'availabilities',
    'reminders',
    'attendance',
    'attendance_history',
    'exercises',
    'exercise_categories',
    'pathologies',
    'clinical_protocols',
    'treatment_plans',
    'evolution_notes',
    'documents',
    'files',
    'storage_files',
    'notifications',
    'audit_logs',
    'user_roles',
    'permissions',
    'settings',
    'templates',
    'forms',
    'form_responses',
    'questionnaires',
    'questions',
    'answers',
    'medical_records',
    'prescriptions',
    'invoices',
    'payments',
    'insurance',
    'referrals',
    'lab_results',
    'imaging',
    'vital_signs',
    'medications',
    'allergies',
    'diagnoses',
    'procedures',
    'consent_forms',
    'anamnesis',
    'physical_exam',
    'treatment_sessions',
    'progress_notes',
    'discharge_summaries',
];

async function deepAudit(db: any, dbName: string) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 AUDITORIA PROFUNDA: ${dbName}`);
    console.log(`${'='.repeat(80)}\n`);

    const results: any = {
        tablesWithData: [],
        emptyTables: [],
        nonExistentTables: [],
        totalRecords: 0,
        detailedData: {},
    };

    for (const table of TABLES) {
        try {
            // Tentar contar registros
            const { count, error, data } = await db
                .from(table)
                .select('*', { count: 'exact' });

            if (error) {
                if (error.message.includes('does not exist') || error.code === '42P01') {
                    results.nonExistentTables.push(table);
                } else {
                    console.log(`⚠️  ${table}: ERRO - ${error.message}`);
                }
                continue;
            }

            if (count && count > 0) {
                results.tablesWithData.push({ table, count });
                results.totalRecords += count;
                results.detailedData[table] = data;

                console.log(`✅ ${table.padEnd(30)} → ${count} registros`);

                // Mostrar primeiros registros se for tabela importante
                if (['protocols', 'forms', 'questionnaires', 'templates', 'clinical_protocols'].includes(table)) {
                    console.log(`   📋 Primeiros registros:`);
                    data?.slice(0, 3).forEach((record: any, idx: number) => {
                        console.log(`      ${idx + 1}. ID: ${record.id} | Nome: ${record.name || record.title || record.description || 'N/A'}`);
                    });
                }
            } else {
                results.emptyTables.push(table);
            }
        } catch (err: any) {
            console.log(`❌ ${table}: EXCEÇÃO - ${err.message}`);
        }
    }

    // Verificar tabela auth.users
    try {
        const { data: authUsers, error } = await db.rpc('get_auth_users');
        if (!error && authUsers) {
            console.log(`\n🔐 auth.users → ${authUsers.length} usuários`);
            results.detailedData['auth.users'] = authUsers;
        }
    } catch (err) {
        // Tentar query direta se RPC não existir
        try {
            const { data, error } = await db.from('auth.users').select('*');
            if (!error && data) {
                console.log(`\n🔐 auth.users → ${data.length} usuários`);
                results.detailedData['auth.users'] = data;
            }
        } catch (err2) {
            console.log(`⚠️  Não foi possível acessar auth.users`);
        }
    }

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📊 RESUMO ${dbName}:`);
    console.log(`   ✅ Tabelas com dados: ${results.tablesWithData.length}`);
    console.log(`   📭 Tabelas vazias: ${results.emptyTables.length}`);
    console.log(`   ❌ Tabelas inexistentes: ${results.nonExistentTables.length}`);
    console.log(`   📈 Total de registros: ${results.totalRecords}`);
    console.log(`${'─'.repeat(80)}\n`);

    return results;
}

async function compareAndAnalyze() {
    console.log('\n🚀 INICIANDO AUDITORIA COMPLETA DAS BASES DE DADOS...\n');

    const currentResults = await deepAudit(currentDB, '🔵 BASE ATUAL (robptuukezhqvtasjyhz)');
    const oldResults = await deepAudit(oldDB, '🟢 BASE ANTIGA (ptpxqzocurdfihaqlkqb)');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 ANÁLISE COMPARATIVA`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`🔵 BASE ATUAL: ${currentResults.totalRecords} registros totais`);
    console.log(`🟢 BASE ANTIGA: ${oldResults.totalRecords} registros totais\n`);

    // Comparar tabelas com dados
    console.log(`📋 TABELAS COM DADOS:\n`);

    const allTablesWithData = new Set([
        ...currentResults.tablesWithData.map((t: any) => t.table),
        ...oldResults.tablesWithData.map((t: any) => t.table),
    ]);

    for (const table of allTablesWithData) {
        const currentCount = currentResults.tablesWithData.find((t: any) => t.table === table)?.count || 0;
        const oldCount = oldResults.tablesWithData.find((t: any) => t.table === table)?.count || 0;

        const diff = currentCount - oldCount;
        const diffSymbol = diff > 0 ? '📈' : diff < 0 ? '📉' : '➖';

        console.log(`   ${table.padEnd(30)} → Atual: ${String(currentCount).padStart(4)} | Antiga: ${String(oldCount).padStart(4)} ${diffSymbol}`);
    }

    // Verificar dados críticos
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🔍 DADOS CRÍTICOS (Protocolos, Forms, Questionários):\n`);

    const criticalTables = ['protocols', 'clinical_protocols', 'forms', 'questionnaires', 'templates', 'treatment_plans'];

    for (const table of criticalTables) {
        const currentData = currentResults.detailedData[table];
        const oldData = oldResults.detailedData[table];

        if (currentData?.length > 0 || oldData?.length > 0) {
            console.log(`\n   📋 ${table.toUpperCase()}:`);

            if (currentData?.length > 0) {
                console.log(`      🔵 BASE ATUAL (${currentData.length} registros):`);
                currentData.slice(0, 5).forEach((item: any, idx: number) => {
                    console.log(`         ${idx + 1}. ${JSON.stringify(item).substring(0, 100)}...`);
                });
            }

            if (oldData?.length > 0) {
                console.log(`      🟢 BASE ANTIGA (${oldData.length} registros):`);
                oldData.slice(0, 5).forEach((item: any, idx: number) => {
                    console.log(`         ${idx + 1}. ${JSON.stringify(item).substring(0, 100)}...`);
                });
            }
        }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ AUDITORIA COMPLETA FINALIZADA`);
    console.log(`${'='.repeat(80)}\n`);

    // Salvar resultados em arquivo JSON
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/wmelo/Axiom/database-audit-results.json',
        JSON.stringify({ currentResults, oldResults }, null, 2)
    );

    console.log(`💾 Resultados completos salvos em: database-audit-results.json\n`);
}

compareAndAnalyze();
