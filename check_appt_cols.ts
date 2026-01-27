
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkCols() {
    const supabase = await createAdminClient()
    const { data: cols, error } = await supabase.from('appointments').select('*').limit(1)
    if (cols && cols.length > 0) {
        console.log('Columns:', Object.keys(cols[0]))
    }
}

checkCols()
