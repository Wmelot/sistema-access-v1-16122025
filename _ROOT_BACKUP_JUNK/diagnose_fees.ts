import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function checkDb() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log("Checking database state...")

    const { data: fees } = await supabase.from('payment_method_fees').select('id, method, installments, card_brand_id, organization_id')
    console.log("Payment Fees:", fees)
}

checkDb()
