
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log("Seeding fake data...")

    // 1. Create Patients
    const patients = []
    for (let i = 1; i <= 10; i++) {
        patients.push({
            name: `Paciente Teste ${i}`,
            phone: `551199999999${i}`,
            email: `teste${i}@example.com`,
            cpf: `1112223330${i}`,
            notes: 'Gerado automaticamente'
        })
    }
    const { data: createdPatients, error: pError } = await supabase.from('patients').insert(patients).select()
    if (pError) console.error("Error creating patients:", pError)
    else console.log(`Created ${createdPatients?.length} patients.`)

    if (!createdPatients) return

    // 2. Create Appointments
    const appointments = []
    const now = new Date()
    const p1 = createdPatients[0]

    // Future appt
    const futureDate = new Date(now)
    futureDate.setDate(now.getDate() + 1)
    futureDate.setHours(10, 0, 0)

    appointments.push({
        patient_id: p1.id,
        start_time: futureDate.toISOString(),
        end_time: new Date(futureDate.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        title: 'Fisioterapia'
    })

    // Past appt
    const pastDate = new Date(now)
    pastDate.setDate(now.getDate() - 2)
    pastDate.setHours(15, 0, 0)

    appointments.push({
        patient_id: p1.id,
        start_time: pastDate.toISOString(),
        end_time: new Date(pastDate.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'completed',
        title: 'Avaliação Inicial'
    })

    const { error: aError } = await supabase.from('appointments').insert(appointments)
    if (aError) console.error("Error creating appointments:", aError)
    else console.log("Appointments created.")

    // 3. Transactions (Financial)
    const transactions = []
    // Income
    transactions.push({
        type: 'income',
        amount: 150.00,
        description: 'Pagamento Fisioterapia',
        category: 'Consultas',
        date: pastDate.toISOString().split('T')[0],
        status: 'paid',
        patient_id: p1.id
    })
    // Expense
    transactions.push({
        type: 'expense',
        amount: 50.00,
        description: 'Material de Escritório',
        category: 'Material',
        date: now.toISOString().split('T')[0],
        status: 'pending'
    })

    const { error: tError } = await supabase.from('transactions').insert(transactions)
    if (tError) console.error("Error creating transactions:", tError)
    else console.log("Transactions created.")

    // 4. Default WhatsApp Config
    const { error: wError } = await supabase.from('api_integrations').upsert({
        provider: 'test_mode',
        config: { isActive: true, safeNumber: '5511999999999' },
        is_active: true
    }, { onConflict: 'provider' })

    if (wError) console.error("Error config whatsapp:", wError)

    console.log("Seeding complete!")
}

seed()
