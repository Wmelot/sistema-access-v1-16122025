import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function runMigration() {
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

    // Read SQL
    const sql = fs.readFileSync(path.resolve(process.cwd(), 'migration_add_appointment_tracking.sql'), 'utf8')

    console.log("Running migration...")

    // Using rpc or unsafe query if available. If not, we might need a different approach.
    // Supabase JS doesn't have a direct 'query' method for DDL.
    // We usually use a helper function or the SQL editor.
    // However, I can try to use a hidden RPC if it exists or create one.

    // Attempt to run via a common RPC for migrations if it exists
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
        console.error("Migration failed via RPC:", error)
        console.log("Please run the SQL in migration_add_appointment_tracking.sql manually in the Supabase Dashboard.")
    } else {
        console.log("Migration successful!")
    }
}

runMigration()
