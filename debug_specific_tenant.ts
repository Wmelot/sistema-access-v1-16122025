import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugSpecific() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ID from the user screenshot
    const id = '6b934eec-e8ad-44be-bcc6-848b8b9355a0';
    console.log(`Checking ID: ${id}`);

    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("ERROR Fetching Org:", error);
    } else {
        console.log("Org Found:", data?.name);
    }
}

debugSpecific();
