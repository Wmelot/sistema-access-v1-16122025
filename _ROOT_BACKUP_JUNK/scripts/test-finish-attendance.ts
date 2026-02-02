import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const APPT_ID = '043a879e-0004-4d2d-8225-6d10ef20c299'

async function testFinish() {
    console.log("🧪 TESTING FINISH ATTENDANCE FLOW...")
    console.log("Appointment ID:", APPT_ID)

    // Step 1: Check current status
    const { data: before } = await client
        .from('appointments')
        .select('id, status, payment_method_id')
        .eq('id', APPT_ID)
        .single()
    
    console.log("BEFORE:", before)

    // Step 2: Try to update to 'completed'
    const { data: updated, error } = await client
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', APPT_ID)
        .select()
    
    if (error) {
        console.error("❌ UPDATE ERROR:", error)
        console.error("   Code:", error.code)
        console.error("   Details:", error.details)
        console.error("   Hint:", error.hint)
    } else {
        console.log("✅ UPDATED:", updated)
    }

    // Step 3: Check after
    const { data: after } = await client
        .from('appointments')
        .select('id, status, payment_method_id')
        .eq('id', APPT_ID)
        .single()
    
    console.log("AFTER:", after)
}

testFinish()
