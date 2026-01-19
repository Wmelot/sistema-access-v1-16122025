import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2'

async function checkDeps() {
    console.log("🕵️ CHECKING ALL TABLE DEPENDENCIES FOR PROFILE: " + OLD_ID)

    const tables = [
        'appointments',
        'patient_records',
        'financial_commissions',
        'professional_availability',
        'service_professionals',
        'professional_commission_rules',
        'professional_integrations',
        'user_template_preferences',
        'payment_methods', // created_by?
        'message_templates', // created_by?
        'patients', // created_by?
        'notifications', // user_id?
        'whatsapp_messages', // professional_id?
        'expenses' // professional_id?
    ]

    for (const table of tables) {
        // Try professional_id first
        let col = 'professional_id'
        if (table === 'professional_availability' || table === 'service_professionals') col = 'profile_id'
        if (table === 'notifications' || table === 'user_template_preferences') col = 'user_id'
        if (table === 'patients' || table === 'payment_methods' || table === 'message_templates') col = 'created_by' // Assuming audit col

        try {
            const { count, error } = await client
                .from(table)
                .select('*', { count: 'exact', head: true })
                .eq(col, OLD_ID)
            
            if (!error && count !== null && count > 0) {
                console.log(`⚠️ TABLE ${table}: ${count} records found (col: ${col})`)
            } else if (error && error.code !== '42703') { // Ignore column not found
                // Try alternate columns if standard failed or just log
                // console.log(`Use alternate for ${table}?`)
            }
        } catch (e) {
            // ignore
        }
    }
    
    // Check specific owner references in profiles too? No, we are deleting a profile.
}

checkDeps()
