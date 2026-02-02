import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260111183000_add_org_status.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');

    // We can't execute multi-statement SQL via standard postgrest client usually unless we have a specific function or direct connection.
    // However, for this environment, I'll try to use the raw SQL via a custom RPC if available, or just instruct the user.
    // Actually, I can use the 'pg' library to connect directly if DATABASE_URL is available.

    const { Client } = require('pg');
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!dbUrl) {
        console.error("DATABASE_URL not found. Cannot apply migration automatically.");
        return;
    }

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        await client.query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
