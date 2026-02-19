import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const newForms = [
        {
            id: '50000000-0000-0000-0000-000000000001',
            title: 'Palmilha Biomecânica V3',
            type: 'assessment',
            is_locked: true
        },
        {
            id: '50000000-0000-0000-0000-000000000002',
            title: 'Ultimate PBE (Fusão)',
            type: 'assessment',
            is_locked: true
        },
        {
            id: '50000000-0000-0000-0000-000000000003',
            title: 'PBE 3.0: Tree Wizard (IA)',
            type: 'assessment',
            is_locked: true
        },
        {
            id: '50000000-0000-0000-0000-000000000004',
            title: 'Evolução Clínica & IA',
            type: 'evolution',
            is_locked: true
        }
    ];

    const { error } = await supabase.from('form_templates').upsert(newForms);
    if (error) {
        console.error(error);
    } else {
        console.log("Forms inserted successfully!");
    }
}
main();
