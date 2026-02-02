import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function createTest() {
    console.log("📅 CREATING NEW TEST APPOINTMENT...")

    // Get patient and professional IDs
    const { data: patient } = await client
        .from('patients')
        .select('id, name')
        .ilike('name', '%Teste Card%')
        .single()
    
    const { data: professional } = await client
        .from('profiles')
        .select('id, full_name')
        .eq('email', 'wmelot@gmail.com')
        .single()
    
    const { data: service } = await client
        .from('services')
        .select('id, name, price')
        .limit(1)
        .single()

    if (!patient || !professional || !service) {
        console.log("Missing data:", { patient: !!patient, professional: !!professional, service: !!service })
        return
    }

    const now = new Date()
    const startTime = new Date(now.getTime() + 60000) // 1 min from now
    const endTime = new Date(startTime.getTime() + 3600000) // 1 hour later

    const { data: appt, error } = await client
        .from('appointments')
        .insert({
            patient_id: patient.id,
            professional_id: professional.id,
            service_id: service.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'in_progress',
            title: 'Teste de Encerramento',
            price: service.price
        })
        .select()
        .single()
    
    if (error) {
        console.error("❌ Error creating appointment:", error)
    } else {
        console.log("✅ Created appointment:", appt.id)
        console.log("   Patient:", patient.name)
        console.log("   Professional:", professional.full_name)
        console.log("   Status:", appt.status)
    }
}

createTest()
