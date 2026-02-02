const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
    const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', 'access-fisioterapia')
        .single();

    if (!org) {
        console.log('Organização não encontrada');
        return;
    }

    console.log('Organização:', org.name);

    const { data: settings } = await supabase
        .from('clinic_settings')
        .select('address')
        .eq('id', org.id)
        .single();

    if (!settings) {
        console.log('❌ Nenhuma configuração encontrada');
        return;
    }

    console.log('Endereço cadastrado:', JSON.stringify(settings.address, null, 2));
})();
