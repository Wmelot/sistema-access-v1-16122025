
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function searchVarlei() {
    const supabase = await createAdminClient()
    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', '%Varlei%')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Varlei Patients:', JSON.stringify(patients, null, 2))
}

searchVarlei()
