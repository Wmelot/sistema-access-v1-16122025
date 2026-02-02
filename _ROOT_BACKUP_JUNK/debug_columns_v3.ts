import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function debug() {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const env: Record<string, string> = {}
    envContent.split('\n').forEach(line => {
        let [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
            let val = valueParts.join('=').trim()
            // Remove quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1)
            }
            env[key.trim()] = val
        }
    })

    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']

    console.log("Checking URL:", supabaseUrl?.substring(0, 10) + "...")

    const supabase = createClient(supabaseUrl!, supabaseKey!)
    const { data, error } = await supabase.from('message_logs').select('*').limit(1)

    if (error) {
        console.error("Error fetching logs:", error)
        return
    }

    if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]))
    } else {
        console.log("No data in message_logs yet.")
    }
}

debug()
