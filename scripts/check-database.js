const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTatiana() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("Checking Tatiana...");
    const { data: profs, error: profError } = await supabase
        .from('academic_professors')
        .select('*')
        .ilike('name', '%Tatiana%');

    if (profError) {
        console.error("Error fetching professors:", profError);
        return;
    }

    console.log("Professors found:", JSON.stringify(profs, null, 2));

    if (profs && profs.length > 0) {
        const orgId = profs[0].organization_id;
        console.log("Org ID identified:", orgId);

        const { data: evs, error: evError } = await supabase
            .from('academic_evidences')
            .select('*')
            .eq('organization_id', orgId);

        if (evError) {
            console.error("Error fetching evidences:", evError);
        } else {
            console.log("Evidences found for this org:", evs.length);
            console.log("Recent evidence titles:", evs.slice(0, 5).map(e => e.title));
        }
    }
}

checkTatiana();
