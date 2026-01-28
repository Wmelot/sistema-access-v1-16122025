import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function checkDb() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log("Checking database state...")

    const { data: orgs } = await supabase.from('organizations').select('id, name')
    console.log("Organizations:", orgs)

    const { data: users } = await supabase.from('profiles').select('id, full_name, organization_id')
    console.log("Profiles:", users)

    const { data: pms } = await supabase.from('payment_methods').select('id, name, active')
    console.log("Payment Methods:", pms)

    const { data: brands } = await supabase.from('card_brands').select('id, name, organization_id, active')
    console.log("Card Brands:", brands)

    const { data: fees } = await supabase.from('payment_method_fees').select('id, method, installments, organization_id')
    console.log("Payment Fees Count:", fees?.length)
}

checkDb()
