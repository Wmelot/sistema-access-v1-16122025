
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkOrgSlug() {
    const { data: orgs } = await supabase.from('organizations').select('id, slug, name');
    console.log("Organizations:", orgs);
}

checkOrgSlug();
