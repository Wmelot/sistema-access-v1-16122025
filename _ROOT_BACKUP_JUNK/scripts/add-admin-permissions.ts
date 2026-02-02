import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function addAdminPerms() {
    console.log("🔧 Adding permissions to Admin role...")

    // Get Admin role
    const { data: adminRole } = await client
        .from('roles')
        .select('id, name')
        .eq('name', 'Admin')
        .single()

    if (!adminRole) {
        console.log("❌ Admin role not found")
        return
    }

    console.log(`Found Admin role: ${adminRole.id}`)

    // Get Master role to copy permissions
    const { data: masterRole } = await client
        .from('roles')
        .select('id')
        .eq('name', 'Master')
        .single()

    if (!masterRole) {
        console.log("❌ Master role not found")
        return
    }

    // Get all Master permissions
    const { data: masterPerms } = await client
        .from('granular_permissions' as any)
        .select('module, action, granted')
        .eq('role_id', masterRole.id)

    if (!masterPerms || masterPerms.length === 0) {
        console.log("❌ No Master permissions found")
        return
    }

    console.log(`Found ${masterPerms.length} Master permissions`)

    // Remove duplicates by module+action
    const uniquePerms = Array.from(
        new Map(masterPerms.map((p: any) => [`${p.module}.${p.action}`, p])).values()
    )

    console.log(`Creating ${uniquePerms.length} unique permissions for Admin...`)

    // Create admin permissions
    const adminPermissions = uniquePerms.map((p: any) => ({
        role_id: adminRole.id,
        module: p.module,
        action: p.action,
        granted: p.granted
    }))

    const { error } = await client
        .from('granular_permissions' as any)
        .upsert(adminPermissions, { onConflict: 'role_id,module,action' })

    if (error) {
        console.error("❌ Error:", error)
    } else {
        console.log("✅ Admin permissions created successfully!")

        // Verify
        const { count } = await client
            .from('granular_permissions' as any)
            .select('*', { count: 'exact', head: true })
            .eq('role_id', adminRole.id)
            .eq('granted', true)

        console.log(`📊 Admin now has ${count} granted permissions`)
    }
}

addAdminPerms()
