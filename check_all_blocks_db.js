const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
    const { data: blocks, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('type', 'block')
        .order('start_time');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- All Blocks in DB ---');
    blocks.forEach(b => {
        console.log(`${b.start_time} to ${b.end_time} | Notes: ${b.notes} | AllDay: ${b.all_day}`);
    });
})();
