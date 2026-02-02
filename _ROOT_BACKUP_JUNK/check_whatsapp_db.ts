
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkConfig() {
    const supabase = await createAdminClient()
    const organizationId = '9571532e-fdf8-4aaa-b236-416fd6459566'

    const { data: integrations, error } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('organization_id', organizationId)

    console.log('Integrations:', JSON.stringify(integrations, null, 2))
    if (error) console.error('Error:', error)
}

checkConfig()
