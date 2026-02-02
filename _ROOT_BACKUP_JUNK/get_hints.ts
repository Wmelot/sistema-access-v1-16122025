
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function findFKs() {
    const supabase = await createAdminClient()

    // Using a trick: try to join with something that doesn't exist to get the list of hints
    const { error } = await supabase.from('appointments').select('*, non_existent_table(*)').limit(1)
    console.log('Hints:', error?.message)
}

findFKs()
