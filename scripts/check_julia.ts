import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: patients } = await supabase.from('patients').select('id, name').ilike('name', '%Júlia Vianini%');
    console.log("Patients:", patients);

    if (patients && patients.length > 0) {
        const { data: records } = await supabase.from('patient_records').select('id, template_id, content, created_at').eq('patient_id', patients[0].id).order('created_at', { ascending: false }).limit(5);
        console.log("Records:");
        records?.forEach(r => console.log(r.id, r.template_id, Object.keys(r.content || {}).length, r.created_at));
    }
}

check();
