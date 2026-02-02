import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const TARGET_ID = '76796223-7c04-4dcf-99e8-f97f4e90b5bb' // wmeloto@gmail.com

async function destroy() {
    console.log("🔥 DESTROYING WARLEY OLIVEIRA (" + TARGET_ID + ")...")

    // 1. Unlink Foreign Keys (Blindly try all potential tables)
    const tables = [
        'appointments', 'patient_records', 'financial_commissions', 
        'professional_availability', 'service_professionals', 
        'professional_commission_rules', 'professional_integrations',
        'transactions', 'expenses'
    ]

    for (const table of tables) {
        // Try deleting rows owned by this user
        const col = (table === 'professional_availability' || table === 'service_professionals') ? 'profile_id' : 'professional_id'
        
        try {
            const { count, error } = await client.from(table).delete({ count: 'exact' }).eq(col, TARGET_ID)
            if (!error) console.log(`✅ Cleaned ${table}: ${count} rows.`)
            else console.log(`⚠️ Error cleaning ${table}: ${error.message}`)
        } catch (e) { console.log(`Skipping ${table}`) }
    }

    // 2. Delete Profile
    const { error: pErr } = await client.from('profiles').delete().eq('id', TARGET_ID)
    if (pErr) console.log("❌ Profile Delete Error:", pErr)
    else console.log("✅ Profile Deleted.")

    // 3. Delete Auth User
    const { error: uErr } = await client.auth.admin.deleteUser(TARGET_ID)
    if (uErr) console.log("❌ Auth Delete Error:", uErr)
    else console.log("✅ Auth User Deleted.")
}

destroy()
