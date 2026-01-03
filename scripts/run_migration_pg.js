
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env parameters manually to ensure we get them
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync('.env.local')) {
    try {
        const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
        connectionString = envConfig.DATABASE_URL || envConfig.POSTGRES_URL || envConfig.POSTGRES_URL_NON_POOLING;
        console.log("Loaded connection string from .env.local");
    } catch (e) {
        console.error("Failed to parse .env.local", e);
    }
}

// Fallback
if (!connectionString) {
    connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    console.log("Using default fallback connection string.");
}

async function run() {
    // Check for file argument
    const migrationFile = process.argv[2];
    if (!migrationFile) {
        console.error("Usage: node scripts/run_migration_pg.js <path_to_sql_file>");
        process.exit(1);
    }

    // Mask password for logging
    const masked = connectionString.includes('@') ?
        connectionString.replace(/:([^:@]+)@/, ':****@') : 'Hidden';
    console.log(`Connecting to DB... (${masked})`);

    const client = new Client({
        connectionString: connectionString,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to DB.");

        const sqlPath = path.resolve(process.cwd(), migrationFile);
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`File not found: ${sqlPath}`);
        }

        console.log(`Reading migration file: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing SQL...");
        await client.query(sql);
        console.log("Migration executed successfully.");

    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
