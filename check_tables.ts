import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
    const { error } = await supabase.from('professional_integrations').select('id').limit(1)
    if (error) {
        console.error("Error accessing professional_integrations:", error)
    } else {
        console.log("Success: professional_integrations exists.")
    }

    // Check api_integrations too
    const { error: error2 } = await supabase.from('api_integrations').select('id').limit(1)
    if (error2) {
        console.error("Error accessing api_integrations:", error2)
    } else {
        console.log("Success: api_integrations exists.")
    }
}

checkTable()
