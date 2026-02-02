
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    console.log(`Checking since: ${todayISO}`);

    console.log("\n--- Ongoing Appointments (checked_in, in_progress) ---");
    const { data: ongoing, error: e1 } = await supabase
        .from('appointments')
        .select('id, status, start_time, patient_id, organization_id')
        .in('status', ['in_progress', 'checked_in'])
        .order('start_time', { ascending: false });

    if (e1) console.error(e1);
    else console.table(ongoing);

    console.log("\n--- New Organizations Today ---");
    const { data: orgs, error: e2 } = await supabase
        .from('organizations')
        .select('id, name, slug, created_at')
        .gte('created_at', todayISO);

    if (e2) console.error(e2);
    else console.table(orgs);

    console.log("\n--- New Profiles Today ---");
    const { data: profiles, error: e3 } = await supabase
        .from('profiles')
        .select('id, full_name, role, organization_id, created_at')
        .gte('created_at', todayISO);

    if (e3) console.error(e3);
    else console.table(profiles);
}

check();
