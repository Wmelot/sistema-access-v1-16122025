
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkRecentPatients() {
    const supabase = await createAdminClient()
    const { data: recents, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Recent Patients:', JSON.stringify(recents, null, 2))
}

checkRecentPatients()
