
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listUsers() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) console.error(error);
    else {
        console.log("Users created/migrated:");
        users.filter(u => u.email.includes('migration.axiom.local')).forEach(u => {
            console.log(`- ${u.user_metadata.full_name}: ${u.email} (ID: ${u.id})`);
        });
    }
}

listUsers();
