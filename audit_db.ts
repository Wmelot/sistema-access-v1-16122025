import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditForms() {
    console.log('--- FORM USAGE AUDIT ---');

    // 1. Fetch all templates
    const { data: templates, error: tError } = await supabase
        .from('form_templates')
        .select('id, title, type, is_active')
        .order('title');

    if (tError) {
        console.error(tError);
        return;
    }

    // 2. Count usage for each template
    const { data: usage, error: uError } = await supabase
        .from('patient_records')
        .select('template_id');

    if (uError) {
        console.error(uError);
        return;
    }

    const usageCounts = usage.reduce((acc: any, curr: any) => {
        if (curr.template_id) {
            acc[curr.template_id] = (acc[curr.template_id] || 0) + 1;
        }
        return acc;
    }, {});

    const report = templates.map(t => ({
        ID: t.id,
        Title: t.title,
        Type: t.type,
        Active: t.is_active,
        UsageCount: usageCounts[t.id] || 0
    }));

    console.table(report);
}

auditForms();
