import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function promote() {
    const email = 'wmelot@gmail.com'
    const MASTER_ROLE_ID = '7c9e44f4-97ee-4850-ac53-32640f8f422f'
    
    console.log("👑 PROMOTING " + email + " TO MASTER ROLE...")

    const { data: user } = await client.from('profiles').select('id').eq('email', email).single()
    if (!user) {
        console.log("User not found.")
        return
    }

    const { error } = await client
        .from('profiles')
        .update({ 
            role: 'master',  // Enum/String if exists
            role_id: MASTER_ROLE_ID // UUID Link
        })
        .eq('id', user.id)
    
    if (error) console.log("❌ Failed to promote:", error)
    else console.log("✅ User promoted to Master successfully.")
}

promote()
