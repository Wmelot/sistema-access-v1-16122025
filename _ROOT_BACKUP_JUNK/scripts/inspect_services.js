
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing env vars");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching one service...");
    const { data: services, error } = await supabase.from('services').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Service Sample:", services[0]);
    }
}

main();
