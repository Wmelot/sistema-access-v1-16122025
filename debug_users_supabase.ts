
import { createAdminClient } from './src/lib/supabase/admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkUsers() {
    try {
        const supabase = createAdminClient();

        console.log("--- PROFILES IN ACCESS FISIOTERAPIA (9571532e-fdf8-4aaa-b236-416fd6459566) ---");
        const { data: profiles, error: pError } = await supabase
            .from('profiles')
            .select('id, full_name, email, organization_id')
            .eq('organization_id', '9571532e-fdf8-4aaa-b236-416fd6459566');

        if (pError) throw pError;
        console.table(profiles);

        console.log("\n--- AUTH USERS ---");
        const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
        if (uError) throw uError;

        const authUsersSubSet = users.map(u => ({ id: u.id, email: u.email }));
        console.table(authUsersSubSet);

        console.log("\n--- MATCHING ---");
        for (const p of profiles) {
            const match = users.find(u => u.id === p.id);
            console.log(`Profile: ${p.full_name} (${p.email}) -> Auth Match: ${match ? 'YES' : 'NO'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
