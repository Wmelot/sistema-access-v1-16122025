
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findUser() {
    console.log('Connecting to DB directly to find user ID...');

    // Force 5432 for admin content access if possible, or use 6543
    let connectionString = process.env.DATABASE_URL;

    // Auth users table is in schema 'auth'.
    // We need to verify if we have permission to read it. usually postgres user has.

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected. Querying auth.users...');
        const res = await client.query("SELECT id, email, encrypted_password FROM auth.users WHERE email = 'wmelot@gmail.com'");

        if (res.rows.length > 0) {
            console.log('✅ FOUND USER!');
            console.log('ID:', res.rows[0].id);
            console.log('Email:', res.rows[0].email);

            // Now calling update password script logic directly here
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            console.log('Attempting password reset via Admin API with found ID...');
            const { error } = await supabase.auth.admin.updateUserById(
                res.rows[0].id,
                { password: 'Wmelo@123' }
            );

            if (error) {
                console.error('❌ Reset failed:', error);
                // Fallback: Update directly in SQL (DANGEROUS but effective if API is broken)
                // But password hashing is complex (bcrypt). Better to use API.
            } else {
                console.log('✅✅ PASSWORD RESET SUCCESSFUL! New password: Wmelo@123');
            }

        } else {
            console.log('❌ User wmelot@gmail.com NOT found in auth.users table.');
        }

    } catch (err) {
        console.error('❌ SQL Error:', err);
    } finally {
        await client.end();
    }
}

findUser();
