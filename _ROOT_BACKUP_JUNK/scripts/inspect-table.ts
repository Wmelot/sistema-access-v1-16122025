import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function inspect() {
    console.log("INSPECTING TRANSACTIONS TABLE")
    const { data, error } = await client.from('transactions').select('*').limit(1)
    if (error) console.log("Error:", error)
    else if (data && data.length > 0) console.log("Keys:", Object.keys(data[0]))
    else console.log("No data to inspect keys.")
}
inspect()
