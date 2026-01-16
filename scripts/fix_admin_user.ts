
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars. Please ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function fixUser() {
    const email = 'wmelot@gmail.com'
    const password = '123' // Simpler password for testing

    console.log(`Fixing user: ${email}...`)

    // 1. Delete if exists
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users.users.find(u => u.email === email)

    if (user) {
        console.log(`Deleting existing user ${user.id}...`)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteError) {
            console.error('Error deleting user:', deleteError)
            // Proceed anyway, maybe update works
        } else {
            console.log('User deleted.')
        }
    }

    // 2. Create User
    console.log(`Creating user ${email} with password '${password}'...`)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Warley Melo' }
    })

    if (createError) {
        console.error('Error creating user:', createError)
        return
    }

    console.log('User created successfully:', newUser.user?.id)

    // 3. Link profile (via manual SQL or ensuring the profile exists)
    // We rely on the app to handle profile, or the trigger. 
    // If trigger exists, it should have run.
}

fixUser()
