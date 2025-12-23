const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Please provide a migration file path (e.g., node run_migration.js migration.sql)');
        process.exit(1);
    }

    const migrationFile = args[0];
    const filePath = path.resolve(process.cwd(), migrationFile);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Connecting to DB...`);
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log(`Running migration: ${migrationFile}`);
        await client.query(sql);

        // Reload schema just in case
        await client.query("NOTIFY pgrst, 'reload schema'");

        console.log('SUCCESS: Migration executed.');
    } catch (err) {
        console.error('ERROR performing migration:', err);
    } finally {
        await client.end();
    }
}

run();
