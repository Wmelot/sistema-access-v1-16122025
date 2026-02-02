import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const email = 'wmelot@gmail.com'
    console.log("🕵️ CHECKING PROFILE FOR: " + email)

    const { data: profile } = await client
        .from('profiles')
        .select('id, email, organization_id, role, full_name')
        .eq('email', email)
        .single()
    
    if (!profile) {
        console.log("User not found.")
        return
    }

    console.log("--- PROFILE DATA ---")
    console.log("ID:", profile.id)
    console.log("Org ID:", profile.organization_id)
    console.log("Role:", profile.role)
    console.log("Name:", profile.full_name)

    const MASTER_ORG = '00000000-0000-0000-0000-000000000001'
    if (profile.organization_id === MASTER_ORG) {
        console.log("✅ User IS in Master Org. Should access /admin.")
    } else {
        console.log("❌ User is NOT in Master Org. Access to /admin is blocked by layout.")
        console.log("   Current Org:", profile.organization_id)
        console.log("   Required Org:", MASTER_ORG)
    }
}

check()
