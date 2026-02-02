import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import pkg from 'pg'

dotenv.config({ path: '.env.local' })

const { Client } = pkg

async function createTable() {
    console.log("🔧 Creating granular_permissions table...")

    // Try to get DATABASE_URL from env
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
        console.log("❌ DATABASE_URL not found in .env.local")
        console.log("\n📝 Please execute this SQL manually in Supabase SQL Editor:\n")
        console.log(`
CREATE TABLE IF NOT EXISTS granular_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module, action)
);

CREATE INDEX IF NOT EXISTS idx_granular_permissions_role_module ON granular_permissions(role_id, module);
CREATE INDEX IF NOT EXISTS idx_granular_permissions_granted ON granular_permissions(granted) WHERE granted = true;
`)
        return
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    })

    try {
        await client.connect()
        console.log("✅ Connected to database")

        const sql = `
CREATE TABLE IF NOT EXISTS granular_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module, action)
);

CREATE INDEX IF NOT EXISTS idx_granular_permissions_role_module ON granular_permissions(role_id, module);
CREATE INDEX IF NOT EXISTS idx_granular_permissions_granted ON granular_permissions(granted) WHERE granted = true;
`

        await client.query(sql)
        console.log("✅ Table created successfully!")

        // Verify
        const result = await client.query("SELECT COUNT(*) FROM granular_permissions")
        console.log(`📊 Current records: ${result.rows[0].count}`)

    } catch (error: any) {
        console.error("❌ Error:", error.message)
        console.log("\n📝 Please execute the SQL manually in Supabase SQL Editor")
    } finally {
        await client.end()
    }
}

createTable()
