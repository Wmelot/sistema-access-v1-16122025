import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function translate() {
    console.log("🔄 Translating module name 'system' to 'Sistema'...\n")

    const { error } = await client
        .from('permissions')
        .update({ module: 'Sistema' })
        .eq('module', 'system')

    if (error) {
        console.log(`❌ Error: ${error.message}`)
    } else {
        console.log("✅ Module name updated to Portuguese!")
    }
}

translate()
