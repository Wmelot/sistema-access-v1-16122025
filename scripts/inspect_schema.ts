import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectSchema() {
    console.log('Connecting to database...');
    // Use DATABASE_URL from .env.local (Transaction Mode for PgBouncer/Supabase)
    // Adjust connection string if needed for direct connection (Session Mode)
    // Usually port 5432 is Transaction, 6543 (or 5432 with ?pgbouncer=true implicit)

    // For local dev, maybe hardcoded if env missing
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();

        console.log('Inspecting "patients" table schema...');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'patients'
            ORDER BY ordinal_position;
        `);

        if (res.rows.length === 0) {
            console.log('Table "patients" not found or has no columns.');
        } else {
            console.log('Columns found:');
            res.rows.forEach(row => {
                console.log(`- ${row.column_name} (${row.data_type})`);
            });
        }

    } catch (err) {
        console.error('Error inspecting schema:', err);
    } finally {
        await client.end();
    }
}

inspectSchema();
