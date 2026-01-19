import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function createTable() {
    console.log("🔧 Attempting to create table via Supabase Management API...")
    
    const projectRef = supabaseUrl.split('//')[1].split('.')[0]
    
    console.log(`Project: ${projectRef}`)
    console.log(`\nℹ️  Since we cannot execute DDL via Supabase client, please:\n`)
    console.log("1. Go to: https://supabase.com/dashboard/project/" + projectRef + "/sql/new")
    console.log("2. Copy and paste this SQL:\n")
    
    const sql = `CREATE TABLE IF NOT EXISTS granular_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module, action)
);

CREATE INDEX IF NOT EXISTS idx_granular_permissions_role_module 
    ON granular_permissions(role_id, module);
    
CREATE INDEX IF NOT EXISTS idx_granular_permissions_granted 
    ON granular_permissions(granted) WHERE granted = true;`
    
    console.log(sql)
    console.log("\n3. Click 'Run'")
    console.log("4. Then execute: npx tsx scripts/seed-permissions-simple.ts\n")
}

createTable()
