import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseAdminUrl, supabaseAdminKey);

async function fixAdminPermissions() {
    const roleId = '204c54f1-31ae-464d-841d-049da2e357a0';

    // Fetch all available permissions
    const { data: allPerms, error: fetchError } = await adminSupabase
        .from('permissions')
        .select('id');

    if (fetchError || !allPerms) {
        console.error('Error fetching perms:', fetchError);
        return;
    }

    console.log(`Found ${allPerms.length} permissions to grant.`);

    // Format for insertion
    const dataToInsert = allPerms.map(p => ({
        role_id: roleId,
        permission_id: p.id
    }));

    // Insert into role_permissions
    const { error: insertError } = await adminSupabase
        .from('role_permissions')
        .insert(dataToInsert);

    if (insertError) {
        console.error('Error inserting perms:', insertError);
    } else {
        console.log('Successfully granted all permissions to Admin role!');
    }
}

fixAdminPermissions();
