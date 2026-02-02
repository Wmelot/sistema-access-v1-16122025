import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    const { data: perms } = await client
        .from('permissions')
        .select('code, description, module')
        .order('module, code')

    console.log("📋 Old System Permissions (for visualization matrix):\n")
    
    const byModule: Record<string, any[]> = {}
    perms?.forEach(p => {
        if (!byModule[p.module]) byModule[p.module] = []
        byModule[p.module].push(p)
    })

    Object.entries(byModule).forEach(([module, items]) => {
        console.log(`\n${module.toUpperCase()}:`)
        items.forEach(item => {
            console.log(`  - ${item.code}`)
            console.log(`    Label: "${item.description}"`)
        })
    })
}

check()
