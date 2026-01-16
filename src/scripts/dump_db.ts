
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dumpFormTemplates() {
    console.log('Fetching form templates...');
    const { data, error } = await supabase
        .from('form_templates')
        .select('id, title, is_locked, deleted_at, type');

    if (error) {
        console.error('Error fetching templates:', error);
        return;
    }

    console.log(`Found ${data.length} templates:`);
    data.forEach((t) => {
        console.log(`[${t.id}] ${t.title} (Locked: ${t.is_locked}, Deleted: ${t.deleted_at ? 'YES' : 'NO'}, Type: ${t.type})`);
    });
}

dumpFormTemplates();
