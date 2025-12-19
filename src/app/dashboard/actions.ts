'use server'

import { createClient } from "@/lib/supabase/server"
import { getCurrentUserPermissions, hasPermission, isMasterUser } from "@/lib/rbac"
import { differenceInYears } from "date-fns"

// --- TYPES ---
export interface DashboardMetrics {
    birthdays: {
        today: any[]
        week: any[]
    }
    financials: { // Master only
        payables: any[]
        receivables: any[]
        total_revenue: number
        total_expenses: number
    } | null
    my_finance: { // Professional
        total: number
        pending_commissions: number
    }
    demographics: {
        men: number
        women: number
        children: number
        total: number
    }
    yearly_comparison: {
        current_year: number[] // Jan-Dec
        last_year: number[] // Jan-Dec
    }
    categories: { name: string, count: number }[]
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Get basic user info to filter if needed
    const { data: profile } = await supabase.from('profiles').select('id, professional_id').eq('id', user.id).single()
    const isMaster = await isMasterUser()
    const canViewClinic = await hasPermission('financial.view_clinic')

    // --- 1. BIRTHDAYS (Public/All) ---
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth() + 1 // getMonth is 0-indexed

    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    // Fetch all patients for birthdays (usually safely visible to all pros)
    const { data: patients } = await supabase
        .from('patients')
        .select('id, name, date_of_birth, mobile') // Added mobile back
        .not('date_of_birth', 'is', null)

    const birthdaysToday: any[] = []
    const birthdaysWeek: any[] = []

    if (patients) {
        patients.forEach(p => {
            const dob = new Date(p.date_of_birth + 'T12:00:00') // adjust TZ
            const bMonth = dob.getMonth() + 1
            const bDay = dob.getDate()

            // Check Today
            if (bMonth === currentMonth && bDay === currentDay) {
                birthdaysToday.push(p)
            } else {
                // Check Week (Simple logic: set year to current year and compare dates)
                const currentYearBdate = new Date(today.getFullYear(), dob.getMonth(), bDay)
                if (currentYearBdate > today && currentYearBdate <= nextWeek) {
                    birthdaysWeek.push(p)
                }
                // Edge case: End of year wrap around? Not critical for MVP.
            }
        })
    }

    // --- FINANCIALS (Clinic Wide) ---
    let financials = null
    if (canViewClinic) {
        // Fetch Payables
        const { data: payables } = await supabase
            .from('financial_payables')
            .select('description, amount, due_date') // Adjusted select to match original structure
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(5)

        financials = {
            payables: payables || [],
            receivables: [], // Todo: fetch incoming invoices if needed
            total_revenue: 0, // Todo: calculate if needed
            total_expenses: 0 // Todo: calculate if needed
        }
    }

    // --- APPOINTMENTS DATA (For Charts) ---
    // If Master/ViewClinic -> Fetch ALL appointments
    // If Professional -> Fetch ONLY their appointments
    let query = supabase.from('appointments').select(`
        id,
        date, 
        status, 
        price,
        professional_id,
        patient:patients(gender, date_of_birth),
        service:services(name, category_id)
    `)

    if (!canViewClinic && profile?.professional_id) {
        query = query.eq('professional_id', profile.professional_id)
    }

    const { data: appointments } = await query

    // --- AGGREGATION ---
    let my_total = 0
    let my_pending = 0

    let men = 0
    let women = 0
    let children = 0 // < 12 years

    // Yearly
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1
    const monthlyCurrent = new Array(12).fill(0)
    const monthlyLast = new Array(12).fill(0)

    const categoryCounts: Record<string, number> = {}

    appointments?.forEach(app => {
        // My Finance (If filtering worked above, this is simple. But wait, MyFinance is SPECIFIC to me even if I am Master?)
        // Actually, Master might want to see CLINIC total in charts, but default MyFinance widget is "MY Production".
        // If I am Master, MyFinance might show MY production as a pro, or 0 if I'm just admin.
        // Let's refine:
        // If we fetched ALL appointments (Master), we need to filter specifically for "My Finance" widget which is personal.
        // If we fetched OWN appointments (Pro), then total is same.


        // My Finance (Filtered for Personal Widget)
        if (app.professional_id === user.id) {
            const appDate = new Date(app.date + 'T12:00:00')
            // Fix: currentMonth is 1-12, getMonth is 0-11
            const isSameMonth = appDate.getMonth() === (currentMonth - 1)
            const isSameYear = appDate.getFullYear() === currentYear

            // Debug Logging for "Minha Produção" (Remove later)
            // console.log(`[Metric Debug] App ID: ${app.id}, Date: ${app.date}, Status: ${app.status}, Value: ${app.price}, MatchMonth: ${isSameMonth}, MatchYear: ${isSameYear}`)

            if (isSameMonth && isSameYear) {
                const price = Number(app.price || 0)

                // Total = Completed (Production)
                // Note: User says "widget is zero". 
                // Maybe 'status' is something else? e.g. "Completed" (Capitalized)? No, usually DB is lowercase.
                // We check 'completed' OR 'paid'.
                // If the user marked it as "Atendido" in the view, what string is that?
                // The select in list-view uses 'completed'.

                if (app.status === 'completed' || app.status === 'paid' || app.status === 'Concluído') { // Added 'Concluído' just in case of dirty data
                    my_total += price
                }

                // Pending = Scheduled/Confirmed
                if (app.status === 'scheduled' || app.status === 'confirmed') {
                    my_pending += price
                }
            }
        }

        // Demographics
        const p = Array.isArray(app.patient) ? app.patient[0] : app.patient
        if (p) {
            if (p.gender === 'Masculino') men++
            else if (p.gender === 'Feminino') women++

            if (p.date_of_birth) {
                const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
                if (age < 12) children++
            }
        }

        // Yearly Comparison
        const d = new Date(app.date)
        const year = d.getFullYear()
        const month = d.getMonth()
        if (year === currentYear) monthlyCurrent[month]++
        if (year === lastYear) monthlyLast[month]++

        // Categories
        const s = Array.isArray(app.service) ? app.service[0] : app.service
        if (s) {
            // Check for category field. If it's an ID, we might just show ID for MVP or "Categoria " + ID
            // If it's a joined object `category:categories(name)`, use that.
            // Let's assume `category_id` is what we have.
            const catName = (s as any).category || (s as any).category_id || 'Sem Categoria'
            categoryCounts[catName] = (categoryCounts[catName] || 0) + 1
        }
    })

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({ name: String(name), count }))

    return {
        birthdays: { today: birthdaysToday, week: birthdaysWeek },
        financials,
        my_finance: {
            total: my_total,
            pending_commissions: my_pending
        },
        demographics: { men, women, children, total: appointments?.length || 0 },
        yearly_comparison: { current_year: monthlyCurrent, last_year: monthlyLast },
        categories
    }
}

export async function fetchGeNews() {
    // GE RSS Feed URL (General Sports or football)
    // Atlético-MG Feed
    const RSS_URL = 'https://pox.globo.com/rss/ge/futebol/times/atletico-mg/'
    // Fallback if that one doesn't exist/work:
    // https://pox.globo.com/rss/ge/

    try {
        const res = await fetch(RSS_URL, { next: { revalidate: 3600 } }) // Cache 1h
        if (!res.ok) throw new Error(`Failed to fetch RSS: ${res.status}`)
        const xml = await res.text()

        // Simple regex parse to avoid heavy XML parser deps for MVP
        // Matches <item>...</item>
        const items = []
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let match

        while ((match = itemRegex.exec(xml)) !== null) {
            const inner = match[1]
            const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(inner) || /<title>(.*?)<\/title>/.exec(inner)
            const linkMatch = /<link>(.*?)<\/link>/.exec(inner)
            const dateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(inner)

            if (titleMatch && linkMatch) {
                items.push({
                    title: titleMatch[1],
                    link: linkMatch[1],
                    pubDate: dateMatch ? new Date(dateMatch[1]).toLocaleDateString('pt-BR') : ''
                })
            }
            if (items.length >= 5) break
        }
        return items
    } catch (error) {
        console.error("RSS Error:", error)
        return []
    }
}

export async function fetchGoogleReviews() {
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY
    const PLACE_ID = process.env.GOOGLE_PLACE_ID

    if (!API_KEY || !PLACE_ID) {
        // Return null so widget knows it's not configured
        return null
    }

    // Google Places API (New)
    // https://developers.google.com/maps/documentation/places/web-service/place-details
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=pt-BR`

    try {
        const res = await fetch(url, {
            headers: {
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'reviews,rating,userRatingCount,googleMapsUri'
            },
            next: { revalidate: 3600 * 12 } // Cache 12h
        })

        if (!res.ok) {
            console.error(`Google Places API Error: ${res.status} ${res.statusText}`)
            return null
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error("Failed to fetch Google Reviews:", error)
        return null
    }
}
