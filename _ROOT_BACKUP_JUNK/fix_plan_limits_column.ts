import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

async function applyMissingColumn() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) {
        console.error("DATABASE_URL not found");
        return;
    }

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        console.log("Checking columns in plan_configs...");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'plan_configs';
        `);
        console.log("Existing columns:", res.rows.map(r => r.column_name));

        const hasMax = res.rows.some(r => r.column_name === 'max_professionals');

        if (!hasMax) {
            console.log("Column 'max_professionals' missing. Adding it now...");
            await client.query(`
                ALTER TABLE public.plan_configs 
                ADD COLUMN IF NOT EXISTS max_professionals INTEGER NOT NULL DEFAULT 1;
            `);
            console.log("Column added.");

            // Update Defaults
            await client.query(`UPDATE public.plan_configs SET max_professionals = 1 WHERE slug = 'free' OR slug = 'basic';`);
            await client.query(`UPDATE public.plan_configs SET max_professionals = 5 WHERE slug = 'clinic' OR slug = 'professional';`);
            await client.query(`UPDATE public.plan_configs SET max_professionals = 999 WHERE slug = 'enterprise' OR slug = 'prime';`);
            console.log("Defaults updated.");
        } else {
            console.log("Column already exists.");
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

applyMissingColumn();
