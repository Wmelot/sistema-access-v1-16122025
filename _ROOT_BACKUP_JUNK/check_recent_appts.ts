
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkRecentAppointments() {
    const supabase = await createAdminClient()
    const { data: recents, error } = await supabase
        .from('appointments')
        .select('*, patients(name), services(name)')
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Recent Appointments:', JSON.stringify(recents, null, 2))
}

checkRecentAppointments()
