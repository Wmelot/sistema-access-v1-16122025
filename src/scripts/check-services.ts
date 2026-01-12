
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    console.log("--- Checking Services ---")
    const { data: services, error } = await supabase
        .from('services')
        .select('id, name, organization_id, created_at')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching services:", error)
        return
    }

    if (services.length === 0) {
        console.log("No services found in the database.")
    } else {
        services.forEach(s => {
            console.log(`- [${s.organization_id}] ${s.name} (Created: ${s.created_at})`)
        })
    }

    console.log("\n--- Active Organizations ---")
    const { data: orgs } = await supabase.from('organizations').select('id, name')
    orgs?.forEach(o => console.log(`[${o.id}] ${o.name}`))
}

run()
