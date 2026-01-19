
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function debugAuthSchema() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Check OWNER of auth.users
    const res = await client.query(`
        SELECT schemaname, tablename, tableowner 
        FROM pg_tables 
        WHERE schemaname = 'auth' AND tablename = 'users'
    `);
    console.log('Owner of auth.users:', res.rows[0]);

    // Check if supabase_auth_admin can SELECT (Mock check by checking grants)
    const grants = await client.query(`
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_schema = 'auth' 
          AND table_name = 'users'
          AND grantee = 'supabase_auth_admin'
    `);
    console.log('Grants for supabase_auth_admin on auth.users:');
    console.table(grants.rows);

    await client.end();
}

debugAuthSchema();
