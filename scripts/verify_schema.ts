
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass policies if needed

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log("Checking schema for message_templates...")

    // We can't access information_schema easily via client usually, 
    // but we can try to select from the table and see the error or data.

    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .limit(1)

    if (error) {
        console.error("Error selecting *:", error)
    } else {
        console.log("Select * successful. Columns in result:", data && data.length > 0 ? Object.keys(data[0]) : "No rows found")
    }

    // Try selecting specific column
    const { data: colData, error: colError } = await supabase
        .from('message_templates')
        .select('delay_days')
        .limit(1)

    if (colError) {
        console.error("Error selecting delay_days:", colError)
    } else {
        console.log("Select delay_days successful.")
    }

    // Check for payment_methods (Client Side)
    const { data: pm, error: pmError } = await supabase.from('payment_methods').select('id, name').limit(1)
    if (pmError) console.error("payment_methods error:", pmError)
    else console.log("payment_methods found:", pm)
}

check()
