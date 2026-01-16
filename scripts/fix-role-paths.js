
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

async function fixPaths() {
    console.log('Connecting to DB to fix Role Search Paths...');
    const client = new Client(config);
    try {
        await client.connect();

        console.log('Altering roles search_path...');
        // Ensure auth schema is visible to roles that might need it internally, or at least public
        const query = `
            ALTER ROLE postgres SET search_path = "$user", public, auth, extensions;
            ALTER ROLE service_role SET search_path = "$user", public, auth, extensions;
            ALTER ROLE authenticated SET search_path = "$user", public, auth, extensions;
            ALTER ROLE anon SET search_path = "$user", public, auth, extensions;
            
            -- Grant explicit auth access to service_role (GoTrue often uses this)
            GRANT USAGE ON SCHEMA auth TO service_role, postgres;
            GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role, postgres;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role, postgres;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role, postgres;

            -- Drop potential interfering trigger on profiles
            DROP TRIGGER IF EXISTS ensure_profile_org ON public.profiles;
        `;

        await client.query(query);
        console.log('✅ Roles updated and Profile trigger dropped.');

    } catch (err) {
        console.error('❌ Error fixing roles:', err.message);
    } finally {
        await client.end();
    }
}

fixPaths();
