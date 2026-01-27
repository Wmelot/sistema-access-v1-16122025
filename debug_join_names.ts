
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function debugJoinNames() {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id,
            profiles(*),
            patients(*),
            locations(*)
        `)
        .limit(1)

    if (error) {
        console.log('Error:', error.message)
    } else {
        console.log('Keys in data:', Object.keys(data[0]))
    }
}

debugJoinNames()
