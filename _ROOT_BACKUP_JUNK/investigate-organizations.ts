import { createClient } from '@supabase/supabase-js';

const currentDB = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

async function investigateOrganizations() {
    console.log('\n🔍 INVESTIGAÇÃO COMPLETA - ORGANIZAÇÕES E PATIENT RECORDS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. VERIFICAR ORGANIZAÇÕES
    console.log('📊 1. ORGANIZAÇÕES\n');

    const { data: orgs, error: orgsError } = await currentDB
        .from('organizations')
        .select('*');

    if (orgsError) {
        console.log('❌ Erro ao buscar organizações:', orgsError.message);
    } else {
        console.log(`✅ ${orgs?.length || 0} organizações encontradas:\n`);
        orgs?.forEach((org: any, idx: number) => {
            console.log(`${idx + 1}. ${org.name}`);
            console.log(`   ID: ${org.id}`);
            console.log(`   Slug: ${org.slug}`);
            console.log(`   Owner ID: ${org.owner_id || 'N/A'}`);
            console.log(`   Plan: ${org.plan}`);
            console.log(`   Status: ${org.status}`);
            console.log('');
        });
    }

    // 2. VERIFICAR PROFILES E SUAS ORGANIZAÇÕES
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 2. PROFILES E SUAS ORGANIZAÇÕES\n');

    const { data: profiles, error: profilesError } = await currentDB
        .from('profiles')
        .select('*');

    if (profilesError) {
        console.log('❌ Erro:', profilesError.message);
    } else {
        console.log(`✅ ${profiles?.length || 0} profiles:\n`);

        const orgMap: any = {};
        profiles?.forEach((profile: any) => {
            const orgId = profile.organization_id || 'SEM ORGANIZAÇÃO';
            if (!orgMap[orgId]) orgMap[orgId] = [];
            orgMap[orgId].push(profile);
        });

        Object.keys(orgMap).forEach((orgId: string) => {
            const orgName = orgs?.find((o: any) => o.id === orgId)?.name || orgId;
            console.log(`📋 ${orgName}:`);
            orgMap[orgId].forEach((p: any) => {
                console.log(`   - ${p.full_name || 'Sem nome'} (${p.email}) [${p.role}]`);
            });
            console.log('');
        });
    }

    // 3. VERIFICAR PATIENT RECORDS
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 3. PATIENT RECORDS (PRONTUÁRIOS)\n');

    const { data: records, error: recordsError } = await currentDB
        .from('patient_records')
        .select('*');

    if (recordsError) {
        console.log('❌ Erro:', recordsError.message);
    } else {
        console.log(`✅ ${records?.length || 0} patient records encontrados:\n`);

        records?.forEach((record: any, idx: number) => {
            console.log(`${idx + 1}. Patient ID: ${record.patient_id}`);
            console.log(`   Record ID: ${record.id}`);
            console.log(`   Created: ${record.created_at}`);
            console.log(`   Updated: ${record.updated_at}`);
            console.log(`   Data keys: ${Object.keys(record).join(', ')}`);
            console.log(`   Data preview: ${JSON.stringify(record).substring(0, 200)}...`);
            console.log('');
        });
    }

    // 4. VERIFICAR DADOS POR ORGANIZAÇÃO
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 4. DADOS POR ORGANIZAÇÃO\n');

    const tablesWithOrgId = [
        'patients',
        'appointments',
        'services',
        'invoices',
        'reminders',
        'locations',
        'transactions',
    ];

    for (const table of tablesWithOrgId) {
        try {
            const { data, error } = await currentDB
                .from(table)
                .select('organization_id');

            if (!error && data) {
                const orgCounts: any = {};
                data.forEach((row: any) => {
                    const orgId = row.organization_id || 'NULL';
                    orgCounts[orgId] = (orgCounts[orgId] || 0) + 1;
                });

                console.log(`📋 ${table}:`);
                Object.keys(orgCounts).forEach((orgId: string) => {
                    const orgName = orgs?.find((o: any) => o.id === orgId)?.name || orgId;
                    console.log(`   ${orgName}: ${orgCounts[orgId]} registros`);
                });
                console.log('');
            }
        } catch (err) {
            // Silenciar
        }
    }

    // 5. IDENTIFICAR PROBLEMAS
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  5. PROBLEMAS IDENTIFICADOS\n');

    const problems: string[] = [];

    // Verificar profiles sem organização
    const profilesWithoutOrg = profiles?.filter((p: any) => !p.organization_id);
    if (profilesWithoutOrg && profilesWithoutOrg.length > 0) {
        problems.push(`❌ ${profilesWithoutOrg.length} profiles SEM organization_id`);
        profilesWithoutOrg.forEach((p: any) => {
            console.log(`   - ${p.full_name} (${p.email})`);
        });
    }

    // Verificar organizações sem owner
    const orgsWithoutOwner = orgs?.filter((o: any) => !o.owner_id);
    if (orgsWithoutOwner && orgsWithoutOwner.length > 0) {
        problems.push(`⚠️  ${orgsWithoutOwner.length} organizações SEM owner_id`);
        orgsWithoutOwner.forEach((o: any) => {
            console.log(`   - ${o.name} (${o.id})`);
        });
    }

    if (problems.length === 0) {
        console.log('✅ Nenhum problema crítico encontrado!\n');
    } else {
        console.log(`\n⚠️  ${problems.length} problemas encontrados:\n`);
        problems.forEach((p: string) => console.log(p));
        console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ INVESTIGAÇÃO COMPLETA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Salvar resultados
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/wmelo/Axiom/organization-investigation.json',
        JSON.stringify({ orgs, profiles, records, problems }, null, 2)
    );

    console.log('💾 Resultados salvos em: organization-investigation.json\n');
}

investigateOrganizations();
