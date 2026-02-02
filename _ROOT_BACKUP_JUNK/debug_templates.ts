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
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1)
            }
            env[key.trim()] = val
        }
    })

    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const { data, error } = await supabase.from('message_templates').select('*').limit(1)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Columns in message_templates:", Object.keys(data[0] || {}))
    }
}

debug()
