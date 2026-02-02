import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditForms() {
    const { data: templates } = await supabase.from('form_templates').select('id, title, type, is_active').order('title');
    const { data: usage } = await supabase.from('patient_records').select('template_id');

    const usageCounts = usage?.reduce((acc: any, curr: any) => {
        if (curr.template_id) acc[curr.template_id] = (acc[curr.template_id] || 0) + 1;
        return acc;
    }, {}) || {};

    console.log('| ID (Curto) | Título | Tipo | Ativo | Uso |');
    console.log('| :--- | :--- | :--- | :--- | :--- |');
    templates?.forEach(t => {
        const shortId = t.id.substring(0, 8) + '...';
        console.log(`| \`${shortId}\` | ${t.title} | ${t.type} | ${t.is_active} | **${usageCounts[t.id] || 0}** |`);
    });
}

auditForms();
