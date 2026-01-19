import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function compare() {
    console.log("🔍 Comparing permission systems...\n")

    // Get old system permissions
    const { data: oldPerms } = await client
        .from('permissions')
        .select('code, description, module')
        .order('module, code')

    // Get new system permissions (unique module+action combinations)
    const { data: newPerms } = await client
        .from('granular_permissions' as any)
        .select('module, action')

    const uniqueNew = Array.from(
        new Set(newPerms?.map((p: any) => `${p.module}.${p.action}`) || [])
    )

    console.log("📊 Old System Permissions:")
    console.log(`   Total: ${oldPerms?.length || 0}`)
    oldPerms?.forEach(p => {
        console.log(`   - ${p.code} (${p.module})`)
    })

    console.log(`\n�� New System Permissions:`)
    console.log(`   Total: ${uniqueNew.length}`)
    uniqueNew.forEach(p => {
        console.log(`   - ${p}`)
    })

    console.log(`\n🔄 Missing in New System:`)
    const oldCodes = oldPerms?.map(p => p.code) || []
    const missing = oldCodes.filter(code => {
        // Try to match old code to new module.action
        return !uniqueNew.some(newPerm => newPerm.includes(code.split('.')[1]))
    })
    
    if (missing.length > 0) {
        missing.forEach(m => console.log(`   ❌ ${m}`))
    } else {
        console.log("   ✅ All old permissions are covered!")
    }
}

compare()
