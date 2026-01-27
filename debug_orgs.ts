import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function debugOrgs() {
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

    const { data, error } = await supabase.from('organizations').select('id, name, slug')
    if (error) {
        console.error("Error fetching orgs:", error)
        return
    }
    console.log("Organizations in DB:", JSON.stringify(data, null, 2))

    const { data: templates, error: tError } = await supabase.from('message_templates').select('organization_id, trigger_type, title')
    if (tError) {
        console.error("Error fetching templates:", tError)
    } else {
        console.log("Templates in DB:", JSON.stringify(templates, null, 2))
    }
}

debugOrgs()
