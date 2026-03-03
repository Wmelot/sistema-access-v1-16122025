import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data } = await supabase.from('patient_records').select('id, created_by, professional_id, patient_id').order('created_at', { ascending: false }).limit(5)
    console.log("Recent records:", JSON.stringify(data, null, 2))
}
check()
