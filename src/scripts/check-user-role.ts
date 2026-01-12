
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
    // Check Roles
    const { data: roles } = await supabase.from('roles').select('*')
    console.log('Roles found:', roles?.length)
    if (roles) console.log(roles.map(r => r.name))

    // Check Profile
    const { data: profile } = await supabase.from('profiles').select('*, roles(*)').eq('email', 'wmelot@gmail.com').single()
    console.log('Profile found:', !!profile)
    if (profile) {
        console.log('Profile Role:', profile.roles?.name || 'No Role')
        console.log('Profile ID:', profile.id)
    }
}
check()
