import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a PostgreSQL client using the connection string
import pkg from 'pg';
const { Client } = pkg;

async function runMigration() {
    console.log("🔧 Running permissions migration...")

    // Extract connection details from Supabase URL
    const dbUrl = process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${supabaseUrl.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    })

    try {
        await client.connect()
        console.log("✅ Connected to database")

        // Read and execute migration
        console.log("\n📝 Executing migration...")
        const migration = readFileSync('migrations/20260119_create_permissions.sql', 'utf-8')
        await client.query(migration)
        console.log("✅ Migration successful!")

        // Read and execute seed
        console.log("\n🌱 Seeding permissions...")
        const seed = readFileSync('seeds/permissions_seed.sql', 'utf-8')
        await client.query(seed)
        console.log("✅ Seed successful!")

        // Verify
        console.log("\n📊 Verification:")
        const result = await client.query(`
            SELECT 
                r.name as role,
                COUNT(*) as total_permissions,
                SUM(CASE WHEN p.granted THEN 1 ELSE 0 END) as granted_permissions
            FROM permissions p
            JOIN roles r ON r.id = p.role_id
            GROUP BY r.name
            ORDER BY r.name
        `)

        console.table(result.rows)
        console.log(`\n✅ Total: ${result.rows.reduce((sum, r) => sum + parseInt(r.total_permissions), 0)} permissions created`)

    } catch (error: any) {
        console.error("❌ Error:", error.message)
        if (error.detail) console.error("Details:", error.detail)
    } finally {
        await client.end()
    }
}

runMigration()
