import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log("🔍 CHECKING USERS vs PROFILES...")

    // Get all auth users
    const { data: authData } = await client.auth.admin.listUsers()
    const authUsers = authData.users || []
    console.log(`Total Auth Users: ${authUsers.length}`)

    // Get all profiles
    const { data: profiles } = await client
        .from('profiles')
        .select('id, email, full_name, organization_id')
    
    console.log(`Total Profiles: ${profiles?.length || 0}`)

    // Find users without profiles
    const usersWithoutProfiles = authUsers.filter(u => 
        !profiles?.some(p => p.id === u.id)
    )

    if (usersWithoutProfiles.length > 0) {
        console.log(`\n❌ Users WITHOUT Profiles (${usersWithoutProfiles.length}):`)
        usersWithoutProfiles.forEach(u => {
            console.log(`  - ${u.email} (ID: ${u.id})`)
        })
    } else {
        console.log("\n✅ All users have profiles!")
    }

    // Find profiles without auth users
    const profilesWithoutAuth = profiles?.filter(p => 
        !authUsers.some(u => u.id === p.id)
    ) || []

    if (profilesWithoutAuth.length > 0) {
        console.log(`\n⚠️ Profiles WITHOUT Auth Users (${profilesWithoutAuth.length}):`)
        profilesWithoutAuth.forEach(p => {
            console.log(`  - ${p.email} (ID: ${p.id})`)
        })
    }

    // Check organization distribution
    console.log("\n📊 Organization Distribution:")
    const orgGroups = profiles?.reduce((acc: any, p) => {
        const orgId = p.organization_id || 'NULL'
        acc[orgId] = (acc[orgId] || 0) + 1
        return acc
    }, {})
    
    Object.entries(orgGroups || {}).forEach(([orgId, count]) => {
        console.log(`  - Org ${orgId}: ${count} users`)
    })
}

check()
