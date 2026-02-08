const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function promoteTatiana() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("Promoting Tatiana to Admin...");
    const { data, error } = await supabase
        .from('academic_professors')
        .update({
            role: 'admin',
            permissions: {
                canInvite: true,
                canDelete: true,
                canViewDashboard: true
            }
        })
        .ilike('name', '%Tatiana%');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Tatiana promoted successfully.");
    }
}

promoteTatiana();
