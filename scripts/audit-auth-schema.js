
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

async function audit() {
    console.log('Auditing Auth Schema...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. List Tables
        console.log('\n--- 1. Tables in auth schema ---');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'auth';
        `);
        const tables = res.rows.map(r => r.table_name);
        console.log('Tables:', tables.join(', '));

        const required = ['users', 'refresh_tokens', 'sessions', 'identities', 'instances', 'audit_log_entries'];
        const missing = required.filter(t => !tables.includes(t));

        if (missing.length > 0) {
            console.error('❌ CRITICAL: Missing tables:', missing.join(', '));
        } else {
            console.log('✅ Core tables present.');
        }

        // 2. Check Permissions on auth.sessions
        console.log('\n--- 2. Permissions on auth.sessions ---');
        // This is harder to query directly via information_schema properly for roles usage, 
        // but we can try to Select from it as postgres (should work).
        await client.query('SELECT count(*) FROM auth.sessions');
        console.log('✅ Select on auth.sessions worked for postgres.');

        // 3. Check for Triggers on auth.sessions
        console.log('\n--- 3. Triggers on auth.sessions ---');
        const trigRes = await client.query(`
            SELECT trigger_name, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_schema = 'auth' AND event_object_table = 'sessions';
        `);
        if (trigRes.rowCount > 0) {
            console.log('Triggers found:', trigRes.rows.map(t => t.trigger_name).join(', '));
        } else {
            console.log('No triggers on auth.sessions.');
        }

    } catch (err) {
        console.error('❌ Audit Error:', err.message);
    } finally {
        await client.end();
    }
}

audit();
