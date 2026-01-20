import { createClient } from '@supabase/supabase-js';

const currentDB = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

const oldDB = createClient(
    'https://ptpxqzocurdfihaqlkqb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhxem9jdXJkZmloYXFsa3FiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0NzE2NSwiZXhwIjoyMDg0NDIzMTY1fQ.392pAIhsxgR8uq39ptjq0J77O_1ZigUQCStnJlOB4f0'
);

const ACCESS_FISIO_ORG_ID = '9571532e-fdf8-4aaa-b236-416fd6459566';
const WARLEY_PROFILE_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15';

async function fixAndUnify() {
    console.log('\n🔧 CORREÇÃO E UNIFICAÇÃO DAS BASES DE DADOS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const fixes: string[] = [];
    const errors: string[] = [];

    // ========================================
    // 1. CORRIGIR PROFILE SEM ORGANIZAÇÃO
    // ========================================
    console.log('📋 1. CORRIGINDO PROFILE SEM ORGANIZAÇÃO...\n');

    try {
        const { data: updated, error } = await currentDB
            .from('profiles')
            .update({ organization_id: ACCESS_FISIO_ORG_ID })
            .eq('email', 'Teste@testmail.com')
            .select();

        if (error) {
            errors.push(`❌ Erro ao atualizar profile: ${error.message}`);
            console.log(`❌ Erro: ${error.message}\n`);
        } else {
            fixes.push(`✅ Profile "Teste 3" vinculado à Access Fisioterapia`);
            console.log(`✅ Profile "Teste 3" atualizado!\n`);
        }
    } catch (err: any) {
        errors.push(`❌ Exceção: ${err.message}`);
        console.log(`❌ Exceção: ${err.message}\n`);
    }

    // ========================================
    // 2. DEFINIR OWNER DAS ORGANIZAÇÕES (Warley é dono de AMBAS)
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏢 2. DEFININDO OWNER DAS ORGANIZAÇÕES (Warley é dono de AMBAS)...\n');

    try {
        // Atualizar TODAS as organizações para ter Warley como owner
        const { error } = await currentDB
            .from('organizations')
            .update({ owner_id: WARLEY_PROFILE_ID })
            .in('id', [ACCESS_FISIO_ORG_ID, '00000000-0000-0000-0000-000000000001']);

        if (error) {
            errors.push(`❌ Erro ao atualizar organizações: ${error.message}`);
            console.log(`❌ Erro: ${error.message}\n`);
        } else {
            fixes.push(`✅ Warley definido como owner da Access Fisioterapia`);
            fixes.push(`✅ Warley definido como owner da Axiom Master`);
            console.log(`✅ Access Fisioterapia atualizada (owner: Warley)!`);
            console.log(`✅ Axiom Master atualizada (owner: Warley)!\n`);
        }
    } catch (err: any) {
        errors.push(`❌ Exceção: ${err.message}`);
        console.log(`❌ Exceção: ${err.message}\n`);
    }

    // ========================================
    // 3. CORRIGIR REMINDER SEM ORGANIZAÇÃO
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 3. CORRIGINDO REMINDER SEM ORGANIZAÇÃO...\n');

    try {
        const { error } = await currentDB
            .from('reminders')
            .update({ organization_id: ACCESS_FISIO_ORG_ID })
            .is('organization_id', null);

        if (error) {
            errors.push(`❌ Erro ao atualizar reminders: ${error.message}`);
            console.log(`❌ Erro: ${error.message}\n`);
        } else {
            fixes.push(`✅ Reminders vinculados à Access Fisioterapia`);
            console.log(`✅ Reminders atualizados!\n`);
        }
    } catch (err: any) {
        errors.push(`❌ Exceção: ${err.message}`);
        console.log(`❌ Exceção: ${err.message}\n`);
    }

    // ========================================
    // 4. MIGRAR DADOS ÚNICOS DA BASE ANTIGA
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 4. VERIFICANDO DADOS ÚNICOS DA BASE ANTIGA...\n');

    // Buscar profile único da base antiga
    const { data: oldProfiles } = await oldDB
        .from('profiles')
        .select('*')
        .eq('email', 'accessfisio@accessfisio.com');

    if (oldProfiles && oldProfiles.length > 0) {
        const uniqueProfile = oldProfiles[0];

        // Verificar se já existe na base atual
        const { data: existing } = await currentDB
            .from('profiles')
            .select('id')
            .eq('email', uniqueProfile.email);

        if (!existing || existing.length === 0) {
            console.log(`📋 Profile único encontrado na base antiga: ${uniqueProfile.email}`);
            console.log(`   ⚠️  Este profile NÃO será migrado automaticamente.`);
            console.log(`   💡 Se necessário, crie manualmente no sistema.\n`);
        } else {
            console.log(`✅ Profile já existe na base atual: ${uniqueProfile.email}\n`);
        }
    } else {
        console.log(`✅ Nenhum dado único encontrado na base antiga.\n`);
    }

    // ========================================
    // 5. VERIFICAR INTEGRIDADE FINAL
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 5. VERIFICAÇÃO FINAL DE INTEGRIDADE...\n');

    const { data: finalProfiles } = await currentDB.from('profiles').select('*');
    const { data: finalOrgs } = await currentDB.from('organizations').select('*');

    const profilesWithoutOrg = finalProfiles?.filter((p: any) => !p.organization_id);
    const orgsWithoutOwner = finalOrgs?.filter((o: any) => !o.owner_id);

    console.log(`📊 Profiles sem organização: ${profilesWithoutOrg?.length || 0}`);
    console.log(`📊 Organizações sem owner: ${orgsWithoutOwner?.length || 0}\n`);

    if (profilesWithoutOrg && profilesWithoutOrg.length > 0) {
        console.log(`⚠️  Profiles ainda sem organização:`);
        profilesWithoutOrg.forEach((p: any) => {
            console.log(`   - ${p.full_name} (${p.email})`);
        });
        console.log('');
    }

    if (orgsWithoutOwner && orgsWithoutOwner.length > 0) {
        console.log(`⚠️  Organizações ainda sem owner:`);
        orgsWithoutOwner.forEach((o: any) => {
            console.log(`   - ${o.name}`);
        });
        console.log('');
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Correções aplicadas: ${fixes.length}`);
    fixes.forEach((fix: string) => console.log(`   ${fix}`));
    console.log('');

    if (errors.length > 0) {
        console.log(`❌ Erros encontrados: ${errors.length}`);
        errors.forEach((err: string) => console.log(`   ${err}`));
        console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CORREÇÃO E UNIFICAÇÃO CONCLUÍDA!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Salvar log
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/wmelo/Axiom/fix-and-unify-log.json',
        JSON.stringify({ fixes, errors, timestamp: new Date().toISOString() }, null, 2)
    );

    console.log('💾 Log salvo em: fix-and-unify-log.json\n');
}

fixAndUnify();
