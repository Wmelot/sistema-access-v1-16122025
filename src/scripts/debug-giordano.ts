import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseAdminUrl, supabaseAdminKey);

async function debugGiordano() {
    const { data: profile, error } = await adminSupabase
        .from('profiles')
        .select('id, full_name, email, role_id, role, organization_id')
        .ilike('email', '%gbrunoalves%')
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    console.log('Profile:', profile);

    if (profile.role_id) {
        const { data: role, error: roleError } = await adminSupabase
            .from('roles')
            .select('*')
            .eq('id', profile.role_id)
            .single();

        console.log('Role:', role);

        const { data: perms, error: permsError } = await adminSupabase
            .from('role_permissions')
            .select('permissions (code)')
            .eq('role_id', profile.role_id);

        console.log('Permissions count:', perms?.length);
    } else {
        console.log('No role_id assigned to this user!');
    }
}

debugGiordano();
