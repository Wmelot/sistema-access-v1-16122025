
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase URL or Anon Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    const email = 'wmelot@gmail.com';
    const password = 'Wmelo@123';

    console.log(`Attempting login for ${email}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('❌ Login FAILED:', error.message);
        console.error('   Error Details:', error);
    } else {
        console.log('✅ Login SUCCESSFUL!');
        console.log('   User ID:', data.user.id);
        console.log('   Session expires at:', new Date(data.session?.expires_at! * 1000).toLocaleString());
    }
}

testLogin();
