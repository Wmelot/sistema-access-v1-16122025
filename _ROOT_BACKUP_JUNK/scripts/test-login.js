
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
    console.log('Testing login for wmelot@gmail.com...');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'wmelot@gmail.com',
        password: 'Wmelo@123'
    });

    if (error) {
        console.error('❌ Login Failed:', error.message);
        console.error('Details:', error);
    } else {
        console.log('✅ Login Successful!');
        console.log('User ID:', data.user.id);
        console.log('Access Token (truncated):', data.session.access_token.substring(0, 20) + '...');
    }
}

testLogin();
