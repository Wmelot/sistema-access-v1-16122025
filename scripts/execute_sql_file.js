const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    const filename = process.argv[2];
    if (!filename) {
        console.error('Please provide a SQL file path');
        process.exit(1);
    }

    const filePath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');

    console.log(`Connecting to DB...`);
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log(`Executing SQL from ${filename}...`);

        const res = await client.query(sqlContent);

        if (res.rows && res.rows.length > 0) {
            console.log('Query Results:', JSON.stringify(res.rows, null, 2));
        }

        console.log('SUCCESS: SQL executed successfully.');
    } catch (err) {
        console.error('ERROR performing DB operations:', err);
    } finally {
        await client.end();
    }
}

run();
