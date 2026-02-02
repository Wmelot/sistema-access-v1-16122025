import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260111190000_add_trial_ends_at.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration:', migrationPath);

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
