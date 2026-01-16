const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Force IPv4 First
try {
    const dns = require('dns');
    if (dns && typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
        console.log('Force IPv4 First applied');
    }
} catch (e) { }

// Supabase local default info or from envs
const connectionString = process.env.DATABASE_URL;

async function run() {
    if (!process.argv[2]) {
        console.error('Usage: node scripts/run_file.js <path_to_sql_file>');
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), process.argv[2]);
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log('Connecting to DB...');
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log('Executing SQL...');
        await client.query(sql);
        console.log('SUCCESS: SQL executed successfully.');
    } catch (err) {
        console.error('ERROR executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
