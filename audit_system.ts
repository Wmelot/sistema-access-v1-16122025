import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function audit() {
    console.log('=== AUDITORIA COMPLETA ===\n');

    // 1. Formulários
    const { data: forms } = await supabase
        .from('form_templates')
        .select('id, title, is_active, organization_id, user_id, deleted_at');

    console.log('📋 FORMULÁRIOS TOTAIS:', forms?.length || 0);
    console.log('Ativos:', forms?.filter(f => f.is_active && !f.deleted_at).length);
    console.log('Deletados:', forms?.filter(f => f.deleted_at).length);
    console.log('Sem Organização:', forms?.filter(f => !f.organization_id).length);

    // 2. Profissionais
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, organization_id');

    console.log('\n👥 PROFISSIONAIS TOTAIS:', profiles?.length || 0);
    const orgs = [...new Set(profiles?.map(p => p.organization_id).filter(Boolean))];
    console.log('Organizações distintas:', orgs.length);
    orgs.forEach(org => {
        const count = profiles?.filter(p => p.organization_id === org).length;
        console.log('  -', org, ':', count, 'pessoas');
    });

    // 3. Sua organização
    const { data: you } = await supabase
        .from('profiles')
        .select('id, full_name, email, organization_id')
        .eq('email', 'wmelot@gmail.com')
        .single();

    console.log('\n🔑 SUA CONTA:');
    console.log('Email:', you?.email);
    console.log('Nome:', you?.full_name);
    console.log('Org ID:', you?.organization_id);

    if (you?.organization_id) {
        const yourForms = forms?.filter(f => f.organization_id === you.organization_id);
        console.log('\n📝 Seus Formulários:', yourForms?.length || 0);

        const yourTeam = profiles?.filter(p => p.organization_id === you.organization_id);
        console.log('👥 Sua Equipe:', yourTeam?.length || 0);
        yourTeam?.forEach(p => console.log('  -', p.full_name, '(' + p.email + ')'));
    }

    process.exit(0);
}

audit();
