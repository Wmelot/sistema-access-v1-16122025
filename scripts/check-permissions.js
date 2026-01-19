
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkPermissions() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('Checking permissions for current user...');
        const res = await client.query("SELECT current_user, current_database()");
        console.log('Connected as:', res.rows[0]);

        console.log('Checking access to auth schema...');
        const schemaRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'");
        if (schemaRes.rows.length > 0) {
            console.log('✅ Auth schema exists.');
        } else {
            console.error('❌ Auth schema MISSING!');
        }

        console.log('Checking ability to select from auth.users...');
        try {
            await client.query("SELECT count(*) FROM auth.users");
            console.log('✅ Can select from auth.users');
        } catch (e) {
            console.error('❌ Cannot select from auth.users:', e.message);
        }

        console.log('Checking grants on auth schema...');
        const grants = await client.query(`
            SELECT grantee, privilege_type 
            FROM information_schema.role_usage_grants 
            WHERE object_schema = 'auth'
         `);
        // Note: this view might not show everything depending on permissions, but let's see.

        await client.end();
    } catch (err) {
        console.error('❌ Script failed:', err);
    }
}

checkPermissions();
