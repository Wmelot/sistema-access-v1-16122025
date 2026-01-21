
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkInvoicesSchema() {
    console.log('Checking "invoices" table columns...')

    // Method 1: Query valid columns via a dummy select (if data exists)
    const { data: example, error: selectError } = await supabase
        .from('invoices')
        .select('*')
        .limit(1)

    if (selectError) {
        console.error('Error selecting from invoices:', selectError)
    } else if (example && example.length > 0) {
        console.log('Sample invoice keys:', Object.keys(example[0]))
    } else {
        console.log('No invoices found to sample keys from.')
    }

    // Method 2: Inspect via PostgREST openapi (Standard way to see exposed schema)
    // Can't easily do that from here without fetching the JSON. 
    // Instead, let's try to query information_schema assuming we have permissions (Service Role usually does not give direct SQL access unless via rpc, but standard selects on info schema might fail if not exposed)
    // Actually, Service Role bypasses RLS, so regular selects work. But accessing information_schema via the JS client is tricky as it's not a public table usually exposed to the 'anon'/'authenticated' API.
    // HOWEVER, we can just try to insert a dummy record catching the error to see if it complains about organization_id explicitly.
}

checkInvoicesSchema()
