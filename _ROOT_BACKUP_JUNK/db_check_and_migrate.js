const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const connectionString = process.env.DATABASE_URL || envConfig.DATABASE_URL || envConfig.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
    console.error("Could not find DATABASE_URL in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function run() {
    try {
        await client.connect();

        console.log("Connected to DB. Checking constraints for 'appointments'...");

        // Check constraints
        const res = await client.query(`
            SELECT conname as constraint_name, pg_get_constraintdef(c.oid) as definition
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            JOIN pg_class t ON t.oid = c.conrelid
            WHERE t.relname = 'appointments' AND c.contype = 'c';
        `);

        console.log("Constraints found:", res.rows);

        // Check columns and types
        const cols = await client.query(`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'appointments' AND column_name = 'status';
        `);
        console.log("Status column info:", cols.rows);

        // Apply Report Templates Migration directly if needed
        console.log("Reading migration_report_templates.sql...");
        const migrationSql = fs.readFileSync('migration_report_templates.sql', 'utf8');
        await client.query(migrationSql);
        console.log("Applied migration_report_templates.sql successfully.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
