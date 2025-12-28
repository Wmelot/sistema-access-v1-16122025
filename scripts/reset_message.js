
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
    console.log("Resetting failed message...");
    const { error } = await supabase
        .from('campaign_messages')
        .update({ status: 'pending', error_message: null })
        .eq('status', 'failed');

    if (error) console.error("Error resetting:", error);
    else console.log("Reset complete.");
}

reset();
