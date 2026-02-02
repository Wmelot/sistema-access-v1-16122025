
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function disableTrigger() {
    console.log('🔌 Disabling Auth Trigger to restore Access...');

    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Drop the trigger safely
        const sql = `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`;

        console.log(`Executing: ${sql}`);
        await client.query(sql);

        console.log('✅ Trigger disabled successfully.');
        console.log('👉 Please try logging in now!');

        await client.end();
    } catch (err) {
        console.error('❌ Failed to disable trigger:', err.message);
    }
}

disableTrigger();
