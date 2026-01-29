
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrphans() {
    const tables = ['profiles', 'patients', 'appointments', 'waiting_list', 'invoices', 'services', 'professionals'];
    console.log("--- Database Orphan Audit (missing organization_id) ---");

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .is('organization_id', null);

        if (error) {
            console.error(`Error checking table ${table}:`, error.message);
        } else {
            console.log(`${table.padEnd(15)}: ${count} orphans`);
        }
    }
}

checkOrphans();
