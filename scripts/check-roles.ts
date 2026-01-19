import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const { data: roles } = await client
        .from('roles')
        .select('id, name')
    
    console.log("📋 Roles in database:")
    roles?.forEach(r => console.log(`  - ${r.name} (ID: ${r.id})`))
}

check()
