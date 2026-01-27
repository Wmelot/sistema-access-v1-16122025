
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function checkJan29() {
    const supabase = await createAdminClient()
    const professionalId = '839a77d3-a7f0-4103-bc4a-004ec550bd15'
    const date = '2026-01-29'
    const dayStart = `${date}T00:00:00-03:00`
    const dayEnd = `${date}T23:59:59-03:00`

    const { data: apps } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, status, type, patients(name)')
        .eq('professional_id', professionalId)
        .gte('start_time', dayStart)
        .lte('end_time', dayEnd)

    console.log('Apps for Jan 29:', apps?.length, JSON.stringify(apps, null, 2))
}

checkJan29()
