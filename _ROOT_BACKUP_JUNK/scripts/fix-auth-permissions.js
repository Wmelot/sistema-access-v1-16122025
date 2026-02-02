
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fixPermissions() {
    console.log('Attempting to fix Auth permissions via Direct Connection...');

    // Connect as POSTGRES (Superuser)
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const commands = [
            // 1. Ensure schema access
            "GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role, dashboard_user, supabase_auth_admin;",

            // 2. Grant table access to auth admin (used by GoTrue)
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;",
            "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;",
            "GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;",

            // 3. Keep service_role powerful
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO service_role;",
            "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO service_role;",

            // 4. Ensure postgres has access (for our debugging)
            "GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;",
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;",

            // 5. Fix ownership if drifted (optional, but safe)
            "ALTER ROLE supabase_auth_admin SET search_path = public, auth;",
            "ALTER ROLE postgres SET search_path = public, auth;"
        ];

        for (const sql of commands) {
            try {
                process.stdout.write(`Executing: ${sql.substring(0, 50)}... `);
                await client.query(sql);
                console.log('✅ OK');
            } catch (e) {
                console.log(`⚠️ Failed: ${e.message}`);
                // Don't stop, try others
            }
        }

        console.log('--- Permissions Update Complete ---');
        await client.end();

    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

fixPermissions();
