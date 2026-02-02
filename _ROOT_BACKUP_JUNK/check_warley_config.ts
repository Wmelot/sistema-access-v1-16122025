
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkPro() {
    const supabase = await createAdminClient()
    const { data: pro } = await supabase
        .from('profiles')
        .select('full_name, smart_scheduling_mode, anchor_times')
        .ilike('full_name', '%Warley%')
        .single()

    console.log('Pro config:', pro)
}

checkPro()
