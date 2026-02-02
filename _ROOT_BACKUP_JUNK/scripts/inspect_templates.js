
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplates() {
    console.log('--- Checking Message Templates ---');
    const { data: templates, error } = await supabase
        .from('message_templates')
        .select('*');

    if (error) {
        console.error('Error fetching templates:', error);
        return;
    }

    console.log(`Found ${templates.length} templates:`);
    templates.forEach(t => {
        console.log(`ID: ${t.id}`);
        console.log(`  Title: ${t.title}`);
        console.log(`  Trigger: ${t.trigger_type}`);
        console.log(`  Active: ${t.is_active}`);
        console.log(`  Content Preview: ${t.content.substring(0, 50)}...`);
        console.log('-----------------------------------');
    });
}

checkTemplates();
