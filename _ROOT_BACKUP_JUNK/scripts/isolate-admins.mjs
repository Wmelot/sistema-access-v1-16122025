
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function isolateLostAdmins() {
    console.log("--- ISOLANDO ADMINISTRADORES PERDIDOS ---")

    const adminsToFix = [
        { email: 'testuser@axiom.com', name: 'Test User Clinic' },
        { email: 'Teste@testmail.com', name: 'Teste 3 Clinic' }
    ]

    for (const admin of adminsToFix) {
        // 1. Get Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, organization_id')
            .eq('email', admin.email)
            .single()

        if (!profile) {
            console.log(`Perfil não encontrado para ${admin.email}`)
            continue
        }

        // 2. Create New Organization
        const newOrgId = uuidv4()
        const slug = admin.name.toLowerCase().replace(/ /g, '-')

        const { error: orgError } = await supabase.from('organizations').insert({
            id: newOrgId,
            name: admin.name,
            slug: slug,
            status: 'active'
        })

        if (orgError) {
            console.error(`Erro ao criar org para ${admin.email}:`, orgError)
            continue
        }

        // 3. Update Profile to the NEW Org
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ organization_id: newOrgId })
            .eq('id', profile.id)

        if (updateError) {
            console.error(`Erro ao atualizar perfil de ${admin.email}:`, updateError)
        } else {
            console.log(`✅ ${admin.email} movido para a nova organização: ${admin.name}`)
        }
    }
}

isolateLostAdmins()
