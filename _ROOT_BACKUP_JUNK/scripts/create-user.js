
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function create() {
    console.log('Creating user wmelot@gmail.com ...');

    const { data, error } = await supabase.auth.admin.createUser({
        email: 'wmelot@gmail.com',
        password: 'Wmelo@123',
        email_confirm: true,
        user_metadata: { full_name: 'Admin Recriado' }
    });

    if (error) {
        console.error('❌ Error creating user:', error);
    } else {
        console.log('✅ User created successfully!', data.user.id);
    }
}

create();
