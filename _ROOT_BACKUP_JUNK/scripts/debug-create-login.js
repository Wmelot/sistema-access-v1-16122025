
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDebugUser() {
    const email = `debug_${Date.now()}@test.com`;
    console.log(`Attempting to create debug user: ${email} ...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Password123!',
        email_confirm: true
    });

    if (error) {
        console.error('❌ Creation Failed:', error.message);
        console.error(error);
    } else {
        console.log('✅ User Created Successfully!');
        console.log('ID:', data.user.id);

        console.log('Attempting Login with new user...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'Password123!'
        });

        if (loginError) {
            console.error('❌ Login Failed for NEW user:', loginError.message);
        } else {
            console.log('✅ Login SUCCEEDED for NEW user!');
            console.log('Token:', loginData.session.access_token.substring(0, 15) + '...');
        }
    }
}

createDebugUser();
