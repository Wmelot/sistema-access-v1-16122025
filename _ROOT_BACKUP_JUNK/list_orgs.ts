
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function listOrgs() {
    const supabase = await createAdminClient()
    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Organizations:', JSON.stringify(orgs, null, 2))
}

listOrgs()
