import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log("🔍 Checking permissions table structure...")

    // Check existing permissions
    const { data: perms, error } = await client
        .from('permissions')
        .select('*')
        .limit(5)
    
    if (error) {
        console.error("❌ Error:", error)
    } else {
        console.log("\n📋 Current permissions table structure:")
        if (perms && perms.length > 0) {
            console.log("Sample record:", perms[0])
            console.log("Columns:", Object.keys(perms[0]))
        } else {
            console.log("Table is empty")
        }
    }

    // Check role_permissions (old system)
    const { data: rolePerms } = await client
        .from('role_permissions')
        .select('*, permissions(*)')
        .limit(5)
    
    console.log("\n📋 Old role_permissions system:")
    if (rolePerms && rolePerms.length > 0) {
        console.log("Sample:", rolePerms[0])
    }
}

check()
