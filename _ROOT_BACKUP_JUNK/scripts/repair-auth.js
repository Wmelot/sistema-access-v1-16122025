
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function repairAuth() {
    console.log('🚑 Starting Emergency Repairs on Auth Schema...');

    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const queries = [
            // Ensure auth schema is accessible
            "GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;",

            // Critical: Give supabase_auth_admin full reign over auth schema
            // This role is used by the Auth API/GoTrue
            "GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;",
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;",
            "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;",
            "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;",

            // Ensure postgres (us) can debug
            "GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;",
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;",

            // Grant access to public schema for profile creation triggers
            "GRANT USAGE ON SCHEMA public TO supabase_auth_admin;",
            "GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;",

            // Fix sequences often broken after restores
            "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO postgres, dashboard_user, service_role;",

            // Attempt to set search_path for the transaction to test visibility
            "SET search_path TO auth, public;"
        ];

        for (const sql of queries) {
            try {
                process.stdout.write(`Executing: ${sql} ... `);
                await client.query(sql);
                console.log('✅');
            } catch (e) {
                console.log(`❌ ${e.message}`);
            }
        }

        console.log('🚑 Repair Script Finished.');
        await client.end();
    } catch (err) {
        console.error('Fatal connection error:', err);
    }
}

repairAuth();
