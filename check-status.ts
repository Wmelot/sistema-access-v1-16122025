
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('--- Diagnostic Start ---');

    // 1. Check Organizations
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id, name');
    if (orgError) console.error('Org Check Error:', orgError);
    else {
        console.log('Organizations found:', orgs);
    }

    // 2. Test Policy: Can we update a profile?
    // We need to simulate a USER action, not Service Role.
    // So we need to sign in as accessfisio@gmail.com
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'accessfisio@gmail.com',
        password: 'Axiom@2026!Password'
    });

    if (loginError || !user) {
        console.error('Login Failed:', loginError);
        return;
    }

    console.log(`Logged in as ${user.email} (${user.id})`);

    // Create a client with the USER session
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
            headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
        }
    });

    // Try to update profile (Self-Update)
    console.log('Attempting self-update (context switch simulation)...');

    // Pick an ID to switch to (The Master Org ID for safety)
    const targetId = '00000000-0000-0000-0000-000000000001';

    const { data: profile, error: updateError } = await userClient
        .from('profiles')
        .update({ organization_id: targetId })
        .eq('id', user.id)
        .select();

    if (updateError) {
        console.error('❌ Update Failed (RLS?):', updateError);
    } else {
        console.log('✅ Update Successful (RLS OK):', profile);
    }

    console.log('--- Diagnostic End ---');
}

main();
