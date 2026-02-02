
import { createAdminClient } from '../src/lib/supabase/admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function diagnose() {
    console.log('Starting diagnosis for wmelot@gmail.com...');
    const supabase = createAdminClient();

    // 1. Check Auth User
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.find(u => u.email === 'wmelot@gmail.com');

    if (!user) {
        console.error('User wmelot@gmail.com NOT FOUND in auth.users!');
    } else {
        console.log('✅ User found:', user.id);
        console.log('   Email Confirmed:', user.email_confirmed_at);
        console.log('   Last Sign In:', user.last_sign_in_at);
        console.log('   User Metadata:', user.user_metadata);

        // 2. Check Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('❌ Error fetching profile:', profileError.message);
        } else if (!profile) {
            console.error('❌ Profile NOT FOUND for user!');
        } else {
            console.log('✅ Profile found:', profile);

            // 3. Check Organization
            if (profile.organization_id) {
                const { data: org, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profile.organization_id)
                    .single();

                if (orgError) {
                    console.error('❌ Error fetching organization:', orgError.message);
                } else {
                    console.log('✅ Linked Organization:', org);
                }
            } else {
                console.warn('⚠️ Profile has NO organization_id linked!');
            }
        }
    }
}

diagnose();
