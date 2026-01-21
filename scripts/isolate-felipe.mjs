
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function isolateFelipe() {
    console.log("--- ISOLANDO FELIPE FRANÇA ---")

    const email = 'teste@gmail.com'
    const newOrgName = 'Felipe França Clinic'

    // 1. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .single()

    if (!profile) {
        console.log(`Perfil não encontrado para ${email}`)
        return
    }

    // 2. Create New Organization
    const newOrgId = uuidv4()
    await supabase.from('organizations').insert({
        id: newOrgId,
        name: newOrgName,
        slug: 'felipe-franca-clinic',
        status: 'active'
    })

    // 3. Update Profile
    await supabase
        .from('profiles')
        .update({ organization_id: newOrgId })
        .eq('id', profile.id)

    console.log(`✅ ${email} movido para a nova organização: ${newOrgName}`)
}

isolateFelipe()
