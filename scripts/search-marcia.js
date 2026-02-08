const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function searchGlobal() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("Searching for Marcia globally...");
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Marcia%');

    console.log("Profiles found:", JSON.stringify(profiles, null, 2));

    const { data: users, error: uError } = await supabase
        .from('academic_professors')
        .select('*')
        .ilike('name', '%Marcia%');

    console.log("Academic Profs found:", JSON.stringify(users, null, 2));
}

searchGlobal();
