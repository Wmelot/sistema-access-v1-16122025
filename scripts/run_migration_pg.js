
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
    // Supabase uses port 6543 for transaction pooler or 5432 for direct.
    // Env usually has POSTGRES_URL or similar.
    // If not, we construct from SUPABASE_DB_URL if available, or ask user?
    // Let's rely on standard env vars often provided by Supabase in .env.local 
    // Usually: DATABASE_URL="postgres://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres"

    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error("No DATABASE_URL or POSTGRES_URL found in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase usually
    });

    try {
        await client.connect();
        console.log("Connected to DB.");

        const sqlPath = path.join(process.cwd(), 'migration_evolution_feature.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log("Migration executed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();
