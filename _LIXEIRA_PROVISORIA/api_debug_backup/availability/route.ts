
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPublicAvailability } from '@/app/book/actions'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || '2026-01-13' // Default to the date in screenshot
    const email = searchParams.get('email') || 'wmelot@gmail.com' // User email

    const supabase = await createAdminClient()

    // 1. Get Professional ID from Email or Name
    let { data: profile } = await supabase.from('profiles').select('id, full_name').eq('email', email).single()

    if (!profile) {
        // Fallback to name search
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').ilike('full_name', '%Warley%').limit(1)
        profile = profiles?.[0]
    }

    if (!profile) return NextResponse.json({ error: 'Profile not found' })

    // 2. Get a Service (just valid one)
    const { data: services } = await supabase.from('service_professionals').select('service_id').eq('profile_id', profile.id).limit(1)
    const serviceId = services?.[0]?.service_id

    // 3. Call Availability (Trace mode if possible, but here we just check output)
    console.log(`[Debug] Checking availability for ${date}, Pro: ${profile.full_name}`)

    // We can't easily console.log inside the imported function without editing it.
    // Instead, let's replicate the basic checks here to see what's failing.

    const dayOfWeek = new Date(date + 'T12:00:00').getDay()

    // A. Check DB Availability
    const { data: dbAvail } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('day_of_week', dayOfWeek)

    // B. Check Google Integration
    const { data: integ } = await supabase
        .from('professional_integrations')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('provider', 'google_calendar')
        .single()

    let googleRanges = []
    if (integ) {
        try {
            // Import dynamically to avoid top-level await issues if any
            const { getCalendarEvents } = await import('@/lib/google')
            const timeMin = `${date}T00:00:00-03:00`
            const timeMax = `${date}T23:59:59-03:00`
            const events = await getCalendarEvents(integ.access_token, integ.refresh_token, new Date(timeMin).toISOString(), new Date(timeMax).toISOString())
            googleRanges = events.map((e: any) => ({ start: e.start.dateTime || e.start.date, end: e.end.dateTime || e.end.date }))
        } catch (e: any) {
            googleRanges.push({ error: e.message })
        }
    }

    // C. Run actual function
    const slots = await getPublicAvailability(profile.id, date, 30, serviceId)

    // D. Fetch details for context
    const { data: fullProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
    const { data: service } = await supabase.from('services').select('*').eq('id', serviceId).single()

    return NextResponse.json({
        profile: fullProfile,
        service: service,
        date,
        dayOfWeek,
        dbAvailability: dbAvail,
        googleIntegration: !!integ,
        googleBusySlots: googleRanges,
        finalSlots: slots
    })
}
