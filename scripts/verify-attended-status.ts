import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
    console.log("🔍 VERIFYING ATTENDED APPOINTMENTS...")

    const { data: attended } = await client
        .from('appointments')
        .select('id, status, start_time, patient:patients(name)')
        .eq('status', 'attended')
        .limit(5)
    
    console.log(`Found ${attended?.length || 0} attended appointments:`)
    attended?.forEach(a => {
        console.log(`  - ${a.patient?.name} | Status: ${a.status}`)
    })

    const { data: inProgress } = await client
        .from('appointments')
        .select('id, status, start_time, patient:patients(name)')
        .eq('status', 'in_progress')
        .limit(5)
    
    console.log(`\nFound ${inProgress?.length || 0} in_progress appointments:`)
    inProgress?.forEach(a => {
        console.log(`  - ${a.patient?.name} | Status: ${a.status}`)
    })
}

verify()
