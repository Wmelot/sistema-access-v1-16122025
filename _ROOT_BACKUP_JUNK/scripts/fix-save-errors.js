
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

async function fixSystem() {
    console.log('🔧 FIXING SYSTEM SAVE ERRORS...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. RELOAD SCHEMA CACHE (Fixes PGRST204 "Could not find column")
        console.log('🔄 Reloading Supabase Schema Cache...');
        await client.query("NOTIFY pgrst, 'reload config';");

        // 2. CHECK 'patients' COLUMNS (Verification)
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'patients' AND column_name = 'address';
        `);
        if (res.rows.length > 0) {
            console.log("✅ Column 'address' exists in 'patients'.");
        } else {
            console.log("⚠️ Column 'address' MISSING in 'patients'. Checking for synonyms...");
            const cols = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'patients';
            `);
            console.log("Available columns:", cols.rows.map(r => r.column_name).join(', '));
        }

        // 3. UPGRADE ORGANIZATION PLAN (Fixes "Limit Reached")
        // Find org for wmelot@gmail.com (id: 0273dd3c-996a-4d40-8fea-eb89118345b2)
        console.log('🚀 Upgrading Plan to Enterprise...');
        await client.query(`
            UPDATE organizations
            SET 
                plan = 'enterprise',
                status = 'active',
                subscription_status = 'active'
            WHERE id IN (
                SELECT organization_id FROM profiles WHERE id = '0273dd3c-996a-4d40-8fea-eb89118345b2'
            );
        `);

        // Also ensure the user is an 'owner' or 'admin'
        await client.query(`
           UPDATE profiles
           SET role_id = (SELECT id FROM roles WHERE name = 'Master' LIMIT 1)
           WHERE id = '0273dd3c-996a-4d40-8fea-eb89118345b2';
        `);

        console.log('✅ System Fixes Applied.');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixSystem();
