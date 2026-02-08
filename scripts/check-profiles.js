const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkProfiles() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const emails = [
        'sabrinaviana@pucminas.br',
        'giselemdiniz@yahoo.com.br',
        'tatiana.barral@yahoo.com.br',
        'colamarcom@gmail.com'
    ];

    const { data: profiles } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .in('email', emails);

    console.log("Profiles found:", profiles);
}

checkProfiles();
