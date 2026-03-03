import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data: profs } = await supabase.from('profiles').select('id, full_name, user_id').ilike('full_name', '%Warley%');
    console.log("Warley Profile:", profs);

    if (profs && profs[0]) {
         const warleyId = profs[0].id;
         const warleyUserId = profs[0].user_id;

         // This will correctly link the professional back to the appointment for Joseph.
         const res = await supabase.from('appointments').update({
              professional_id: warleyId
         }).eq('id', '42090c7d-c4d0-4844-93fb-46bd6229a1d3');
         console.log('Appt update:', res.error ? res.error : 'success')

         const res2 = await supabase.from('patient_records').update({
              professional_id: warleyId,
              created_by: warleyUserId
         }).eq('id', '1a7b6f95-80f0-414d-9041-11c82a2eab61');
         
         console.log('Record update:', res2.error ? res2.error : 'success')
     }
}
check()
