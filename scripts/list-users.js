
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function list() {
    console.log('Listing users in database:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('⚠️ No users found in this database!');
    } else {
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`));
    }
}

list();
