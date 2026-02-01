
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteUnwantedTemplates() {
    const targets = [
        'Palmilha pé insensível',
        'Palmilha biomecânica'
    ];

    console.log(`Searching for templates to delete: ${targets.join(', ')}`);

    for (const title of targets) {
        // Soft delete
        const { error, data } = await supabase
            .from('form_templates')
            .update({ deleted_at: new Date().toISOString() })
            .eq('title', title)
            .select();

        if (error) {
            console.error(`Error deleting ${title}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Deleted ${data.length} instances of "${title}"`);
        } else {
            console.log(`No active instances found for "${title}"`);
        }
    }
}

deleteUnwantedTemplates();
