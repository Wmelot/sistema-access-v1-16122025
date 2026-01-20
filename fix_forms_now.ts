import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    try {
        console.log('Conectando ao Supabase...\n');

        // Buscar sua conta
        const { data: you, error: youError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', 'wmelot@gmail.com')
            .single();

        if (youError) {
            console.error('Erro ao buscar seu perfil:', youError);
            return;
        }

        console.log('✅ SUA CONTA:');
        console.log('Nome:', you.full_name);
        console.log('Org ID:', you.organization_id);
        console.log('');

        // Buscar todos os formulários
        const { data: allForms, error: formsError } = await supabase
            .from('form_templates')
            .select('id, title, organization_id, is_active, deleted_at')
            .is('deleted_at', null);

        if (formsError) {
            console.error('Erro ao buscar formulários:', formsError);
            return;
        }

        console.log('📋 FORMULÁRIOS NO SISTEMA:', allForms?.length || 0);

        const yourForms = allForms?.filter(f => f.organization_id === you.organization_id) || [];
        const orphanForms = allForms?.filter(f => !f.organization_id) || [];
        const otherForms = allForms?.filter(f => f.organization_id && f.organization_id !== you.organization_id) || [];

        console.log('  - Seus:', yourForms.length);
        console.log('  - Órfãos (sem org):', orphanForms.length);
        console.log('  - De outras clínicas:', otherForms.length);
        console.log('');

        // Vincular órfãos à sua organização
        if (orphanForms.length > 0) {
            console.log('🔧 VINCULANDO ÓRFÃOS À SUA ORGANIZAÇÃO...');

            const { error: updateError } = await supabase
                .from('form_templates')
                .update({ organization_id: you.organization_id })
                .is('organization_id', null)
                .is('deleted_at', null);

            if (updateError) {
                console.error('Erro ao vincular:', updateError);
            } else {
                console.log('✅ Vinculados', orphanForms.length, 'formulários!');
            }
        }

        // Buscar todos os profissionais
        const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, organization_id');

        console.log('\n👥 PROFISSIONAIS NO SISTEMA:', allProfiles?.length || 0);

        const yourTeam = allProfiles?.filter(p => p.organization_id === you.organization_id) || [];
        console.log('  - Sua equipe:', yourTeam.length);

        yourTeam.forEach(p => {
            console.log('    •', p.full_name, `(${p.email})`);
        });

    } catch (err: any) {
        console.error('ERRO:', err.message);
    }
}

main().then(() => process.exit(0));
