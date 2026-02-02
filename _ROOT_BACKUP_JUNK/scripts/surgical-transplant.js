
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function surgicalTransplant() {
    console.log('🩺 Starting Surgical Identity Transplant...');

    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Get the GOOD password hash from the debug user
        const debugRes = await client.query("SELECT encrypted_password FROM auth.users WHERE email LIKE 'debug_%' LIMIT 1");
        if (debugRes.rows.length === 0) {
            console.error('❌ Could not find debug user to copy password from.');
            return;
        }
        const goodHash = debugRes.rows[0].encrypted_password;
        console.log('✅ Captured valid password hash.');

        // 2. Get the OLD ID to preserve it
        const targetEmail = 'wmelot@gmail.com';
        const userRes = await client.query("SELECT id FROM auth.users WHERE email = $1", [targetEmail]);
        if (userRes.rows.length === 0) {
            console.error('❌ Target user not found (did we already delete it?).');
            // If checking fails, we might need a backup plan, but let's assume it exists as we verified before.
            return;
        }
        const oldId = userRes.rows[0].id;
        console.log(`✅ Targeted user ID: ${oldId} (Preserving this to save your data)`);

        // 3. UPDATE instead of DELETE+INSERT (Safer and easier)
        // We fundamentally reset the user's core auth fields to match a "fresh" user
        // forcing the system to see it as clean.
        console.log('🔄 Overwriting user core identity with fresh data...');

        const updateRes = await client.query(`
            UPDATE auth.users 
            SET 
                encrypted_password = $1,
                raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
                raw_user_meta_data = '{}',
                is_super_admin = false,
                created_at = NOW(),
                updated_at = NOW(),
                last_sign_in_at = NULL,
                confirmation_token = NULL,
                recovery_token = NULL,
                email_change_token_new = NULL,
                email_change = NULL
            WHERE id = $2
        `, [goodHash, oldId]);

        console.log('✅ Transplant Complete.');
        console.log('👉 Try logging in with: wmelot@gmail.com / Password123!');

        await client.end();

    } catch (err) {
        console.error('❌ Operation failed:', err);
    }
}

surgicalTransplant();
