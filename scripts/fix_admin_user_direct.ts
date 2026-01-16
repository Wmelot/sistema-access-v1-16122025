
import { createClient } from '@supabase/supabase-js'

// HARDCODED CREDENTIALS (BYPASSING DOTENV ISSUES)
const supabaseUrl = 'https://robptuukezhqvtasjyhz.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function fixUser() {
    const email = 'wmelot@gmail.com'
    const password = '123' // SIMPLE PASSWORD

    console.log(`Fixing user (Direct): ${email}...`)

    // 1. Delete if exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) console.error('List Error:', listError)

    const user = users?.users?.find(u => u.email === email)

    if (user) {
        console.log(`Deleting existing user ${user.id}...`)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteError) {
            console.error('Error deleting user:', deleteError)
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

    console.log('SUCCESS! User created:', newUser.user?.id)
}

fixUser()
