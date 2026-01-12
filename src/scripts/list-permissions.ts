
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    const { data: perms, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module')
        .order('code')

    if (error) {
        console.error("Error fetching permissions:", error)
        return
    }

    if (!perms) {
        console.log("No permissions found.")
        return
    }

    // Group by module
    const grouped = perms.reduce((acc: any, p: any) => {
        const mod = p.module || 'Geral'
        if (!acc[mod]) acc[mod] = []
        acc[mod].push(p)
        return acc
    }, {})

    console.log(JSON.stringify(grouped, null, 2))
}

run()
