import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fix() {
    const warleyId = '839a77d3-a7f0-4103-bc4a-004ec550bd15';
    // Update Joseph's record specifically and completely
    const { error } = await supabase.from('patient_records').update({
        professional_id: warleyId,
        created_by: '8bc0ee91-3fcf-4cb5-ae00-c9a40539efae' // Assuming this is Warley's user_id, but professional_id is the main fix
    }).eq('id', '1a7b6f95-80f0-414d-9041-11c82a2eab61');
    console.log("Updated record error?", error)
}
fix()
