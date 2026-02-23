import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!supabaseUrl || !supabaseKey) { console.error("Missing env test variables"); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data } = await supabase.from('assessment_follow_ups').select('*').eq('status', 'pending');
    console.log("Pending followups:", data?.length)
    if (data && data.length > 0) {
        const target = data[0]
        const nowLocal = new Date().toISOString()
        const { error } = await supabase.from('assessment_follow_ups').update({ scheduled_date: nowLocal }).eq('id', target.id)
        if (error) console.error(error)
        console.log("Modified", target.id, "to trigger NOW.")
        console.log("Patient ID:", target.patient_id)
        console.log("Questionnaire Type:", target.questionnaire_type)
        
        console.log("Triggering CRON...")
        const r = await fetch('http://localhost:3000/api/cron/process-followups')
        const json = await r.json()
        console.log(JSON.stringify(json, null, 2))
    } else {
        console.log("Não há nenhum agendamento de follow up pendente. Finalize uma Avaliação de Palmilha 5.0 primeiro gerando um follow up de 40 dias.")
    }
}
run()
