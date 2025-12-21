
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use Anon key or Service Role if available
// If we need to bypass RLS, we should use SERVICE_ROLE_KEY if available in .env.local, 
// but often it's SUPABASE_SERVICE_ROLE_KEY. Let's try ANON first, but public data might be restricted.
// Actually, for local dev, usually the user is authenticated. 
// Let's use the Service Role Key if I can find it, otherwise Anon.
// Check if SUPABASE_SERVICE_ROLE_KEY exists in env.

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey!)

async function main() {
    console.log("Checking Birthdays for Next 7 Days...")
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    console.log("Today:", today.toISOString())

    // Fetch all patients with DOB
    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('name, date_of_birth')
        .not('date_of_birth', 'is', null)

    if (pError) console.error("Patient Error:", pError)

    // Fetch all profiles with DOB
    const { data: profiles, error: prError } = await supabase
        .from('profiles')
        .select('full_name, date_of_birth')
        .not('date_of_birth', 'is', null)

    if (prError) console.error("Profile Error:", prError)

    const all = [
        ...(patients || []).map(p => ({ ...p, type: 'Patient', name: p.name })),
        ...(profiles || []).map(p => ({ ...p, type: 'Professional', name: p.full_name }))
    ]

    console.log(`Found ${all.length} people with birthdays. Scanning...`)

    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    nextWeek.setHours(23, 59, 59, 999)

    const upcoming = all.filter(p => {
        if (!p.date_of_birth) return false
        const [y, m, d] = p.date_of_birth.split('-').map(Number)

        const bdayThisYear = new Date(today.getFullYear(), m - 1, d)
        bdayThisYear.setHours(0, 0, 0, 0)

        const bdayNextYear = new Date(today.getFullYear() + 1, m - 1, d)
        bdayNextYear.setHours(0, 0, 0, 0)

        const matches = (bdayThisYear >= today && bdayThisYear <= nextWeek) ||
            (bdayNextYear >= today && bdayNextYear <= nextWeek)

        if (matches) {
            console.log(`[MATCH] ${p.type}: ${p.name} - DOB: ${p.date_of_birth} (Target: ${bdayThisYear.toLocaleDateString()})`)
        }
        return matches
    })

    if (upcoming.length === 0) {
        console.log("NO UPCOMING BIRTHDAYS FOUND IN DB LOGIC.")
        console.log("Closest birthdays (sample):")
        // Show 5 random people for debugging
        all.slice(0, 5).forEach(p => console.log(`- ${p.name}: ${p.date_of_birth}`))
    } else {
        console.log(`\nFound ${upcoming.length} upcoming birthdays.`)
    }
}

main()
