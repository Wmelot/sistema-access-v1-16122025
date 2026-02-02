import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function checkTable() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.from('organization_payment_settings').select('count').limit(1)

    if (error) {
        console.error("Error checking table:", error)
    } else {
        console.log("Table exists! Data:", data)
    }

    const { data: tables, error: tablesError } = await supabase.rpc('get_tables_info', {}).catch(() => ({ data: null, error: { message: 'RPC not found' } }))
    console.log("Tables info:", tables || tablesError)
}

checkTable()
