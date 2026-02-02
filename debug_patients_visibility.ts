
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectData() {
    console.log("--- Inspecting Data ---");

    // 1. Get first 5 patients (ignoring RLS because we use Service Key)
    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('id, name, organization_id')
        .limit(5);

    if (pError) console.error("Error fetching patients:", pError);
    console.log("Patients Sample:", patients);

    if (patients && patients.length > 0) {
        const orgId = patients[0].organization_id;
        console.log(`\nChecking Organization: ${orgId}`);

        const { data: org } = await supabase.from('organizations').select('*').eq('id', orgId).single();
        console.log("Organization Details:", org);
    }

    // 2. Check User Profiles
    const { data: users, error: uError } = await supabase.from('profiles').select('id, email, organization_id, full_name').limit(5);
    if (uError) console.error("Error fetching profiles:", uError);
    console.log("\nProfiles Sample:", users);

}

inspectData();
