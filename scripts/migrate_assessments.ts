
import { createClient } from '@supabase/supabase-js';
import { ASSESSMENTS } from '../src/app/dashboard/patients/components/assessments/definitions';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mimic createAdminClient logic inline
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('No Service Role Key found in environment. Cannot bypass RLS.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function migrate() {
    console.log('Starting migration of assessments with COMPACT LAYOUT...');

    // 1. DELETE EXISTING to apply new layout
    const { error: deleteError } = await supabase.from('form_templates').delete().eq('type', 'assessment');
    if (deleteError) {
        console.error('Error clearing old templates:', deleteError);
    } else {
        console.log('Cleared existing assessment templates.');
    }

    for (const [key, def] of Object.entries(ASSESSMENTS)) {
        console.log(`Processing ${def.title}...`);

        // Convert fields with Layout Logic
        const fields = def.questions.map((q, index) => {
            // Map types
            let type = 'text';
            let options = undefined;

            // Default width
            let width = '100';

            if (q.type === 'binary' || q.type === 'mcq') {
                type = 'radio_group';
                options = q.options?.map(o => ({
                    label: o.label,
                    value: o.value.toString()
                }));
                // Use 50% width for binary/mcq to save space (2 columns)
                // Unless options are very long? We assume standard short answers.
                width = '50';
            } else if (q.type === 'scale') {
                type = 'radio_group';
                options = q.options?.map(o => ({
                    label: o.label,
                    value: o.value.toString()
                }));
                // Scales often vertical, but if 0-10 or short text, 50% is good.
                width = '50';
            } else if (q.type === 'vas') {
                type = 'radio_group'; // Horizontal layout by default in form renderer for radio?
                // Actually FormRenderer radio is vertical usually.
                // But 2 cols helps.
                options = Array.from({ length: (q.max || 10) - (q.min || 0) + 1 }, (_, i) => ({
                    label: String(i + (q.min || 0)),
                    value: String(i + (q.min || 0))
                }));
                width = '100'; // Full width for VAS slider/radios to fit 11 options
            }

            // Override for specific official formats?
            // STarT Back: Yes/No. 50% is good.
            // Roland Morris: Checkboxes? If binary yes/no, 50% ok.

            return {
                id: q.id,
                type,
                label: q.text,
                width,
                required: true,
                options
            };
        });

        const { error } = await supabase.from('form_templates').insert({
            title: def.title,
            description: def.description,
            type: 'assessment',
            fields: fields,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        if (error) {
            console.error(`Error inserting ${def.title}:`, error);
        } else {
            console.log(`+ Migrated: ${def.title}`);
        }
    }
}

migrate();
