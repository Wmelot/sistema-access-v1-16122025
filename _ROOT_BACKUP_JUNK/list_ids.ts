
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function listAppts() {
    const supabase = await createAdminClient()
    const { data: appts } = await supabase.from('appointments').select('id, created_at, status').order('created_at', { ascending: false }).limit(10)
    console.log('Last 10 IDs:', appts?.map(a => a.id))
}

listAppts()
