import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2'

async function forceDelete() {
    console.log("💣 FORCE DELETING PROFILE: " + OLD_ID)

    const { error } = await client
        .from('profiles')
        .delete()
        .eq('id', OLD_ID)

    if (error) {
        console.error("❌ FAILED TO DELETE PROFILE:", error)
        console.error("   Details:", error.details)
        console.error("   Hint:", error.hint)
    } else {
        console.log("✅ PROFILE DELETED SUCCESSFULLY (DB Row Removed).")
        console.log("   The Auth User might still exist in a broken state, but it won't show in the dashboard.")
    }

    // Double check
    const { data: check } = await client.from('profiles').select('id').eq('id', OLD_ID).single()
    if (check) {
        console.log("⚠️ WARNING: Profile still exists? This shouldn't happen if no error returned.")
    } else {
        console.log("verified: Profile is gone.")
    }
}

forceDelete()
