
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

async function fixTransactionsSchema() {
    console.log('💰 FIXING TRANSACTIONS SCHEMA...');
    const client = new Client(config);
    try {
        await client.connect();

        // Add columns referenced in PayablesTab code
        await client.query(`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS installments text,
            ADD COLUMN IF NOT EXISTS is_variable_value boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS pending_value_resolution boolean DEFAULT false;
        `);
        console.log('✅ Added installments, is_variable_value, pending_value_resolution to transactions.');

        // RELOAD CACHE
        console.log('🔄 Reloading Supabase Schema Cache...');
        await client.query("NOTIFY pgrst, 'reload config';");

        console.log('✨ TRANSACTIONS SCHEMA FIXED ✨');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixTransactionsSchema();
