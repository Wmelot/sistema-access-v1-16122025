
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log("Seeding message templates...")

    const templates = [
        {
            title: 'Confirmação de Agendamento',
            content: 'Olá {{paciente}}, seu agendamento para {{data}} às {{horario}} com {{medico}} está confirmado.',
            channel: 'whatsapp',
            trigger_type: 'appointment_confirmation',
            is_active: true
        },
        {
            title: 'Lembrete de Consulta',
            content: 'Olá {{paciente}}, lembrete da sua consulta amanhã às {{horario}}.',
            channel: 'whatsapp',
            trigger_type: 'appointment_reminder',
            delay_days: 1,
            is_active: true
        },
        {
            title: 'Feliz Aniversário',
            content: 'Parabéns {{paciente}}! A Access Fisioterapia deseja muitas felicidades.',
            channel: 'whatsapp',
            trigger_type: 'birthday',
            is_active: true
        }
    ]

    for (const t of templates) {
        const { error } = await supabase.from('message_templates').insert(t)
        if (error) console.error(`Error inserting ${t.title}:`, error.message)
        else console.log(`Created template: ${t.title}`)
    }
}

seed()
