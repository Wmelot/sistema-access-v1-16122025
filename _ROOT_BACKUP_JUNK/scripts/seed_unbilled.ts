import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log("Creating test unbilled appointments...")

    // Get first patient
    const { data: patients } = await supabase.from('patients').select('id').limit(3)

    if (!patients || patients.length === 0) {
        console.log("No patients found")
        return
    }

    // Get a service
    const { data: services } = await supabase.from('services').select('id, price').limit(1)
    const serviceId = services?.[0]?.id
    const servicePrice = services?.[0]?.price || 100

    // Create completed appointments without invoice_id
    const appointments = []
    const now = new Date()

    for (let i = 0; i < 3; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() - (i * 3)) // 3 appointments spread across the month
        date.setHours(10 + i, 0, 0)

        appointments.push({
            patient_id: patients[i % patients.length].id,
            start_time: date.toISOString(),
            end_time: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
            status: 'completed',
            service_id: serviceId,
            title: 'Fisioterapia',
            invoice_id: null // Not billed
        })
    }

    const { error } = await supabase.from('appointments').insert(appointments)
    if (error) console.error("Error:", error)
    else console.log(`Created ${appointments.length} unbilled appointments`)
}

seed()
