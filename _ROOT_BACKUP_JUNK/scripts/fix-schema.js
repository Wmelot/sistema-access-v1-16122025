
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fix() {
    console.log('Connecting to DB to reload PostgREST config...');

    // Use DIRECT connection (5432) ideally for administrative commands if possible
    // But let's try with the current DATABASE_URL first.
    // Actually, let's force 5432 just to be safe and bypass pooler weirdness for this command.
    let connectionString = process.env.DATABASE_URL || '';
    if (connectionString.includes(':6543')) {
        console.log('Switching from 6543 to 5432 for admin command...');
        connectionString = connectionString.replace(':6543', ':5432');
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected. Sending NOTIFY pgrst, "reload config"...');
        await client.query("NOTIFY pgrst, 'reload config';");
        console.log('✅ Success! PostgREST Schema Cache Reloaded.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fix();
