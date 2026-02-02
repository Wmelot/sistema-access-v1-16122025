
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function searchMultiple() {
    const supabase = await createAdminClient()
    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .or('name.ilike.%Valei%,name.ilike.%Warley%')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Found Patients:', JSON.stringify(patients, null, 2))
}

searchMultiple()
