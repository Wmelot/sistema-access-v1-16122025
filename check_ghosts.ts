
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkGhostAppointments() {
    const supabase = await createAdminClient()
    const { data: ghosts, error } = await supabase
        .from('appointments')
        .select('*, patients(name), services(name)')
        .is('service_id', null)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Ghost Appointments (Null Service):', JSON.stringify(ghosts, null, 2))
}

checkGhostAppointments()
