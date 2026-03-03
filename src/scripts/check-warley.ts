import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data: d2, error: e2 } = await supabase.from('profiles').select('*').ilike('full_name', '%Warley%')
    console.log("Warley profile:", d2?.[0])
}
check()
