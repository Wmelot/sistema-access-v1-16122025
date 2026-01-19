
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkTriggers() {
    console.log('Checking triggers on auth.users...');

    // Connect as POSTGRES
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const sql = `
            SELECT 
                trigger_name,
                event_manipulation,
                action_statement
            FROM information_schema.triggers 
            WHERE event_object_schema = 'auth' 
            AND event_object_table = 'users';
        `;

        const res = await client.query(sql);

        console.log(`Found ${res.rowCount} triggers:`);
        res.rows.forEach(t => {
            console.log(`- ${t.trigger_name} (${t.event_manipulation})`);
            // console.log(t.action_statement);
        });

        await client.end();
    } catch (err) {
        console.error('❌ Check failed:', err);
    }
}

checkTriggers();
