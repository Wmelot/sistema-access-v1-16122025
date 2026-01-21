
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TARGET_USER_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15'
const CORRECT_ORG_ID = '9571532e-fdf8-4aaa-b236-416fd6459566'

async function fixUserOrg() {
    console.log(`Fixing organization for User: ${TARGET_USER_ID}`)
    console.log(`Setting Organization ID to: ${CORRECT_ORG_ID}`)

    const { data, error } = await supabase
        .from('profiles')
        .update({ organization_id: CORRECT_ORG_ID })
        .eq('id', TARGET_USER_ID)
        .select()

    if (error) {
        console.error('Error updating profile:', error)
    } else {
        console.log('Successfully updated profile:', data)
    }
}

fixUserOrg()
