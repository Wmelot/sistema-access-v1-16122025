
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkProfiles() {
    const supabase = await createAdminClient()
    const { data: profs } = await supabase.from('profiles').select('*').limit(1)
    if (profs && profs.length > 0) console.log(Object.keys(profs[0]))
}

checkProfiles()
