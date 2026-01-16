
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

async function fixAuthAdmin() {
    console.log('Fixing supabase_auth_admin Role...');
    const client = new Client(config);
    try {
        await client.connect();

        const query = `
            -- Fix search_path for the internal GoTrue user (MIGHT FAIL if not superuser)
            -- ALTER ROLE supabase_auth_admin SET search_path = "$user", public, auth, extensions;
            
            -- Grant explicit permissions on schemas (Should work if I own the schema or am sufficiently privileged)
            GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

            GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
            GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;
            
            -- Also ensure it can access pg_sodium if it ever comes back, or extensions
            GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;
        `;

        await client.query(query);
        console.log('✅ supabase_auth_admin updated successfully.');

    } catch (err) {
        console.error('❌ Error fixing auth admin:', err.message);
    } finally {
        await client.end();
    }
}

fixAuthAdmin();
