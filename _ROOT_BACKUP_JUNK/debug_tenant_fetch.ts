import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTenant() {
    const id = '00000000-0000-0000-0000-000000000001';
    console.log(`Fetching ID: ${id}`);

    const { data, error } = await supabase
        .from('organizations')
        .select(`
            *,
            plan_config:plan_configs (
                id, name, slug, features, max_professionals
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error("FULL ERROR OBJECT:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success:", data);
    }
}

debugTenant();
