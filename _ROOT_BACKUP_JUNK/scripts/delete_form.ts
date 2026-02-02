
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function deleteForm() {
    const title = 'Consulta Palmilha 2.0';
    console.log(`Searching for form: "${title}"...`);

    const { data: form, error } = await supabase
        .from('form_templates')
        .select('id, title, deleted_at')
        .ilike('title', `%${title}%`)
        .single();

    if (error || !form) {
        console.error("Form not found or error:", error);
        return;
    }

    console.log(`Found form: ${form.title} (ID: ${form.id})`);

    const { error: deleteError } = await supabase
        .from('form_templates')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', form.id);

    if (deleteError) {
        console.error("Error deleting form:", deleteError);
    } else {
        console.log("Successfully soft-deleted form.");
    }
}

deleteForm();
