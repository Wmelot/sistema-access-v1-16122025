
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrgs() {
    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, slug')

    if (error) {
        console.error("Error fetching orgs:", error)
        return
    }

    console.log("Current Organizations:")
    console.table(orgs)
}

checkOrgs()
