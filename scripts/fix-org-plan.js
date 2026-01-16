
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

async function fixOrganizationsSchema() {
    console.log('🏢 FIXING ORGANIZATIONS SCHEMA...');
    const client = new Client(config);
    try {
        await client.connect();

        // Add 'plan' column if missing
        await client.query(`
            ALTER TABLE organizations 
            ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
        `);
        console.log('✅ Added "plan" column to organizations.');

        // Add 'status' column if missing (it was in the list, but verifying default)
        await client.query(`
            ALTER TABLE organizations 
            ALTER COLUMN status SET DEFAULT 'active';
        `);
        console.log('✅ Ensured "status" default.');

        // RELOAD CACHE
        console.log('🔄 Reloading Supabase Schema Cache...');
        await client.query("NOTIFY pgrst, 'reload config';");

        console.log('✨ ORGANIZATIONS FIXED ✨');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixOrganizationsSchema();
