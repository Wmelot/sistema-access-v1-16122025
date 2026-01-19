
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testServiceRole() {
    console.log('Testing Data Access with SERVICE ROLE KEY...');

    // Test 1: Public Table
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

    if (profileError) {
        console.error('❌ Service Role (Data) Failed:', profileError.message);
    } else {
        console.log('✅ Service Role (Data) Working. Access to public tables OK.');
    }

    // Test 2: List Users (Admin Auth)
    console.log('Testing Admin Auth (listUsers)...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (authError) {
        console.error('❌ Service Role (Auth Admin) Failed:', authError.message);
        console.error('Details:', authError);
    } else {
        console.log('✅ Service Role (Auth Admin) Working. Can list users.');
    }
}

testServiceRole();
