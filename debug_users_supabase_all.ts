
import { createAdminClient } from './src/lib/supabase/admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkUsers() {
    try {
        const supabase = createAdminClient();

        console.log("--- ALL PROFILES ---");
        const { data: allProfiles, error: apError } = await supabase
            .from('profiles')
            .select('id, full_name, email, organization_id');

        if (apError) throw apError;
        console.table(allProfiles);

        console.log("\n--- TRYING AUTH LIST USERS ---");
        const { data: authData, error: uError } = await supabase.auth.admin.listUsers();
        if (uError) {
            console.error("Auth List Users failed with 500. This is a known issue in this environment.");
        } else {
            console.log(`Found ${authData.users.length} auth users.`);
            console.table(authData.users.map(u => ({ id: u.id, email: u.email })));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
