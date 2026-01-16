
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

async function fix() {
    console.log('Connecting to DB to fix Auth Schema...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Drop common problematic triggers
        console.log('Dropping potential triggers...');
        await client.query(`
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
            -- Also try dropping generic ones that might have been added
            DROP TRIGGER IF EXISTS on_user_created ON auth.users;
        `);

        // 2. Grant Permissions (crucial for "error querying schema")
        console.log('Granting permissions...');
        await client.query(`
            GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
            
            -- Grant usage on auth schema too just in case
            GRANT USAGE ON SCHEMA auth TO postgres, service_role;
        `);

        console.log('✅ Fix applied: Triggers dropped & Permissions granted.');

    } catch (err) {
        console.error('❌ Error fixing auth schema:', err.message);
    } finally {
        await client.end();
    }
}

fix();
