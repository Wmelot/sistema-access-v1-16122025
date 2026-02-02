
import { createAdminClient } from '../src/lib/supabase/admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function resetPassword() {
    const email = 'wmelot@gmail.com';
    const newPassword = 'Wmelo@123';

    console.log(`Attempting to reset password for ${email}...`);

    try {
        const supabase = createAdminClient();

        // 1. Get User ID first to confirm existence
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
        }

        const user = users.find(u => u.email === email);
        if (!user) {
            throw new Error(`User ${email} not found!`);
        }

        console.log(`User found (ID: ${user.id}). Updating password...`);

        // 2. Update Password
        const { data, error } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (error) {
            console.error('❌ Error resetting password:', error.message);
        } else {
            console.log('✅ Password successfully reset to:', newPassword);
            console.log('   User:', data.user.email);
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

resetPassword();
