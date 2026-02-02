
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificUser() {
    console.log("--- Checking User wmelot@gmail.com ---");

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'wmelot@gmail.com')
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
    } else {
        console.log("Profile Found:", profile);

        // Check count of patients for this org
        if (profile?.organization_id) {
            const { count, error: cError } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', profile.organization_id);

            console.log(`Patients Count for Org ${profile.organization_id}: ${count}`);
            if (cError) console.error(cError);
        } else {
            console.error("⚠️ User has no organization_id!");
        }
    }
}

checkSpecificUser();
