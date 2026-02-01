
import { createAdminClient } from './src/lib/supabase/server';

async function check() {
    const supabase = await createAdminClient();
    const today = '2026-02-01T00:00:00Z';

    console.log("--- Ongoing Appointments ---");
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
        .gte('created_at', today);

    if (e2) console.error(e2);
    else console.table(orgs);

    console.log("\n--- New Profiles Today ---");
    const { data: profiles, error: e3 } = await supabase
        .from('profiles')
        .select('id, full_name, role, organization_id, created_at')
        .gte('created_at', today);

    if (e3) console.error(e3);
    else console.table(profiles);
}

check();
