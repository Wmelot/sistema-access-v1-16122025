
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function testPatients() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from('appointments').select('id, patients(name)').limit(1)
    console.log('Testing patients join:', error ? `ERROR: ${error.message}` : "SUCCESS")
    if (!error) console.log('Data:', data)
}

testPatients()
