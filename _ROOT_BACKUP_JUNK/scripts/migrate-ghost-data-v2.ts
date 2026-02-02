import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2'
const NEW_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15'

async function migrate() {
    console.log("🔄 MIGRATING TRANSACTIONS...")

    // Transactions
    const { data: trans } = await client.from('transactions').select('id').eq('professional_id', OLD_ID)
    console.log(`FOUND ${trans?.length || 0} transactions linked to OLD user.`)

    if (trans && trans.length > 0) {
        const { error } = await client
            .from('transactions')
            .update({ professional_id: NEW_ID })
            .eq('professional_id', OLD_ID)
        
        if (error) console.error("❌ Failed to migrate transactions:", error)
        else console.log("✅ Transactions migrated successfully.")
    }

    console.log("Re-running cleanup just in case...")
    await client.from('professional_availability').delete().eq('profile_id', OLD_ID)
    await client.from('service_professionals').delete().eq('profile_id', OLD_ID)
    
    console.log("Done. Try Force Delete again.")
}

migrate()
