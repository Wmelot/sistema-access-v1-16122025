import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!supabaseUrl || !supabaseKey) { console.error("Missing ENV!"); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFollow() {
    console.log("Forcing cron trigger...");
    const url = 'http://localhost:3000/api/cron/process-followups';
    try {
        const r = await fetch(url, { method: 'GET' })
        const json = await r.json()
        console.log("CRON RESULT: ", JSON.stringify(json, null, 2))
    } catch(e) {
        console.error(e)
    }
}
testFollow()
