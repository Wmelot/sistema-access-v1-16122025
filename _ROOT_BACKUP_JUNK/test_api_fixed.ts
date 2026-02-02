
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function testApi() {
    const id = '8ad67931-53d5-4d00-8c7e-ed07571ba564'
    const supabase = await createAdminClient()

    // Simulating the API logic
    const { data: appt, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (name, phone),
            profiles (full_name, photo_url),
            locations (name),
            services (name)
        `)
        .eq('id', id)
        .maybeSingle()

    if (error) {
        console.error('Error fetching appointment:', error.message)
        return
    }
    if (!appt) {
        console.warn('Not found')
        return
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('slug, name')
        .eq('id', appt.organization_id)
        .single()

    console.log('Result:', JSON.stringify({
        ...appt,
        organizations: org
    }, null, 2))
}

testApi()
