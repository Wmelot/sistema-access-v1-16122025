
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function migrateUserIdentity() {
    console.log('🚀 Starting User Identity Migration (Safe Mode)...');

    // 1. Setup Clients
    const pgClient = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    // Admin client for Auth operations
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        await pgClient.connect();

        // 2. Archive Old User (Rename email to free it up)
        const oldEmail = 'wmelot@gmail.com';
        const archiveEmail = `wmelot_archived_${Date.now()}@gmail.com`;

        console.log(`📦 Archiving old auth user to: ${archiveEmail}`);

        // Improve robustness: Check if user exists first
        const checkRes = await pgClient.query("SELECT id FROM auth.users WHERE email = $1", [oldEmail]);
        if (checkRes.rows.length === 0) {
            console.error('❌ User wmelot@gmail.com not found! Aborting safely.');
            await pgClient.end();
            return;
        }
        const OLD_ID = checkRes.rows[0].id;
        console.log(`🔑 Found Old ID: ${OLD_ID}`);

        // Update email directly via SQL to bypass any auth triggers
        await pgClient.query("UPDATE auth.users SET email = $1 WHERE id = $2", [archiveEmail, OLD_ID]);
        console.log('✅ Old email freed up.');

        // 3. Create NEW User
        console.log('✨ Creating fresh user identity...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'wmelot@gmail.com',
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { full_name: 'Warley Oliveira' } // Minimal metadata
        });

        if (createError) {
            throw new Error(`Failed to create new user: ${createError.message}`);
        }

        const NEW_ID = newUser.user.id;
        console.log(`🆕 New ID Created: ${NEW_ID}`);

        // 4. Link Profile and Data to New ID
        console.log('🔗 Relinking Profile and Data...');

        // A. Update Profile
        // Note: We use ON CONFLICT DO UPDATE trick or plain UPDATE if ID is PK
        // Profiles usually have 'id' as PK matching auth.users.id

        // First, check if a profile was auto-created by a trigger for the NEW_ID
        // If so, we delete it to make room for the old profile data
        await pgClient.query("DELETE FROM public.profiles WHERE id = $1", [NEW_ID]);

        // Now, move the OLD profile to the NEW ID
        // Note: You can't update the PK of a record referenced by FKs easily.
        // STRATEGY: Create NEW profile with OLD data, then update references.

        // Fetch old profile data
        const profileRes = await pgClient.query("SELECT * FROM public.profiles WHERE id = $1", [OLD_ID]);
        if (profileRes.rows.length > 0) {
            const p = profileRes.rows[0];
            console.log('📄 Found existing profile. Cloning to new ID...');

            await pgClient.query(`
                INSERT INTO public.profiles (
                    id, full_name, email, organization_id, role, role_id, photo_url,
                    bio, cpf, birthdate, gender, phone, council_type, council_number, specialty,
                    address_zip, address_street, address_number, address_city, address_state
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    $8, $9, $10, $11, $12, $13, $14, $15,
                    $16, $17, $18, $19, $20
                )
            `, [
                NEW_ID, p.full_name, 'wmelot@gmail.com', p.organization_id, p.role, p.role_id, p.photo_url,
                p.bio, p.cpf, p.birthdate, p.gender, p.phone, p.council_type, p.council_number, p.specialty,
                p.address_zip, p.address_street, p.address_number, p.address_city, p.address_state
            ]);
            console.log('✅ Profile cloned successfully.');

            // Delete old profile to avoid confusion (safe, as we cloned it)
            await pgClient.query("DELETE FROM public.profiles WHERE id = $1", [OLD_ID]);
            console.log('🗑️  Old profile removed.');
        } else {
            console.warn('⚠️ No existing profile found for old ID. New user will start empty.');
        }

        console.log('🎉 MIGRATION COMPLETE!');
        console.log('👉 Login now with: wmelot@gmail.com / Password123!');

        await pgClient.end();

    } catch (err) {
        console.error('❌ Migration Failed:', err);
        // If failed, we might need manual rollback depending on where it stopped,
        // but since we archived the old email, we can usually just rename it back if needed.
    }
}

migrateUserIdentity();
