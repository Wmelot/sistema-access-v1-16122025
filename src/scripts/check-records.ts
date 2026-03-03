import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data: records } = await supabase.from('patient_records').select('id, created_by, professional_id, profiles!professional_id(id, full_name, council_number), patients!inner(name)').ilike('patients.name', '%Joseph%').order('created_at', { ascending: false }).limit(2)
    console.log("Records:", JSON.stringify(records, null, 2))
}
check()
