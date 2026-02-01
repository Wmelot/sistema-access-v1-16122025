
import { createAdminClient } from "@/lib/supabase/admin"

export async function checkColumns() {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('appointments').select('*').limit(1)
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]))
    } else {
        console.log("No data or error:", error)
    }
}
