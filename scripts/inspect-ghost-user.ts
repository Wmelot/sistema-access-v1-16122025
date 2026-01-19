import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2'

async function inspect() {
    console.log("🕵️ INSPECTING GHOST USER: " + OLD_ID)

    // 1. Check Profiles
    const { data: profile, error: pErr } = await client.from('profiles').select('*').eq('id', OLD_ID).single()
    if (pErr) console.log("❌ Profile not found or error:", pErr.message)
    else console.log("✅ Profile found:", profile.email, profile.full_name)

    // 2. Check Auth User (requires admin API, but client is service check)
    const { data: { user }, error: uErr } = await client.auth.admin.getUserById(OLD_ID)
    if (uErr) console.log("❌ Auth User not found or error:", uErr.message)
    else console.log("✅ Auth User found:", user.email)

    // 3. Try deleting directly to see exact error (DRY RUN? No, simple try/catch on delete and print error)
    // We won't actually delete if we want to be safe, but the user WANTS to delete.
    // Let's try deleting and capture the specific PG error code/message.
    
    console.log("⚠️ ATTEMPTING DELETE TO CAPTURE ERROR MSG...")
    const { error: delErr } = await client.auth.admin.deleteUser(OLD_ID)
    
    if (delErr) {
        console.log("❌ DELETE FAILED WITH:", delErr)
        console.log("   -> Code:", (delErr as any).code)
        console.log("   -> Details:", (delErr as any).details)
        console.log("   -> Hint:", (delErr as any).hint)
        console.log("   -> Message:", (delErr as any).message)
    } else {
        console.log("🎉 DELETE SUCCESSFUL! (Problem solved?)")
    }
}

inspect()
