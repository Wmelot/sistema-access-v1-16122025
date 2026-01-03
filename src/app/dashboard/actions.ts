'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getCurrentUserPermissions, hasPermission, isMasterUser } from "@/lib/rbac"
import { differenceInYears } from "date-fns"


// --- TYPES ---
export interface DashboardMetrics {
    birthdays: {
        today: any[]
        week: any[]
        debug?: any
    }
    financials: { // Master only
        payables: any[]
        receivables: any[]
        total_revenue: number
        total_expenses: number
    } | null
    my_finance: { // Professional
        total: number     // Gross (Faturado)
        received: number  // Cash/Adiantamentos
        pending: number   // Net Result (Faturado - Taxas - Rateio - Recebido)
        debug?: any
    }
    demographics: {
        men: number
        women: number
        children: number
        total: number
        debug?: any
    }
    yearly_comparison: {
        appointments: { current: number[], last: number[] }
        revenue: { current: number[], last: number[] }
        completed: { current: number[], last: number[] }
        debug?: any
    }
    categories: { name: string, count: number }[]
}

export async function getDashboardMetrics(professionalId?: string | null): Promise<DashboardMetrics> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Get basic user info to filter if needed
    const { data: profile } = await supabase.from('profiles').select('id, professional_id').eq('id', user.id).single()
    const isMaster = await isMasterUser()
    const canViewClinic = await hasPermission('financial.view_clinic')

    // --- 1. BIRTHDAYS (Public/All) ---
    // [FIX] Use Admin Client to bypass RLS for this specific global widget
    const adminSupabase = await createAdminClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to midnight

    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const lastYear = currentYear - 1

    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    nextWeek.setHours(23, 59, 59, 999)

    // Fetch all patients for birthdays
    const { data: patients, error: patientsError } = await adminSupabase
        .from('patients')
        .select('id, name, date_of_birth')
        .not('date_of_birth', 'is', null)

    // [NEW] Fetch Professionals for birthdays
    const { data: professionals, error: prosError } = await adminSupabase
        .from('profiles')
        .select('id, full_name, date_of_birth, role, color')
        .not('date_of_birth', 'is', null)


    const birthdaysToday: any[] = []
    const birthdaysWeek: any[] = []

    // Helper to process list
    const checkBirthdays = (list: any[], type: 'patient' | 'professional') => {
        if (!list) return
        list.forEach(p => {
            const dobString = p.date_of_birth
            if (!dobString) return

            const name = type === 'patient' ? p.name : `${p.full_name} (${p.role || 'Prof.'})`
            // Prefer professional_profile_color, fallback to color
            const color = p.professional_profile_color || p.color || null

            // Robust Date Parsing
            const [year, month, day] = dobString.split('-').map(Number)

            // Birthday this year
            const bdayThisYear = new Date(today.getFullYear(), month - 1, day)
            bdayThisYear.setHours(0, 0, 0, 0)

            // Birthday next year
            const bdayNextYear = new Date(today.getFullYear() + 1, month - 1, day)
            bdayNextYear.setHours(0, 0, 0, 0)

            const personData = { ...p, name, color } // Normalize name and add color


            // 1. Check Today
            if (bdayThisYear.getTime() === today.getTime()) {
                birthdaysToday.push(personData)
                return
            }

            // 2. Check Upcoming
            if (bdayThisYear > today && bdayThisYear <= nextWeek) {
                birthdaysWeek.push(personData)
            } else if (bdayNextYear > today && bdayNextYear <= nextWeek) {
                birthdaysWeek.push(personData)
            }
        })
    }

    checkBirthdays(patients || [], 'patient')
    checkBirthdays(professionals || [], 'professional')

    // [LEGACY - TO REMOVE]
    /* if (patients) {
        patients.forEach(p => {
            if (!p.date_of_birth) return
    
            // Robust Date Parsing (YYYY-MM-DD to avoid Timezone issues)
            const [year, month, day] = p.date_of_birth.split('-').map(Number)
    
            // Birthday this year
            const bdayThisYear = new Date(today.getFullYear(), month - 1, day)
            bdayThisYear.setHours(0, 0, 0, 0)
    
            // Birthday next year (for year wrap-around checks)
            const bdayNextYear = new Date(today.getFullYear() + 1, month - 1, day)
            bdayNextYear.setHours(0, 0, 0, 0)
    
            // 1. Check Today
            if (bdayThisYear.getTime() === today.getTime()) {
                birthdaysToday.push(p)
                return // Found, skip week check
            }
    
            // 2. Check Upcoming (Next 7 days)
            // Case A: Normal (e.g., Today is March 1, Bday is March 5)
            if (bdayThisYear > today && bdayThisYear <= nextWeek) {
                birthdaysWeek.push(p)
            }
            // Case B: Year Wrap (e.g., Today is Dec 30, Bday is Jan 2)
            else if (bdayNextYear > today && bdayNextYear <= nextWeek) {
                birthdaysWeek.push(p)
            }
        })
    } */

    // --- FINANCIALS (Clinic Wide) ---
    let financials = null
    if (canViewClinic) {
        // Fetch Payables
        // Fetch Payables (Due in next 5 days + Overdue)
        const limitDate = new Date()
        limitDate.setDate(limitDate.getDate() + 5)
        const limitDateStr = limitDate.toISOString().split('T')[0]

        const { data: payables } = await supabase
            .from('transactions')
            .select('description, amount, due_date')
            .eq('type', 'expense')
            .eq('status', 'pending')
            .lte('due_date', limitDateStr) // Due date <= Today + 5
            .order('due_date', { ascending: true })
        // .limit(5) // Removed limit to show all in that range

        financials = {
            payables: payables || [],
            receivables: [],
            total_revenue: 0,
            total_expenses: 0
        }
    }

    // --- APPOINTMENTS DATA (For Charts) ---
    // Optimization: If professionalId is explicitly passed (and user is Master/Admin or it's their own), use it.
    // If "all" (professionalId === 'all'), fetch everything (clinic view).
    // If not passed, default to current logic (view all if Master, view self if not).

    let targetProfId: string | null = null

    if (professionalId === 'all') {
        // Explicitly requesting ALL data
        targetProfId = null
    } else if (professionalId) {
        // Specific professional
        targetProfId = professionalId
    } else {
        // Default behavior
        if (!canViewClinic && profile?.professional_id) {
            targetProfId = profile?.professional_id
        }
    }

    let query = supabase.from('appointments').select(`
    id,
    start_time, 
    status, 
    price,
    professional_id,
    payment_method_id,
    patient:patients(gender, date_of_birth),
    service:services(name),
    invoices:invoice_id (status, payment_method)
`)

    if (targetProfId) {
        query = query.eq('professional_id', targetProfId)
    }

    const { data: appointments, error: apptError } = await query

    if (apptError) {
        console.error("Dashboard Metrics - Appointments Query Error:", apptError)
        return {
            birthdays: { today: [], week: [] },
            financials: null,
            my_finance: { total: 0, received: 0, pending: 0, debug: { error: apptError.message } },
            demographics: { men: 0, women: 0, children: 0, total: 0 },
            yearly_comparison: { appointments: { current: [], last: [] }, revenue: { current: [], last: [] }, completed: { current: [], last: [] } },
            categories: []
        }
    }

    // --- AGGREGATION ---
    let my_gross = 0 // Was my_total
    let my_received = 0
    let my_pending = 0 // [NEW] Track pending manually based on appointments

    let men = 0
    let women = 0
    let children = 0 // < 12 years

    // Yearly Arrays
    // const currentYear = new Date().getFullYear() // Already defined above
    // const lastYear = currentYear - 1 // Already defined above

    // 1. Appointments Count
    const apptsCurrent = new Array(12).fill(0)
    const apptsLast = new Array(12).fill(0)
    // 2. Revenue
    const revCurrent = new Array(12).fill(0)
    const revLast = new Array(12).fill(0)
    // 3. Completed Count
    const compCurrent = new Array(12).fill(0)
    const compLast = new Array(12).fill(0)

    const categoryCounts: Record<string, number> = {}

    const myProfId = profile?.professional_id || user.id // [FIX] Fallback to own ID if not linked to another

    appointments?.forEach(app => {
        // Resolve Target Professional ID (Profile ID or Auth ID link)
        // [FIX] Use Brazil Timezone for Month/Year calculation to avoid shifting end-of-month appts to next month (UTC)
        const appDateRaw = new Date(app.start_time)
        const brazilDateStr = appDateRaw.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
        const appDate = new Date(brazilDateStr)

        const year = appDate.getFullYear()
        const month = appDate.getMonth()
        const isSameMonth = month === currentMonth - 1
        const isSameYear = year === currentYear

        // --- My Finance (Always filtered for current logged in user for that widget) ---
        // Even if we are viewing "All" on the Yearly chart, My Finance should stay "My Finance".
        // HOWEVER, "appointments" variable might contain EVERYONE's appointments now if targetProfId is null.
        // So we strictly check app.professional_id === myProfId inside this loop.
        if (myProfId && app.professional_id === myProfId) {
            if (isSameMonth && isSameYear && app.status !== 'cancelled') {
                // --- [UPDATED] Financial Calculation Logic (Match Reports) ---
                const price = Number(app.price || 0)

                // 1. Faturado (Total Billed): Count ALL non-cancelled (Includes Scheduled) to match Report 'Total Faturado'
                my_gross += price

                // 2. Recebido vs Pendente
                // Check Invoice Status logic
                const invoicePaid = (app as any).invoices?.status === 'paid'

                // Matches Report Logic: Completed/Paid OR Invoice Paid = Received; Otherwise Pending
                const isCompleted = app.status === 'completed' || app.status === 'paid' || app.status === 'Concluído'
                const hasPayment = !!app.payment_method_id

                if (invoicePaid || (isCompleted && hasPayment)) {
                    my_received += price
                } else {
                    my_pending += price
                }
            }
        }

        // --- Yearly Comparison ---
        // "appointments" is already filtered by targetProfId (or All).
        // So we just aggregate what we have.
        const price = Number(app.price || 0)
        const isCompleted = app.status === 'completed' || app.status === 'paid' || app.status === 'Concluído'

        if (year === currentYear) {
            apptsCurrent[month]++
            if (isCompleted) {
                compCurrent[month]++
                revCurrent[month] += price
            }
        } else if (year === lastYear) {
            apptsLast[month]++
            if (isCompleted) {
                compLast[month]++
                revLast[month] += price
            }
        }

        // --- Demographics ---
        const p = Array.isArray(app.patient) ? app.patient[0] : app.patient
        if (p) {
            if (p.gender === 'Masculino') men++
            else if (p.gender === 'Feminino') women++

            if (p.date_of_birth) {
                const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
                if (age < 12) children++
            }
        }

        // --- Categories (Now Services) ---
        // User requested to see percentage of services (e.g. "Consulta Fisioterapia", "Palmilha")
        const s = Array.isArray(app.service) ? app.service[0] : app.service
        if (s) {
            const serviceName = (s as any).name || 'Outros'
            categoryCounts[serviceName] = (categoryCounts[serviceName] || 0) + 1
        }
    })

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({ name: String(name), count }))

    // --- [REMOVED] Old Calculation Logic (My Statement / Payouts) ---
    // We now calculate directly in the loop to match Reports Page exactly.

    return {
        birthdays: {
            today: birthdaysToday,
            week: birthdaysWeek,
        },
        financials,
        my_finance: {
            total: my_gross,
            received: my_received,
            pending: my_pending,
        },
        demographics: {
            men, women, children, total: appointments?.length || 0,
        },
        yearly_comparison: {
            appointments: { current: apptsCurrent, last: apptsLast },
            revenue: { current: revCurrent, last: revLast },
            completed: { current: compCurrent, last: compLast },
        },
        categories
    }
}

export async function getYearlyMetrics(professionalId?: string | null) {
    const metrics = await getDashboardMetrics(professionalId)
    return metrics.yearly_comparison
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
    const API_KEY = (process.env.GOOGLE_PLACES_API_KEY || '').trim()
    const PLACE_ID = (process.env.GOOGLE_PLACE_ID || '').trim()

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
            next: { revalidate: 3600 } // Cache 1h
        })

        if (!res.ok) {
            console.error(`Google Places API Error: ${res.status} ${res.statusText}`)
            return null
        }

        const data = await res.json()
        console.log(`Google Reviews Fetched: ${data.reviews?.length} reviews`)
        return data
    } catch (error) {
        console.error("Failed to fetch Google Reviews:", error)

        // [FALLBACK] Return Mock Data so UI isn't empty (User Request)
        // This helps when API key is invalid or quota exceeded
        return {
            rating: 5.0,
            userRatingCount: 127,
            googleMapsUri: "https://www.google.com/maps", // Generic fallback
            reviews: [
                {
                    name: "mock/review/1",
                    rating: 5,
                    publishTime: new Date().toISOString(),
                    originalText: { text: "Atendimento excelente! Profissionais muito atenciosos e ambiente super agradável. Recomendo muito." },
                    authorAttribution: { displayName: "Ana Silva" }
                },
                {
                    name: "mock/review/2",
                    rating: 5,
                    publishTime: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
                    originalText: { text: "Melhor clínica de fisioterapia da região. O tratamento foi muito eficaz para minha recuperação." },
                    authorAttribution: { displayName: "Carlos Mendes" }
                },
                {
                    name: "mock/review/3",
                    rating: 5,
                    publishTime: new Date(Date.now() - 86400000 * 5).toISOString(),
                    originalText: { text: "Equipe fantástica e estrutura de primeira." },
                    authorAttribution: { displayName: "Roberto Santos" }
                }
            ]
        }
    }
}
