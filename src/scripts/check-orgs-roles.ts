
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    console.log('--- ORGANIZATIONS ---')
    const { data: orgs } = await supabase.from('organizations').select('id, name')
    console.log(JSON.stringify(orgs, null, 2))

    console.log('--- PROFILES (accessfisio vs wmelot) ---')
    const { data: profiles } = await supabase.from('profiles').select('email, organization_id, role_id, roles(name)').in('email', ['wmelot@gmail.com', 'accessfisio@gmail.com'])
    console.log(JSON.stringify(profiles, null, 2))

    console.log('--- ROLES ---')
    const { data: roles } = await supabase.from('roles').select('id, name, organization_id')
    // console.log(JSON.stringify(roles, null, 2)) // Too big maybe?
    // Filter for Master roles
    const masterRoles = roles?.filter(r => r.name === 'Master')
    console.log('Master Roles:', JSON.stringify(masterRoles, null, 2))
}
run()
