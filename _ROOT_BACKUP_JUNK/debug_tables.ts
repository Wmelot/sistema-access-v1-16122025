
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function debugTables() {
    const supabase = await createAdminClient()

    // Check if appointment has organization_id
    const { data: appt } = await supabase.from('appointments').select('*').limit(1).single()
    console.log('Appt organization_id:', appt?.organization_id)

    // Check if organization exists
    const { data: org, error: orgError } = await supabase.from('organizations').select('id, name').eq('id', appt?.organization_id).single()
    console.log('Org lookup:', { data: org, error: orgError?.message })

    // Check relationship with profiles (professional_id)
    const { data: prof, error: profError } = await supabase.from('appointments').select('id, profiles(full_name)').limit(1)
    console.log('Profiles join:', { success: !profError, error: profError?.message })
}

debugTables()
