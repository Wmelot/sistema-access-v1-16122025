const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkEvidences() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("Fetching all evidences for Org ID: 9571532e-fdf8-4aaa-b236-416fd6459566");
    const { data: evs, error } = await supabase
        .from('academic_evidences')
        .select('title, created_at, professor')
        .eq('organization_id', '9571532e-fdf8-4aaa-b236-416fd6459566')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Evidences found:", evs.length);
    console.log(JSON.stringify(evs, null, 2));
}

checkEvidences();
