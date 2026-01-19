import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const OLD_ID = '0273dd3c-996a-4d40-8fea-eb89118345b2'
const NEW_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15'

async function migrate() {
    console.log(`🔄 MIGRATING DATA FROM ${OLD_ID} TO ${NEW_ID}`)

    // 1. Appointments
    const { data: appts, error: apptErr } = await client
        .from('appointments')
        .select('id')
        .eq('professional_id', OLD_ID)
    
    if (apptErr) console.error("Error checking appointments:", apptErr)
    else console.log(`FOUND ${appts.length} appointments linked to OLD user.`)

    if (appts && appts.length > 0) {
        const { error: updateErr } = await client
            .from('appointments')
            .update({ professional_id: NEW_ID })
            .eq('professional_id', OLD_ID)
        
        if (updateErr) console.error("❌ Failed to migrate appointments:", updateErr)
        else console.log("✅ Appointments migrated successfully.")
    }

    // 2. Patient Records
    const { data: records } = await client.from('patient_records').select('id').eq('professional_id', OLD_ID)
    console.log(`FOUND ${records?.length || 0} patient records linked to OLD user.`)

    if (records && records.length > 0) {
        const { error: recErr } = await client
            .from('patient_records')
            .update({ professional_id: NEW_ID })
            .eq('professional_id', OLD_ID)
        
        if (recErr) console.error("❌ Failed to migrate records:", recErr)
        else console.log("✅ Patient Records migrated successfully.")
    }

    // 3. Financial Commissions
    const { data: comms } = await client.from('financial_commissions').select('id').eq('professional_id', OLD_ID)
    console.log(`FOUND ${comms?.length || 0} commissions linked to OLD user.`)
     if (comms && comms.length > 0) {
        const { error: commErr } = await client
            .from('financial_commissions')
            .update({ professional_id: NEW_ID })
            .eq('professional_id', OLD_ID)
        
        if (commErr) console.error("❌ Failed to migrate commissions:", commErr)
        else console.log("✅ Commissions migrated successfully.")
    }

    // 4. Cleanup Blocking Tables (Availability, Rules - Delete OLD to avoid conflicts)
    console.log("🧹 Cleaning up auxiliary tables for OLD user...")
    
    await client.from('professional_availability').delete().eq('profile_id', OLD_ID)
    await client.from('professional_commission_rules').delete().eq('professional_id', OLD_ID)
    // Add any other dependent tables necessary
    await client.from('service_professionals').delete().eq('profile_id', OLD_ID)

    console.log("🎉 Migration Clean-up Complete. You should now be able to delete the old user via UI.")

}

migrate()
