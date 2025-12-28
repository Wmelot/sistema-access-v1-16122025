
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use ANON key to simulate client/user

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars (Check .env.local)")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    // 1. Login
    const email = 'wmelot@gmail.com'
    const password = 'Wmelo@123'

    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
        console.error("Login failed:", authError.message)
        return
    }

    console.log("Logged in:", auth.user.id)

    // 2. Try Upsert
    const { error: upsertError } = await supabase
        .from('api_integrations')
        .upsert({
            provider: 'zapi',
            config: { test: 'debug' },
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'provider' })

    if (upsertError) {
        console.error("Upsert failed:", upsertError)
    } else {
        console.log("Upsert successful!")
    }
}

test()
