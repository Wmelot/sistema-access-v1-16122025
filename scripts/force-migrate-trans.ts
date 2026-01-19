import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2'
const NEW_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15'

async function run() {
    console.log("�� FORCE UPDATE TRANSACTIONS...")
    
    // Attempt Update blindly
    const { data, error, count } = await client
        .from('transactions')
        .update({ professional_id: NEW_ID })
        .eq('professional_id', OLD_ID)
        .select() // Return updated rows
    
    if (error) console.log("❌ Update Error:", error)
    else console.log(`✅ Updated ${data?.length} transactions.`)

    // Then Delete Profile
    console.log("💣 Attempting Delete Profile again...")
    const { error: delErr } = await client.from('profiles').delete().eq('id', OLD_ID)
    if (delErr) console.log("❌ Delete Profile Failed:", delErr)
    else console.log("✅ Profile Deleted!")
}

run()
