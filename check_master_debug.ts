import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMasterOrg() {
    const id = '00000000-0000-0000-0000-000000000001';
    console.log(`Checking Org ID: ${id}`);

    const { data: org, error } = await supabase
        .from('organizations')
        .select(`
            *,
            plan_config:plan_configs (
                id, name, slug, features, max_professionals
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found Org:", org);
    }
}

checkMasterOrg();
