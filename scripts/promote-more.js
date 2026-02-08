const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function promoteUsers() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const emails = ['sabrinaviana@pucminas.br', 'giselemdiniz@yahoo.com.br'];

    for (const email of emails) {
        console.log(`Promoting ${email}...`);
        const { error } = await supabase
            .from('academic_professors')
            .update({
                role: 'admin',
                permissions: {
                    canInvite: true,
                    canDelete: true,
                    canViewDashboard: true
                }
            })
            .ilike('email', email);

        if (error) {
            console.error(`Error promoting ${email}:`, error);
        } else {
            console.log(`${email} promoted successfully.`);
        }
    }
}

promoteUsers();
