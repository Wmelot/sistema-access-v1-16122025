import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function checkConstraint() {
    console.log("🔍 CHECKING STATUS CONSTRAINT...")
    
    // Try different status values to see which ones work
    const testStatuses = ['completed', 'attended', 'billed', 'finished', 'done']
    
    for (const status of testStatuses) {
        const { error } = await client
            .from('appointments')
            .update({ status })
            .eq('id', '043a879e-0004-4d2d-8225-6d10ef20c299')
        
        if (error) {
            console.log(`❌ '${status}' - BLOCKED: ${error.message}`)
        } else {
            console.log(`✅ '${status}' - ALLOWED`)
            // Revert back
            await client
                .from('appointments')
                .update({ status: 'in_progress' })
                .eq('id', '043a879e-0004-4d2d-8225-6d10ef20c299')
        }
    }
}

checkConstraint()
