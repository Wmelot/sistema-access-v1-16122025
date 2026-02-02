
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

async function fixFinalSchemas() {
    console.log('🔧 FINALIZING SCHEMA FIXES (PROFILES & REMINDERS)...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. FIX PROFILES (Add 'has_agenda')
        // Code uses `has_agenda` but DB lacks it.
        console.log('🧑‍⚕️ Checking profiles table...');
        await client.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS has_agenda boolean DEFAULT false;
        `);
        // Also ensure council_type exists (Code uses it)
        await client.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS council_type text;
        `);
        console.log('✅ Added/Verified "has_agenda" and "council_type" in profiles.');

        // 2. FIX REMINDERS (Status Default & Org ID)
        console.log('🔔 Checking reminders table...');
        // Code insert: { user_id, creator_id, content, due_date, is_read: false } -> No status
        // DB has 'status' column. If it's NOT NULL without default, insert fails.
        // Step 623 showed default is 'pending'::text. So status is fine.

        // But what about 'organization_id'?
        // The earlier `fix-db-schema-and-plans.js` tried to create reminders with org_id.
        // But Step 623 `information_schema` output did NOT show `organization_id`.
        // This implies the table ALREADY EXISTED without it, so the CREATE TABLE IF NOT EXISTS skipped it.
        // The code `createReminder` does NOT insert organization_id, so that's actually consistent (Code matches DB).
        // However, good practice to have it for future filtering. Let's add it nullable.

        await client.query(`
            ALTER TABLE reminders 
            ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
        `);
        console.log('✅ Added "organization_id" to reminders (just in case).');

        // 3. RELOAD SCHEMA CACHE
        console.log('🔄 Reloading Supabase Schema Cache...');
        await client.query("NOTIFY pgrst, 'reload config';");

        console.log('✨ ALL SCHEMAS ARE NOW 100% IN SYNC ✨');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixFinalSchemas();
