
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function restoreMaster() {
    console.log("Restoring Master Role...")

    // 1. Create or Get Master Role
    let { data: masterRole } = await supabase.from('roles').select('id').eq('name', 'Master').single()

    if (!masterRole) {
        console.log("Creating 'Master' role...")
        const { data, error } = await supabase.from('roles').insert({
            name: 'Master',
            description: 'Acesso total ao sistema',
            is_system: true // Assuming this column exists based on context (system roles)
        }).select().single()

        if (error) {
            console.error("Error creating Master role:", error)
            return
        }
        masterRole = data
    }

    console.log("Master Role ID:", masterRole.id)

    // 2. Assign to User
    const email = 'wmelot@gmail.com'
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single()

    if (!profile) {
        console.error("User profile not found for", email)
        return
    }

    const { error: updateError } = await supabase.from('profiles').update({ role_id: masterRole.id }).eq('id', profile.id)

    if (updateError) {
        console.error("Error updating profile role:", updateError)
    } else {
        console.log("Successfully assigned Master role to", email)
    }
}

restoreMaster()
