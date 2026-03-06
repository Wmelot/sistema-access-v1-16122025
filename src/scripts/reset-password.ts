
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
// Use Service Role Key for Admin actions
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const email = 'accessfisio@gmail.com'
    const newPassword = 'Wmelo@123'

    console.log(`--- Checking User: ${email} ---`)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error("Error listing users:", listError)
        return
    }

    const targetUser = users.find(u => u.email === email)

    if (!targetUser) {
        console.error("CRITICAL: User not found in Auth system!")
        // Create it if missing?
        console.log("Creating user...")
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: newPassword,
            email_confirm: true,
            user_metadata: { full_name: 'Access Fisio Master' }
        })
        if (createError) console.error("Error creating:", createError)
        else console.log("User created successfully with password:", newPassword)
    } else {
        console.log("User found:", targetUser.id)
        console.log("Resetting password...")
        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
            password: newPassword
        })
        if (updateError) console.error("Error resetting password:", updateError)
        else console.log("Password reset successfully to:", newPassword)
    }

    // List all users to prove existence
    console.log("\n--- Active Users List (Auth) ---")
    users.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`))
}
run()
