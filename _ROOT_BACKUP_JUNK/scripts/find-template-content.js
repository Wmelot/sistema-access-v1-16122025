
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function find() {
    // We can't easily search JSONB content via API filter like 'ilike' on the fields array if it's complex.
    // But we can fetch ALL templates and filter in JS if the count is low.
    const { data, error } = await supabase.from('form_templates').select('*');
    if (error) { console.error(error); return; }

    const found = data.filter(t => {
        const str = JSON.stringify(t);
        return str.includes('Pineau') || str.includes('VO2');
    });

    console.log(`Found ${found.length} templates matching 'Pineau' or 'VO2'.`);
    found.forEach(t => {
        console.log(`ID: ${t.id}`);
        console.log(`Title: ${t.title}`);
        console.log(`IsActive: ${t.is_active}`);
        console.log(`DeletedAt: ${t.deleted_at}`);
        console.log('---');
    });
}
find();
