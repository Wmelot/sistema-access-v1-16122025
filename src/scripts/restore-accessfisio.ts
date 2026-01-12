
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const email = 'accessfisio@gmail.com'
    const password = 'Access@123' // Temporary password if user needs to login, or we just restore profile if auth user exists

    // 1. Check if auth user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    let userId = users?.find(u => u.email === email)?.id

    if (!userId) {
        console.log("Auth user not found. Creating...")
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        })
        if (createError) {
            console.error("Error creating user:", createError)
            return
        }
        userId = newUser.user.id
    } else {
        console.log("Auth user found:", userId)
    }

    // 2. Check/Create Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (!profile) {
        console.log("Profile missing. Creating...")
        // Get Master Role ID
        const { data: role } = await supabase.from('roles').select('id').eq('name', 'Master').single()

        const { error: insertError } = await supabase.from('profiles').insert({
            id: userId,
            email: email,
            full_name: 'Access Fisio Master',
            role_id: role?.id || null, // Best effort
            role: 'admin' // Legacy column
        })

        if (insertError) console.error("Error creating profile:", insertError)
        else console.log("Profile created successfully.")
    } else {
        console.log("Profile already exists.")
        // Ensure Master Role
        const { data: role } = await supabase.from('roles').select('id').eq('name', 'Master').single()
        if (profile.role_id !== role?.id) {
            await supabase.from('profiles').update({ role_id: role?.id, full_name: 'Access Fisio Master' }).eq('id', userId)
            console.log("Profile role updated to Master.")
        }
    }
}
run()
