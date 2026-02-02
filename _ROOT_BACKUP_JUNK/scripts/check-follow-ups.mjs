import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
    const { data: sample, error: sampleError } = await supabase.from('assessment_follow_ups').select('*').limit(1)
    if (sampleError) {
        console.error(sampleError)
    } else {
        console.log("Columns:", Object.keys(sample[0] || {}))
    }
}
check()
