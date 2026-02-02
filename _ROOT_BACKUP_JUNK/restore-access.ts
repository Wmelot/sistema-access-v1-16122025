
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function restoreUser(email: string, name: string, orgId: string) {
    const password = 'Axiom@2026!Password';
    console.log(`\n--- Processing ${email} ---`);

    // 1. Ensure Auth User
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    if (user) {
        console.log(`User exists (ID: ${user.id}). Updating password...`);
        await supabase.auth.admin.updateUserById(user.id, {
            password: password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });
    } else {
        console.log(`User not found. Creating...`);
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });
        if (createError) {
            console.error('Error creating user:', createError);
            return;
        }
        user = data.user!;
    }

    if (!user) return;

    // 2. Ensure Role
    const { data: role } = await supabase.from('roles').select('id').eq('name', 'Administrador').single();
    if (!role) { console.error("Role Administrador missing!"); return; }

    // 3. Update Profile
    console.log(`Linking Profile to Org ${orgId}...`);
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();

    if (profile) {
        const { error: profError } = await supabase.from('profiles').update({
            role_id: role.id,
            role: 'admin',
            organization_id: orgId
        }).eq('id', profile.id);

        if (profError) console.error("Error updating profile:", profError);
        else console.log("Profile updated successfully.");
    } else {
        console.error("Profile not generated yet. Check triggers.");
    }
}

async function main() {
    // Restore Clinic Admin
    await restoreUser('wmelot@gmail.com', 'William Melo', '00000000-0000-0000-0000-000000000002');

    // Restore Master Admin
    await restoreUser('accessfisio@gmail.com', 'Super Admin', '00000000-0000-0000-0000-000000000001');
}

main();
