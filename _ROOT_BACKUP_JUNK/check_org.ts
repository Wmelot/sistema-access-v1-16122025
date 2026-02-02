
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkOrg() {
    const supabase = await createAdminClient()
    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', 'access-fisioterapia')
        .single()

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Organization:', JSON.stringify(org, null, 2))
}

checkOrg()
