
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function findAppt() {
    const supabase = await createAdminClient()
    const { data: appt, error } = await supabase.from('appointments').select('*').ilike('id', '8ad6%')
    console.log('Search result for 8ad6:', { count: appt?.length, error: error?.message })
    if (appt && appt.length > 0) {
        console.log('Found ID:', appt[0].id)
    }
}

findAppt()
