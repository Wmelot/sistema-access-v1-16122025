const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    console.log('Connecting to DB to create financial_payables...');
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env.local');
        return;
    }
    const client = new Client({ connectionString });

    try {
        await client.connect();

        // Read SQL
        const sqlPath = path.join(__dirname, 'fix_create_financial_payables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);
        console.log('✅ Table created successfully.');

        // Force Cache Reload
        console.log('Reloading PostgREST schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema'");

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
