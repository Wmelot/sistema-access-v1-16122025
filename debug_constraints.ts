import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function debugConstraints() {
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

    // Query to find constraints on message_templates
    const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'message_templates' })

    if (error) {
        // Fallback: try to guess or use another way if RPC doesn't exist
        console.log("RPC get_table_constraints not found. Trying information_schema query via rpc('exec_sql')...")
        const sql = `
            SELECT 
                cc.check_clause
            FROM 
                information_schema.table_constraints tc 
                JOIN information_schema.check_constraints cc 
                ON tc.constraint_name = cc.constraint_name
            WHERE 
                tc.table_name = 'message_templates'
        `;
        const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql })
        if (sqlError) {
            console.error("SQL query failed:", sqlError)
        } else {
            console.log("Constraints:", JSON.stringify(sqlData, null, 2))
        }
    } else {
        console.log("Constraints:", JSON.stringify(data, null, 2))
    }
}

debugConstraints()
