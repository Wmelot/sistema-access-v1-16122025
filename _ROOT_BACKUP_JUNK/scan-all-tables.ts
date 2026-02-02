import { createClient } from '@supabase/supabase-js';

const currentDB = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

const ALL_TABLES = [
    'access_logs',
    'accounts',
    'api_integrations',
    'appointments',
    'assessment_follow_ups',
    'audit_logs',
    'campaign_messages',
    'clinic_settings',
    'clinical_protocols',
    'clinical_records',
    'consent_tokens',
    'financial_categories',
    'financial_commissions',
    'financial_payables',
    'form_templates',
    'granular_permissions',
    'invoices',
    'locations',
    'marketing_campaigns',
    'message_logs',
    'message_templates',
    'organizations',
    'patient_assessments',
    'patient_records',
    'patients',
    'payment_method_fees',
    'payment_methods',
    'permissions',
    'plan_configs',
    'price_tables',
    'price_table_items',
    'products',
    'professional_availability',
    'professional_commission_rules',
    'profiles',
    'reminders',
    'report_templates',
    'role_permissions',
    'roles',
    'scheduling_rules',
    'service_professionals',
    'services',
    'sessions',
    'system_logs',
    'transactions',
    'user_authenticators',
    'user_template_preferences',
    'users',
    'verification_tokens',
    'webhook_logs',
];

async function scanAllTables() {
    console.log('\n🔍 ESCANEANDO TODAS AS 50 TABELAS DO BANCO DE DADOS...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results: any = {
        tablesWithData: [],
        emptyTables: [],
        totalRecords: 0,
    };

    for (const table of ALL_TABLES) {
        try {
            const { count, error, data } = await currentDB
                .from(table)
                .select('*', { count: 'exact' })
                .limit(3);

            if (error) {
                console.log(`⚠️  ${table.padEnd(40)} → ERRO: ${error.message}`);
            } else if (count && count > 0) {
                results.tablesWithData.push({ table, count, sample: data });
                results.totalRecords += count;
                console.log(`✅ ${table.padEnd(40)} → ${String(count).padStart(5)} registros`);
            } else {
                results.emptyTables.push(table);
                console.log(`📭 ${table.padEnd(40)} → Vazio`);
            }
        } catch (err: any) {
            console.log(`❌ ${table.padEnd(40)} → EXCEÇÃO: ${err.message}`);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO GERAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Tabelas com dados: ${results.tablesWithData.length}`);
    console.log(`📭 Tabelas vazias: ${results.emptyTables.length}`);
    console.log(`📈 Total de registros: ${results.totalRecords}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 TABELAS MAIS IMPORTANTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const importantTables = results.tablesWithData.filter((t: any) =>
        ['patient_assessments', 'assessment_follow_ups', 'clinical_records', 'patient_records',
            'form_templates', 'users', 'profiles', 'clinical_protocols'].includes(t.table)
    );

    importantTables.forEach((t: any) => {
        console.log(`📋 ${t.table.toUpperCase()} (${t.count} registros):`);
        if (t.sample && t.sample.length > 0) {
            t.sample.forEach((record: any, idx: number) => {
                console.log(`   ${idx + 1}. ${JSON.stringify(record).substring(0, 150)}...`);
            });
        }
        console.log('');
    });

    // Salvar resultados
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/wmelo/Axiom/complete-database-scan.json',
        JSON.stringify(results, null, 2)
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 Resultados completos salvos em: complete-database-scan.json');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

scanAllTables();
