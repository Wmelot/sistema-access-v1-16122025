
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const { error } = await supabase
        .from('profiles')
        .update({ full_name: 'Warley Melo' })
        .eq('email', 'wmelot@gmail.com')

    if (error) {
        console.error("Error updating profile:", error)
    } else {
        console.log("Profile updated successfully: Warley Melo")
    }
}
run()
