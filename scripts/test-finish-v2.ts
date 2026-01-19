import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const APPT_ID = '043a879e-0004-4d2d-8225-6d10ef20c299'

async function testFinish() {
    console.log("🧪 TESTING FINISH WITH 'attended' STATUS...")
    
    const { data: before } = await client
        .from('appointments')
        .select('id, status')
        .eq('id', APPT_ID)
        .single()
    
    console.log("BEFORE:", before)

    const { data: updated, error } = await client
        .from('appointments')
        .update({ status: 'attended' })
        .eq('id', APPT_ID)
        .select()
    
    if (error) {
        console.error("❌ ERROR:", error.message)
    } else {
        console.log("✅ SUCCESS! Updated to:", updated[0].status)
    }

    const { data: after } = await client
        .from('appointments')
        .select('id, status')
        .eq('id', APPT_ID)
        .single()
    
    console.log("AFTER:", after)
}

testFinish()
