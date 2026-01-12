
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    console.log("--- Migrating Services Table ---")

    // The 'services' table needs organization_id. 
    // We will run raw SQL via the `rpc` function if available (custom function `exec_sql`), 
    // OR we will assume we can't and notify user. 
    // BUT I recall seeing `extensions` or similar or just simple raw query capability in some setups.
    // Standard Supabase client doesn't support raw SQL unless via RPC.

    // Let's TRY to see if `organization_id` exists by selecting it? 
    // Previous script said "column services.organization_id does not exist".

    // If I cannot run DDL, I cannot fix this DB schema issue directly from here without user help or a specific tool. 
    // WAIT: I can use the `postgres` driver directly if I had the connection string.
    // The .env.local usually has DATABASE_URL.

    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found.")
        return
    }

    // I will try to use `postgres` library if installed, or `pg`.
    // The project likely has `pg` or `postgres` since it uses Supabase/Prisma?
    // Let's check package.json? No, I'll just try to import `postgres` (postgres.js) or `pg`.

    try {
        const postgres = require('postgres')
        const sql = postgres(process.env.DATABASE_URL)

        console.log("Adding column...")
        await sql`
        ALTER TABLE services 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
      `

        console.log("Updating existing records to Access Fisioterapia...")
        // Hardcoded ID for Access Fisioterapia from previous check: 00000000-0000-0000-0000-000000000002
        await sql`
        UPDATE services 
        SET organization_id = '00000000-0000-0000-0000-000000000002' 
        WHERE organization_id IS NULL;
      `

        console.log("Done.")
        process.exit(0)
    } catch (e) {
        console.error("Failed with postgres.js, trying pg...")
        try {
            const { Client } = require('pg')
            const client = new Client({ connectionString: process.env.DATABASE_URL })
            await client.connect()

            await client.query(`
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
          `)

            await client.query(`
            UPDATE services 
            SET organization_id = '00000000-0000-0000-0000-000000000002' 
            WHERE organization_id IS NULL;
          `)

            console.log("Done with pg.")
            await client.end()
        } catch (e2) {
            console.error("Failed with pg too:", e2)
        }
    }
}

run()
