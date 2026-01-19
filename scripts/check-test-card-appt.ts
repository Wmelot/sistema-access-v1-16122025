import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log("🔍 CHECKING 'Paciente Teste Card' APPOINTMENT...")

    // Find the appointment
    const { data: appts } = await client
        .from('appointments')
        .select(`
            id,
            status,
            start_time,
            patient:patients(name),
            professional:profiles!professional_id(full_name)
        `)
        .eq('status', 'in_progress')
        .limit(5)
    
    if (!appts || appts.length === 0) {
        console.log("❌ No 'in_progress' appointments found.")
        return
    }

    console.log(`Found ${appts.length} in_progress appointments:`)
    appts.forEach(a => {
        console.log(`  - ID: ${a.id}`)
        console.log(`    Patient: ${a.patient?.name}`)
        console.log(`    Professional: ${a.professional?.full_name}`)
        console.log(`    Status: ${a.status}`)
        console.log(`    Start: ${a.start_time}`)
        console.log("")
    })
}

check()
