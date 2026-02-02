const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'access-fisioterapia')
        .single();

    const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .eq('organization_id', org.id)
        .order('date');

    console.log(`Total de feriados: ${holidays?.length || 0}`);
    console.log('\nFeriados municipais (BH):');
    holidays?.filter(h => h.type === 'city').forEach(h => {
        console.log(`- ${h.date}: ${h.name} (${h.is_mandatory ? 'Obrigatório' : 'Facultativo'})`);
    });
})();
