import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const parceiros = [
    { email: 'fguiscem@gmail.com', cep: null },
    { email: 'fimeso@hotmail.com', cep: null },
    { email: 'fisio.cristal@gmail.com', cep: null },
    { email: 'fisiofrade@gmail.com', cep: null },
    { email: 'fisiosportsolution@gmail.com', cep: null },
    { email: 'fitsole3d@gmail.com', cep: null },
    { email: 'footmtorchia@gmail.com', cep: null },
    { email: 'gabrielgcordeiro@yahoo.com.br', cep: null },
    { email: 'gbrunoalves@yahoo.com.br', cep: null },
    { email: 'gtolentinocesar@gmail.com', cep: null },
    { email: 'guilherme.propulsao@gmail.com', cep: null },
    { email: 'guiribra@yahoo.com.br', cep: null },
    { email: 'hugo_goretti@yahoo.com.br', cep: null },
    { email: 'industria@ggmail.com', cep: null },
    { email: 'ismael.liu@gmail.com', cep: null },
    { email: 'bruno_matoso@hotmail.com', cep: '79040860' }
];

async function run() {
    console.log('Iniciando pareamento Propulsão x Axiom...');

    for (const p of parceiros) {
        if (!p.email) continue;

        const updateData: any = { is_propulsao_partner: true };
        if (p.cep) updateData.cep = p.cep;

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('email', p.email)
            .select('id, full_name, email');

        if (error) {
            console.error(`❌ Erro em ${p.email}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✅ Parceiro ativado no Axiom: ${data[0].full_name || data[0].email} (${p.email})`);
        } else {
            console.log(`⚠️ Email não encontrado no banco Axiom (Ainda não criaram conta): ${p.email}`);
        }
    }
    console.log('Finalizado!');
}

run();
