
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testLoginService() {
    const email = 'wmelot@gmail.com';
    const password = 'Wmelo@123';

    console.log(`Attempting login for ${email} with SERVICE ROLE KEY...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('❌ Login FAILED (Service Role):', error.message);
        console.error('   Error Details:', error);
    } else {
        console.log('✅ Login SUCCESSFUL (Service Role)!');
        console.log('   User ID:', data.user.id);
    }
}

testLoginService();
