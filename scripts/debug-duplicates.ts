import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function debug() {
    console.log("🔍 CHECKING FOR DUPLICATE ACTIVE APPOINTMENTS")

    // 1. Get all professionals to identify 'old' vs 'new'
    const { data: users } = await client.from('profiles').select('id, email, full_name')
    console.log("\n--- PROFESSIONALS ---")
    users?.forEach(u => console.log(`[${u.id}] ${u.email} (${u.full_name})`))

    // 2. Search for active appointments
    const { data: appts } = await client
        .from('appointments')
        .select('id, status, start_time, end_time, professional_id, patient_id, created_at, updated_at')
        .in('status', ['in_progress', 'scheduled', 'confirmed'])
        .order('created_at', { ascending: false })

    console.log("\n--- ACTIVE/SCHEDULED APPOINTMENTS ---")
    if (appts && appts.length > 0) {
        appts.forEach(a => {
            const prof = users?.find(u => u.id === a.professional_id)
            console.log(`Appt ${a.id.slice(0,8)}... | Status: ${a.status} | Start: ${a.start_time} | Updated: ${a.updated_at}`)
            console.log(`   -> Professional: ${prof ? prof.email : 'UNKNOWN ('+a.professional_id+')'}`)
            console.log(`   -> Patient ID: ${a.patient_id}`)
        })
    } else {
        console.log("No active appointments found.")
    }
}

debug()
