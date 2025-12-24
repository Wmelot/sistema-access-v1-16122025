
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected.');

        const sql = fs.readFileSync(path.join(__dirname, 'migration_fix_transactions_constraints.sql'), 'utf8');
        console.log('Running SQL...');
        await client.query(sql);
        console.log('Migration applied successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();

