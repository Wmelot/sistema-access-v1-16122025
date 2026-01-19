
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// We need SERVICE_ROLE_KEY to bypass security and update password directly
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function reset() {
    console.log('Resetting password for wmelot@gmail.com ...');

    const { data: user, error } = await supabase.auth.admin.updateUserById(
        '0273dd3c-996a-4d40-8fea-eb89118345b2', // Your ID
        { password: 'Wmelo@123' }
    );

    // If ID fails (maybe user was recreated with new ID), try by email logic finding first?
    // Actually direct updateUserById is best if we know ID.
    // If not, let's allow finding user by email first.

    if (error) {
        console.log('Could not update by ID (maybe ID changed?), trying by email search...');

        // List users to find ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const targetUser = users.find(u => u.email === 'wmelot@gmail.com');

        if (targetUser) {
            console.log(`Found user ID: ${targetUser.id}. Updating...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                targetUser.id,
                { password: 'Wmelo@123' }
            );
            if (updateError) {
                console.error('❌ Update Error:', updateError);
            } else {
                console.log('✅ Password updated successfully via User ID discovery!');
            }
        } else {
            console.error('❌ User wmelot@gmail.com not found.');
        }
    } else {
        console.log('✅ Password updated successfully!');
    }
}

reset();
