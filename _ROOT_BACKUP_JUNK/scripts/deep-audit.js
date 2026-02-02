
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

async function deepAudit() {
    console.log('Deep Audit of System Catalogs...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Check pg_trigger for auth.users
        console.log('\n--- 1. Rel triggers on auth.users ---');
        // relid is the oid of the table
        const res = await client.query(`
            SELECT tgname, tgenabled, tgtype 
            FROM pg_trigger
            WHERE tgrelid = 'auth.users'::regclass;
        `);

        if (res.rowCount === 0) {
            console.log('No triggers on auth.users (Confirmed via pg_trigger).');
        } else {
            console.log('Triggers found:', res.rows.map(r => `${r.tgname} (enabled: ${r.tgenabled})`).join(', '));
        }

        // 2. Check handle_new_user function
        console.log('\n--- 2. Check handle_new_user function ---');
        const funcRes = await client.query(`
            SELECT proname, nspname 
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE proname = 'handle_new_user';
        `);

        if (funcRes.rowCount === 0) {
            console.log('Function handle_new_user does NOT exist.');
        } else {
            console.log('Function handle_new_user EXISTS in schema:', funcRes.rows[0].nspname);
        }

        // 3. Check for specific interfering extensions triggers
        // pg_sodium often adds triggers? No, usually not on auth.users. 

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

deepAudit();
