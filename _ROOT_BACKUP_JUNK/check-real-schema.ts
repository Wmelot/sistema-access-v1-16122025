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

async function checkRealSchema(db: any, dbName: string) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 VERIFICAÇÃO DIRETA DO SCHEMA: ${dbName}`);
    console.log(`${'='.repeat(80)}\n`);

    // Query SQL direto para listar TODAS as tabelas do schema public
    const { data: tables, error } = await db.rpc('exec_sql', {
        query: `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    });

    if (error) {
        console.log('⚠️  RPC exec_sql não disponível. Tentando query alternativa...\n');

        // Tentar query direta via PostgREST
        const { data: pgTables, error: pgError } = await db
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_type', 'BASE TABLE');

        if (pgError) {
            console.log('❌ Erro ao acessar information_schema:', pgError.message);

            // Última tentativa: usar SQL direto via rpc genérico
            console.log('\n🔄 Tentando método alternativo via SQL direto...\n');

            const sqlQuery = `
        SELECT 
          schemaname,
          tablename,
          tableowner
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;

            console.log('📝 Query SQL:', sqlQuery);
            console.log('\n⚠️  Não foi possível executar SQL direto via Supabase Client.');
            console.log('💡 Recomendação: Acesse o Supabase Dashboard > SQL Editor e execute:');
            console.log('\n```sql');
            console.log(sqlQuery);
            console.log('```\n');

            return;
        }

        console.log('✅ Tabelas encontradas via information_schema:\n');
        pgTables?.forEach((table: any) => {
            console.log(`   📋 ${table.table_name}`);
        });
        console.log(`\n📊 Total: ${pgTables?.length || 0} tabelas\n`);
        return;
    }

    console.log('✅ Tabelas encontradas via RPC:\n');
    tables?.forEach((table: any) => {
        console.log(`   📋 ${table.table_name.padEnd(40)} (${table.column_count} colunas)`);
    });
    console.log(`\n📊 Total: ${tables?.length || 0} tabelas\n`);
}

async function checkSchemaCache() {
    console.log('\n🚀 VERIFICANDO SCHEMA REAL DAS BASES DE DADOS...\n');

    await checkRealSchema(currentDB, '🔵 BASE ATUAL (robptuukezhqvtasjyhz)');
    await checkRealSchema(oldDB, '🟢 BASE ANTIGA (ptpxqzocurdfihaqlkqb)');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ VERIFICAÇÃO COMPLETA`);
    console.log(`${'='.repeat(80)}\n`);

    // Testar permissões de DELETE
    console.log('🔐 TESTANDO PERMISSÕES DE DELETE NA BASE ATUAL...\n');

    // Criar um registro de teste
    const { data: testRecord, error: createError } = await currentDB
        .from('reminders')
        .insert({
            user_id: '839a77d3-a7f0-4103-bc4a-004ec550bd15',
            creator_id: '839a77d3-a7f0-4103-bc4a-004ec550bd15',
            content: 'TESTE DE DELETE - PODE APAGAR',
            status: 'pending'
        })
        .select()
        .single();

    if (createError) {
        console.log('❌ Erro ao criar registro de teste:', createError.message);
    } else {
        console.log('✅ Registro de teste criado:', testRecord.id);

        // Tentar deletar
        const { error: deleteError } = await currentDB
            .from('reminders')
            .delete()
            .eq('id', testRecord.id);

        if (deleteError) {
            console.log('❌ ERRO AO DELETAR:', deleteError.message);
            console.log('   Código:', deleteError.code);
            console.log('   Detalhes:', deleteError.details);
            console.log('\n⚠️  PROBLEMA CONFIRMADO: Você NÃO tem permissão de DELETE!');
        } else {
            console.log('✅ DELETE bem-sucedido! Permissões OK.');
        }
    }
}

checkSchemaCache();
