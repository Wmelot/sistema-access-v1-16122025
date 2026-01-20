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

async function testDatabaseAccess() {
    console.log('🔍 TESTANDO ACESSO ÀS BASES DE DADOS...\n');

    // Testar BASE ATUAL
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 BASE ATUAL (robptuukezhqvtasjyhz)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        // Contar registros principais
        const [patients, professionals, users, organizations, protocols, assessments] = await Promise.all([
            currentDB.from('patients').select('id', { count: 'exact', head: true }),
            currentDB.from('professionals').select('id', { count: 'exact', head: true }),
            currentDB.from('users').select('id', { count: 'exact', head: true }),
            currentDB.from('organizations').select('id', { count: 'exact', head: true }),
            currentDB.from('protocols').select('id', { count: 'exact', head: true }),
            currentDB.from('assessments').select('id', { count: 'exact', head: true }),
        ]);

        console.log('✅ ACESSO CONCEDIDO');
        console.log(`📊 Pacientes: ${patients.count || 0}`);
        console.log(`👨‍⚕️ Profissionais: ${professionals.count || 0}`);
        console.log(`👤 Usuários: ${users.count || 0}`);
        console.log(`🏢 Organizações: ${organizations.count || 0}`);
        console.log(`📋 Protocolos: ${protocols.count || 0}`);
        console.log(`📝 Avaliações: ${assessments.count || 0}`);

        // Testar permissões de escrita
        const testWrite = await currentDB.from('organizations').select('*').limit(1);
        console.log(`🔐 Permissão de Leitura: ${testWrite.error ? '❌ NEGADA' : '✅ CONCEDIDA'}`);

    } catch (error: any) {
        console.log('❌ ERRO DE ACESSO:', error.message);
    }

    console.log('\n');

    // Testar BASE ANTIGA
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🟢 BASE ANTIGA (ptpxqzocurdfihaqlkqb)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        // Contar registros principais
        const [patients, professionals, users, organizations, protocols, assessments] = await Promise.all([
            oldDB.from('patients').select('id', { count: 'exact', head: true }),
            oldDB.from('professionals').select('id', { count: 'exact', head: true }),
            oldDB.from('users').select('id', { count: 'exact', head: true }),
            oldDB.from('organizations').select('id', { count: 'exact', head: true }),
            oldDB.from('protocols').select('id', { count: 'exact', head: true }),
            oldDB.from('assessments').select('id', { count: 'exact', head: true }),
        ]);

        console.log('✅ ACESSO CONCEDIDO');
        console.log(`📊 Pacientes: ${patients.count || 0}`);
        console.log(`👨‍⚕️ Profissionais: ${professionals.count || 0}`);
        console.log(`👤 Usuários: ${users.count || 0}`);
        console.log(`🏢 Organizações: ${organizations.count || 0}`);
        console.log(`📋 Protocolos: ${protocols.count || 0}`);
        console.log(`📝 Avaliações: ${assessments.count || 0}`);

        // Testar permissões de escrita
        const testWrite = await oldDB.from('organizations').select('*').limit(1);
        console.log(`🔐 Permissão de Leitura: ${testWrite.error ? '❌ NEGADA' : '✅ CONCEDIDA'}`);

    } catch (error: any) {
        console.log('❌ ERRO DE ACESSO:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testDatabaseAccess();
