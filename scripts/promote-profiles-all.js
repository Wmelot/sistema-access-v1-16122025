const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function promoteProfiles() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Lista completa das gestoras
    const emails = [
        'sabrinaviana@pucminas.br',
        'giselemdiniz@yahoo.com.br',
        'tatiana.barral@yahoo.com.br',
        'colamarcom@gmail.com'
    ];

    for (const email of emails) {
        console.log(`Promoting profile for ${email}...`);
        // Tentar atualizar se o perfil já existir
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .ilike('email', email);

        if (error) {
            console.error(`Error promoting profile ${email}:`, error);
        } else {
            console.log(`${email} profile promoted.`);
        }
    }
}

promoteProfiles();
