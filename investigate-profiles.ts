import { createClient } from '@supabase/supabase-js';

const currentDB = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

const oldDB = createClient(
    'https://ptpxqzocurdfihaqlkqb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhxem9jdXJkZmloYXFsa3FiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0NzE2NSwiZXhwIjoyMDg0NDIzMTY1fQ.392pAIhsxgR8uq39ptjq0J77O_1ZigUQCStnJlOB4f0'
);

async function investigateProfiles() {
    console.log('\n🔍 INVESTIGANDO TABELA PROFILES E DADOS RELACIONADOS...\n');

    // 🔵 BASE ATUAL
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 BASE ATUAL - PROFILES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const { data: currentProfiles, error: currentError } = await currentDB
        .from('profiles')
        .select('*');

    if (currentError) {
        console.log('❌ Erro:', currentError.message);
    } else {
        console.log(`✅ ${currentProfiles?.length || 0} profiles encontrados\n`);

        currentProfiles?.forEach((profile: any, idx: number) => {
            console.log(`${idx + 1}. ${profile.full_name || 'Sem nome'}`);
            console.log(`   Email: ${profile.email || 'N/A'}`);
            console.log(`   Role: ${profile.role || 'N/A'}`);
            console.log(`   ID: ${profile.id}`);
            console.log(`   Organization ID: ${profile.organization_id || 'N/A'}`);
            console.log(`   Created: ${profile.created_at || 'N/A'}`);
            console.log('');
        });
    }

    // 🟢 BASE ANTIGA
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🟢 BASE ANTIGA - PROFILES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const { data: oldProfiles, error: oldError } = await oldDB
        .from('profiles')
        .select('*');

    if (oldError) {
        console.log('❌ Erro:', oldError.message);
    } else {
        console.log(`✅ ${oldProfiles?.length || 0} profiles encontrados\n`);

        oldProfiles?.forEach((profile: any, idx: number) => {
            console.log(`${idx + 1}. ${profile.full_name || 'Sem nome'}`);
            console.log(`   Email: ${profile.email || 'N/A'}`);
            console.log(`   Role: ${profile.role || 'N/A'}`);
            console.log(`   ID: ${profile.id}`);
            console.log(`   Organization ID: ${profile.organization_id || 'N/A'}`);
            console.log('');
        });
    }

    // Buscar outras tabelas relacionadas
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 BUSCANDO OUTRAS TABELAS RELACIONADAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const relatedTables = [
        'users',
        'professionals',
        'user_organizations',
        'organization_members',
        'team_members',
        'availabilities',
        'schedules',
        'professional_services',
    ];

    for (const table of relatedTables) {
        try {
            const { count, error, data } = await currentDB
                .from(table)
                .select('*', { count: 'exact' });

            if (!error && count !== null) {
                if (count > 0) {
                    console.log(`✅ ${table.padEnd(30)} → ${count} registros`);

                    if (data && data.length > 0) {
                        console.log(`   📋 Amostra:`);
                        data.slice(0, 2).forEach((record: any) => {
                            console.log(`      ${JSON.stringify(record).substring(0, 100)}...`);
                        });
                    }
                    console.log('');
                } else {
                    console.log(`📭 ${table.padEnd(30)} → Vazio`);
                }
            }
        } catch (err) {
            // Silenciar
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ INVESTIGAÇÃO COMPLETA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Salvar dados completos
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/wmelo/Axiom/profiles-complete-data.json',
        JSON.stringify({
            currentProfiles,
            oldProfiles,
            timestamp: new Date().toISOString()
        }, null, 2)
    );

    console.log('💾 Dados completos salvos em: profiles-complete-data.json\n');
}

investigateProfiles();
