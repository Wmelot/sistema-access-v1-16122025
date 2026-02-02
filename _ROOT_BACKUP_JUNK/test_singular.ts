
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function testSingular() {
    const supabase = await createAdminClient()
    const { data: org, error: orgError } = await supabase.from('organization').select('id, name').limit(1)
    console.log('Lookup organization (singular):', { success: !orgError, error: orgError?.message })

    const { data: join, error: joinError } = await supabase.from('appointments').select('id, organization(name)').limit(1)
    console.log('Join organization (singular):', { success: !joinError, error: joinError?.message })
}

testSingular()
