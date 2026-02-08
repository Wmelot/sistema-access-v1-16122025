const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function promoteMarcia() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("Promoting Márcia Colamarco...");
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
        .eq('email', 'colamarcom@gmail.com');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Márcia promoted successfully.");
    }
}

promoteMarcia();
