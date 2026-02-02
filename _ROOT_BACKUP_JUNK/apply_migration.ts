
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

dotenv.config({ path: '.env.local' })

async function applyMigration() {
    console.log('🔌 Connecting to database...')

    // Parse the connection string from .env.local
    // FORCE DIRECT CONNECTION (Session Mode) on port 5432 to avoid "Tenant or user not found" from Pooler
    // Pattern: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
    const password = '0xw8SnQc09fHn7S4'
    const ref = 'robptuukezhqvtasjyhz'
    const connectionString = `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`

    console.log('🔗 Connecting to:', `postgresql://postgres:***@db.${ref}.supabase.co:5432/postgres`)

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false // Supabase requires SSL, sometimes needs this for Node clients
        }
    })

    try {
        await client.connect()
        console.log('✅ Connected.')

        const sqlPath = path.join(process.cwd(), 'supabase/migrations/20260120143120_create_trial_history_table.sql')
        const sql = fs.readFileSync(sqlPath, 'utf8')

        console.log('📝 Applying migration:', path.basename(sqlPath))
        await client.query(sql)

        console.log('🚀 Migration applied successfully!')
    } catch (err) {
        console.error('❌ Error applying migration:', err)
    } finally {
        await client.end()
    }
}

applyMigration()
