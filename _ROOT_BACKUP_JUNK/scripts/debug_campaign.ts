
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log("Checking campaign_messages...")

    // 1. Get all messages
    const { data, error } = await supabase
        .from('campaign_messages')
        .select('*')

    if (error) {
        console.error("Error fetching messages:", error)
        return
    }

    console.log(`Found ${data.length} messages:`)
    data.forEach(msg => {
        console.log(`- ID: ${msg.id}, Status: ${msg.status}, Phone: ${msg.phone}, SentAt: ${msg.sent_at}`)
    })

    // 2. Check Configurations
    const { data: configs } = await supabase.from('api_integrations').select('*')
    console.log("\nConfigs:", configs)
}

debug()
