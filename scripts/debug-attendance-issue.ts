import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function debug() {
    console.log("🔍 DEBUGGING ATTENDANCE RESTART ISSUE...")

    // Find the test appointment
    const { data: appt } = await client
        .from('appointments')
        .select('id, status, patient:patients(name)')
        .eq('status', 'in_progress')
        .limit(1)
        .single()
    
    if (!appt) {
        console.log("❌ No in_progress appointment found")
        return
    }

    console.log(`Found appointment: ${appt.id}`)
    console.log(`  Patient: ${appt.patient?.name}`)
    console.log(`  Status: ${appt.status}`)

    // Check for existing records
    const { data: records } = await client
        .from('patient_records')
        .select('id, created_at, updated_at, content')
        .eq('appointment_id', appt.id)
        .order('created_at', { ascending: false })
    
    console.log(`\nFound ${records?.length || 0} patient_records for this appointment:`)
    records?.forEach((r, i) => {
        console.log(`  [${i + 1}] ID: ${r.id}`)
        console.log(`      Created: ${r.created_at}`)
        console.log(`      Updated: ${r.updated_at}`)
        console.log(`      Has content: ${!!r.content}`)
    })

    if (records && records.length > 1) {
        console.log("\n⚠️ PROBLEMA ENCONTRADO: Múltiplos registros para o mesmo agendamento!")
        console.log("   Isso pode estar causando o restart do contador.")
    }
}

debug()
