
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
    const email = `test_signup_${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    console.log(`Attempting signup for ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('❌ Signup FAILED:', error.message);
        console.error('   Error Details:', error);
    } else {
        console.log('✅ Signup SUCCESSFUL!');
        console.log('   User ID:', data.user?.id);
    }
}

testSignup();
