
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkConstraints() {
    const supabase = await createAdminClient()

    const { data: constraints, error } = await supabase.from('appointments').select('*').limit(0)

    // Query information_schema directly via SQL
    const { data: fks, error: fkError } = await supabase.rpc('get_table_constraints', { t_name: 'appointments' }) ||
        await supabase.from('_dummy').select('*').limit(0); // fallback

    // Since I don't have a reliable RPC for constraints, let's try multiple join variations
    const variations = [
        "organizations(name)",
        "organization:organization_id(name)",
        "organizations!organization_id(name)",
        "organizations!appointments_organization_id_fkey(name)"
    ]

    for (const v of variations) {
        const { data, error } = await supabase.from('appointments').select(`id, ${v}`).limit(1)
        console.log(`Testing variation [${v}]:`, error ? `ERROR: ${error.message}` : "SUCCESS")
    }
}

checkConstraints()
