
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testConnection(connectionString, label) {
    if (!connectionString) {
        console.log(`❌ ${label}: Missing connection string`);
        return;
    }

    console.log(`Testing ${label}...`);
    // Mask password in log
    const masked = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log(`URL: ${masked}`);

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
    });

    try {
        await client.connect();
        const res = await client.query('SELECT 1 as connected');
        console.log(`✅ ${label}: Connection successful! Result:`, res.rows[0]);
        await client.end();
    } catch (err) {
        console.error(`❌ ${label}: Connection failed`);
        console.error(err.message);
        if (err.code) console.error('Code:', err.code);
    }
}

async function main() {
    await testConnection(process.env.DATABASE_URL, 'Transaction Pooler (DATABASE_URL)');
    console.log('---');
    await testConnection(process.env.DIRECT_URL, 'Direct Connection (DIRECT_URL)');
}

main();
