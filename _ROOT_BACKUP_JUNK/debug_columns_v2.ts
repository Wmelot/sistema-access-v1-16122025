import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function debug() {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const env: Record<string, string> = {}
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=')
        if (key && value) env[key.trim()] = value.join('=').trim()
    })

    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing credentials in .env.local")
        return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('message_logs').select('*').limit(1)

    if (error) {
        console.error("Error fetching logs:", error)
        return
    }

    if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]))
    } else {
        // Try to get column names from schema
        const { data: cols, error: colError } = await supabase.rpc('get_column_names', { table_name: 'message_logs' })
        if (colError) {
            console.log("No data found and RPC failed. Trying to insert and rollback...")
            // Alternative: just try a dummy insert to see if it fails due to missing columns
        } else {
            console.log("Columns:", cols)
        }
    }
}

debug()
