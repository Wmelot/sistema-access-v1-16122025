
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkSchema() {
    const supabase = await createAdminClient()

    console.log('--- ORGANIZATIONS ---')
    const { data: orgs } = await supabase.from('organizations').select('*').limit(1)
    if (orgs && orgs.length > 0) console.log(Object.keys(orgs[0]))

    console.log('--- SERVICES ---')
    const { data: servs } = await supabase.from('services').select('*').limit(1)
    if (servs && servs.length > 0) console.log(Object.keys(servs[0]))
}

checkSchema()
