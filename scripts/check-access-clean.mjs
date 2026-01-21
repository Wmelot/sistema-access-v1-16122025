
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAccessUsers() {
    const ACCESS_ORG_ID = '9571532e-fdf8-4aaa-b236-416fd6459566'

    const { data: profiles } = await supabase
        .from('profiles')
        .select('full_name, email, organization_id')
        .eq('organization_id', ACCESS_ORG_ID)

    console.log("Usuários Atuais na Access Fisioterapia:")
    console.table(profiles)
}

checkAccessUsers()
