const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkOrg() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: profs } = await supabase
        .from('academic_professors')
        .select('name, email, organization_id')
        .in('email', ['wmelot@gmail.com', 'tatianabarral@gmail.com']);

    console.log(profs);
}

checkOrg();
