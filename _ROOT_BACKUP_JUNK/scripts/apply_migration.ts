import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function applyMigration() {
    console.log('Connecting to database...');

    // Try ports 5432 and 54322
    const ports = [5432, 54322];
    let client: Client | null = null;

    for (const port of ports) {
        try {
            const connectionString = process.env.DATABASE_URL
                ? process.env.DATABASE_URL.replace(/:(\d+)\//, `:${port}/`) // Hacky replace if port exists
                : `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;

            console.log(`Trying port ${port}...`);
            const c = new Client({ connectionString });
            await c.connect();
            client = c;
            console.log(`Connected on port ${port}`);
            break;
        } catch (e) {
            console.log(`Failed port ${port}`);
        }
    }

    if (!client) {
        console.error("Could not connect to database.");
        return;
    }

    try {
        const sql = fs.readFileSync('migration_patients_address.sql', 'utf8');
        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
