require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const id = 'd0744c7a-df6f-49ca-9e96-4f0b49fb0388';

    console.log('Checking Patients...');
    const { data: p, error: pe } = await supabase.from('patients').select('id, name, organization_id').eq('id', id).maybeSingle();
    console.log('Patient:', p, pe);

    console.log('Checking Profiles...');
    const { data: prof, error: profe } = await supabase.from('profiles').select('id, full_name, organization_id').eq('id', id).maybeSingle();
    console.log('Profile:', prof, profe);

    // List some patients to see if we HAVE data
    console.log('Sampling patients...');
    const { data: samples } = await supabase.from('patients').select('id, name').limit(3);
    console.log('Samples:', samples);
}

check();
