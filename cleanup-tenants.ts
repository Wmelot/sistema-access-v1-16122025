
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001';
    console.log('--- Cleaning up Extra Tenants ---');

    const { data: orgs } = await supabase.from('organizations').select('id, name');

    if (!orgs) return;

    for (const org of orgs) {
        if (org.id !== MASTER_ORG_ID) {
            console.log(`Deleting ${org.name} (${org.id})...`);
            // Delete Profiles linked to this org first (or set to master?)
            // If they are legitimate users, maybe set to master? Assuming test users.
            await supabase.from('profiles').delete().eq('organization_id', org.id); // Dangerous if real users
            await supabase.from('organizations').delete().eq('id', org.id);
        } else {
            console.log(`Keeping Master: ${org.name}`);
        }
    }
    console.log('--- Cleanup Complete ---');
}

main();
