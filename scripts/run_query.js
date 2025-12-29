const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const filePath = process.argv[2];

if (!filePath) {
    console.error('Usage: node run_query.js <path_to_sql_file>');
    process.exit(1);
}

async function run() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    console.log('Using connection string:', connectionString);

    // Remove SSL enforcement for local dev (if URL is localhost)
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const client = new Client({
        connectionString,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sql = fs.readFileSync(filePath, 'utf8');

        // Split by semicolon to run multiple queries if needed, but pg usually runs all.
        // However, allow multi-statement? Simple query for now.
        const res = await client.query(sql);

        if (Array.isArray(res)) {
            res.forEach((r, i) => {
                console.log(`--- Result ${i + 1} ---`);
                console.table(r.rows);
            });
        } else {
            console.table(res.rows);
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

run();
