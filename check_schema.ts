import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'form_templates' });
    if (error) {
        // Fallback: try to select one row
        const { data: row, error: rError } = await supabase.from('form_templates').select('*').limit(1);
        if (rError) {
            console.error(rError);
        } else {
            console.log('Columns:', Object.keys(row[0] || {}));
        }
    } else {
        console.log(data);
    }
}

checkSchema();
