import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log('--- Fixing Fernanda Appointments ---');
    const ids = [
        '83836a16-f8f1-4c0d-aa6e-71d52a1a674d',
        'd79f0464-ec35-43a5-9271-bfbd7d58a58a'
    ];

    for (const id of ids) {
        const { data: appt } = await supabase.from('appointments').select('start_time').eq('id', id).single();
        if (appt) {
            const start = new Date(appt.start_time);
            const end = new Date(start.getTime() + 45 * 60000); // Reset to 45 min
            const { error } = await supabase.from('appointments').update({
                end_time: end.toISOString()
            }).eq('id', id);

            if (error) console.error(`Error fixing ${id}:`, error);
            else console.log(`Fixed appointment ${id}: end_time set to ${end.toISOString()}`);
        }
    }
}

fix();
