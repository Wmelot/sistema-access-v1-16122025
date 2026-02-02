import { createClient } from '@supabase/supabase-js';

// BASE 1: robptuukezhqvtasjyhz (ATUAL)
const db1 = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

// BASE 2: ptpxqzocurdfihaqlkqb (ANTIGA)
const db2 = createClient(
    'https://ptpxqzocurdfihaqlkqb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhxem9jdXJkZmloYXFsa3FiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0NzE2NSwiZXhwIjoyMDg0NDIzMTY1fQ.392pAIhsxgR8uq39ptjq0J77O_1ZigUQCStnJlOB4f0'
);

async function compareDB(name: string, client: any) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${name}`);
    console.log('='.repeat(60));

    try {
        // Formulários
        const { data: forms, error: formsErr } = await client
            .from('form_templates')
            .select('id, title, is_active, deleted_at')
            .is('deleted_at', null);

        console.log('\n📋 FORMULÁRIOS:');
        console.log('  Total:', forms?.length || 0);
        console.log('  Ativos:', forms?.filter((f: any) => f.is_active).length || 0);

        if (forms && forms.length > 0 && forms.length <= 15) {
            console.log('\n  Lista:');
            forms.forEach((f: any) => {
                console.log('    •', f.title);
            });
        } else if (forms && forms.length > 15) {
            console.log('\n  Primeiros 10:');
            forms.slice(0, 10).forEach((f: any) => {
                console.log('    •', f.title);
            });
            console.log(`    ... e mais ${forms.length - 10}`);
        }

        // Pacientes
        const { data: patients } = await client
            .from('patients')
            .select('id, name')
            .limit(1000);

        console.log('\n👤 PACIENTES:', patients?.length || 0);

        // Profissionais
        const { data: profiles } = await client
            .from('profiles')
            .select('id, full_name, email');

        console.log('👥 PROFISSIONAIS:', profiles?.length || 0);
        if (profiles && profiles.length > 0) {
            profiles.forEach((p: any) => {
                console.log('    •', p.full_name, `(${p.email})`);
            });
        }

        // Agendamentos
        const { data: appts } = await client
            .from('appointments')
            .select('id')
            .limit(1000);

        console.log('📅 AGENDAMENTOS:', appts?.length || 0);

        // Protocolos Clínicos
        const { data: protocols } = await client
            .from('clinical_protocols')
            .select('id, title');

        console.log('📚 PROTOCOLOS CLÍNICOS:', protocols?.length || 0);

        return {
            forms: forms?.length || 0,
            patients: patients?.length || 0,
            profiles: profiles?.length || 0,
            appointments: appts?.length || 0,
            protocols: protocols?.length || 0
        };

    } catch (err: any) {
        console.error('❌ ERRO:', err.message);
        return null;
    }
}

async function main() {
    console.log('\n🔍 COMPARANDO BASES DE DADOS SUPABASE\n');

    const result1 = await compareDB('BASE ATUAL (robptuukezhqvtasjyhz)', db1);
    const result2 = await compareDB('BASE ANTIGA (ptpxqzocurdfihaqlkqb)', db2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO COMPARATIVO');
    console.log('='.repeat(60));

    if (result1 && result2) {
        console.log('\n                        ATUAL    ANTIGA');
        console.log('Formulários:            ', result1.forms.toString().padStart(5), result2.forms.toString().padStart(7));
        console.log('Pacientes:              ', result1.patients.toString().padStart(5), result2.patients.toString().padStart(7));
        console.log('Profissionais:          ', result1.profiles.toString().padStart(5), result2.profiles.toString().padStart(7));
        console.log('Agendamentos:           ', result1.appointments.toString().padStart(5), result2.appointments.toString().padStart(7));
        console.log('Protocolos:             ', result1.protocols.toString().padStart(5), result2.protocols.toString().padStart(7));

        console.log('\n💡 RECOMENDAÇÃO:');

        const score1 = result1.forms + result1.patients + result1.protocols;
        const score2 = result2.forms + result2.patients + result2.protocols;

        if (score1 > score2) {
            console.log('✅ Use a BASE ATUAL (robptuukezhqvtasjyhz) - Tem mais dados!');
            console.log('   Já está configurada no .env.local');
        } else if (score2 > score1) {
            console.log('✅ Use a BASE ANTIGA (ptpxqzocurdfihaqlkqb) - Tem mais dados!');
            console.log('   Para trocar: edite .env.local e comente a base atual, descomente a antiga');
        } else {
            console.log('⚖️  Ambas têm quantidade similar de dados.');
            console.log('   Recomendo ficar na BASE ATUAL por ser mais recente.');
        }
    }

    process.exit(0);
}

main();
