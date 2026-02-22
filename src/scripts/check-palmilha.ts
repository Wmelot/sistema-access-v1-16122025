import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseAdminUrl, supabaseAdminKey);

async function checkPalmilha() {
    const { data: forms, error } = await adminSupabase
        .from('form_templates')
        .select('id, title, is_active, organization_id')
        .ilike('title', '%Palmilha%');

    if (error) {
        console.error('Error fetching forms:', error);
        return;
    }

    console.log('Found forms:', forms);
}

checkPalmilha();
