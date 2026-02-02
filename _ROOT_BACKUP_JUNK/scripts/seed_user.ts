
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedUser() {
    const email = 'wmelot@gmail.com'
    const password = 'Wmelo@123'

    console.log(`Attempting to create user ${email}...`)

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Dr. W Melo' }
    })

    if (error) {
        console.error("Error creating user:", error.message)
    } else {
        console.log("User created successfully:", data.user?.id)
    }
}

seedUser()
