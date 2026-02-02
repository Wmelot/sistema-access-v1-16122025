
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkJan30() {
    const supabase = await createAdminClient()
    const professionalId = '839a77d3-a7f0-4103-bc4a-004ec550bd15' // Warley ID from prev logs
    const date = '2026-01-30'
    const dayStart = `${date}T00:00:00-03:00`
    const dayEnd = `${date}T23:59:59-03:00`

    const { data: apps, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('start_time', dayStart)
        .lte('end_time', dayEnd)

    console.log('Apps for Jan 30:', apps?.length, apps?.map(a => ({ id: a.id, status: a.status, type: a.type })))
}

checkJan30()
