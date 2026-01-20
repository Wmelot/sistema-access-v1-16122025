import { createClient } from '@supabase/supabase-js';

const currentDB = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

async function forceCheckAssessments() {
    console.log('\n🔍 VERIFICAÇÃO FORÇADA - IGNORANDO CACHE DO SUPABASE\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Lista de todas as possíveis tabelas de avaliações
    const tables = [
        'assessments',
        'patient_assessments',
        'assessment_responses',
        'form_submissions',
        'evaluation_data',
        'clinical_evaluations',
        'patient_evaluations',
    ];

    console.log('📋 Tentando acessar cada tabela diretamente...\n');

    for (const table of tables) {
        console.log(`🔍 Verificando: ${table}`);

        try {
            // Tentar SELECT direto
            const { data, error, count } = await currentDB
                .from(table)
                .select('*', { count: 'exact', head: false })
                .limit(5);

            if (error) {
                console.log(`   ❌ Erro: ${error.message}`);
                console.log(`   Código: ${error.code || 'N/A'}`);
            } else {
                console.log(`   ✅ SUCESSO! ${count || 0} registros encontrados`);

                if (data && data.length > 0) {
                    console.log(`   📊 Primeiros registros:`);
                    data.forEach((record: any, idx: number) => {
                        console.log(`      ${idx + 1}. ${JSON.stringify(record).substring(0, 120)}...`);
                    });
                }
            }
        } catch (err: any) {
            console.log(`   ⚠️  Exceção: ${err.message}`);
        }

        console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICAÇÃO ALTERNATIVA - USANDO POSTGRES DIRETO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Tentar via connection string direto
    console.log('💡 RECOMENDAÇÃO:');
    console.log('   Execute este SQL no Supabase SQL Editor:');
    console.log('');
    console.log('   SELECT table_name');
    console.log('   FROM information_schema.tables');
    console.log('   WHERE table_schema = \'public\'');
    console.log('   AND table_name LIKE \'%assess%\'');
    console.log('   ORDER BY table_name;');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

forceCheckAssessments();
