
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function restoreUser() {
    const email = 'wmelot@gmail.com'
    const password = 'Wmelo@123'

    console.log(`Attempting to restore user: ${email}`)

    // Check if user exists first (though likely deleted)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    const existing = users.users.find(u => u.email === email)

    if (existing) {
        console.log('User already exists. Updating password...')
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existing.id,
            { password: password, user_metadata: { role: 'admin' } } // Ensure admin metadata if needed
        )
        if (updateError) {
            console.error('Error updating password:', updateError)
        } else {
            console.log('Password updated successfully.')
        }
    } else {
        console.log('User not found. Creating...')
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        })

        if (createError) {
            console.error('Error creating user:', createError)
        } else {
            console.log('User created successfully:', data.user.id)

            // Also need to ensure profile exists if triggered by DB but let's check profile
            // The trigger on auth.users usually creates the profile.
            // I'll wait a bit? No, just let it be.
        }
    }
}

restoreUser()
