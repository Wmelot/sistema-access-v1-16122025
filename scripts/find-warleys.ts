import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function find() {
    console.log("🔍 FINDING WARLEYS...")
    const { data: profiles } = await client
        .from('profiles')
        .select('id, full_name, email, organization_id')
        .ilike('full_name', '%Warley%')
    
    profiles?.forEach(p => {
        console.log(`User: ${p.full_name} (${p.email}) | ID: ${p.id}`)
    })
}

find()
