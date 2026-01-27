
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkSchema() {
    const supabase = await createAdminClient()

    // Check foreign keys for appointments table
    const { data, error } = await supabase.rpc('get_table_foreign_keys', { table_name: 'appointments' })

    // If RPC doesn't exist, try a direct query to information_schema
    if (error) {
        const { data: info, error: infoError } = await supabase.from('appointments').select('*').limit(1)
        console.log('Sample appointment:', info?.[0])

        // Try to fetch relationships using the "old" syntax to see if it works
        const { data: testJoin, error: joinError } = await supabase
            .from('appointments')
            .select(`
                id,
                patients(name),
                profiles:professional_id(full_name),
                locations(name),
                organizations(name)
            `)
            .limit(1)

        console.log('Simple Join Test Result:', {
            success: !joinError,
            error: joinError?.message,
            data: testJoin
        })
    } else {
        console.log('Foreign Keys:', data)
    }
}

checkSchema()
