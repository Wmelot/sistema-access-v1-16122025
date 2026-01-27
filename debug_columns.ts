import { createAdminClient } from "./src/lib/supabase/server"

async function debug() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from('message_logs').select('*').limit(1)
    if (error) {
        console.error("Error fetching logs:", error)
        return
    }
    console.log("Columns found:", Object.keys(data[0] || {}))
}

debug()
