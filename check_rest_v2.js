require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const ids = [
        'd0744c7a-df6f-49ca-9e96-4f0b49fb0388', // Jade
        '58dfb5b4-c01a-4ab5-aad0-c2af9f0da634'  // João
    ];

    for (const id of ids) {
        console.log(`Checking ID: ${id}`);
        const { data: p } = await supabase.from('patients').select('id, name').eq('id', id).maybeSingle();
        console.log('Patient:', p);
    }
}

check();
