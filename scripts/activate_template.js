
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function activateTemplate() {
    console.log('--- Activating Feedback Template ---');

    // Update the specific template for post_attendance
    const { data, error } = await supabase
        .from('message_templates')
        .update({ is_active: true })
        .eq('trigger_type', 'post_attendance')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Activated:', data);
    }
}

activateTemplate();
