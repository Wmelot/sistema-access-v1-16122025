import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
    console.log("🔧 Adding granular permissions columns...")

    try {
        // Read migration SQL
        const sql = readFileSync('migrations/20260119_add_granular_permissions.sql', 'utf-8')

        console.log("\n📝 SQL to execute:")
        console.log(sql)

        console.log("\n⚠️  Please execute this SQL manually in Supabase SQL Editor:")
        console.log("   1. Go to your Supabase Dashboard")
        console.log("   2. Navigate to SQL Editor")
        console.log("   3. Copy and paste the SQL above")
        console.log("   4. Click 'Run'")
        console.log("\n   Then run: npx tsx scripts/seed-permissions-simple.ts")

    } catch (error: any) {
        console.error("❌ Error:", error.message)
    }
}

migrate()
