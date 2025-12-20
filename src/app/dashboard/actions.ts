'use server'

import { createClient } from "@/lib/supabase/server"
import { getCurrentUserPermissions, hasPermission, isMasterUser } from "@/lib/rbac"
import { differenceInYears } from "date-fns"
import { getClinicSharedExpenses, getProfessionalPayments } from "./financial/actions" // Import for sync

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
        total: number     // Gross (Faturado)
        received: number  // Cash/Adiantamentos
        pending: number   // Net Result (Faturado - Taxas - Rateio - Recebido)
    }
    demographics: {
        men: number
        women: number
        children: number
        total: number
    }
    yearly_comparison: {
        appointments: { current: number[], last: number[] }
        revenue: { current: number[], last: number[] }
        completed: { current: number[], last: number[] }
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
            receivables: [],
            total_revenue: 0,
            total_expenses: 0
        }
    }

    // --- APPOINTMENTS DATA (For Charts) ---
    let query = supabase.from('appointments').select(`
        id,
        start_time, 
        status, 
        price,
        professional_id,
        patient:patients(gender, date_of_birth),
        service:services(name, category_id),
        payment_methods (
            name,
            fee_percent,
            fee_fixed
        )
    `)

    if (!canViewClinic && profile?.professional_id) {
        query = query.eq('professional_id', profile.professional_id)
    }

    const { data: appointments } = await query

    // --- AGGREGATION ---
    let my_gross = 0 // Was my_total
    let my_fees = 0

    let men = 0
    let women = 0
    let children = 0 // < 12 years

    // Yearly Arrays
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

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

    appointments?.forEach(app => {
        // Resolve Target Professional ID (Profile ID or Auth ID link)
        const myProfessionalId = profile?.professional_id

        const appDate = new Date(app.start_time) // Use start_time
        const year = appDate.getFullYear()
        const month = appDate.getMonth()
        const isSameMonth = month === currentMonth - 1
        const isSameYear = year === currentYear

        // --- My Finance (Filtered for Personal Widget) ---
        if (myProfessionalId && app.professional_id === myProfessionalId) {
            if (isSameMonth && isSameYear) {
                // --- [UPDATED] Financial Calculation Logic (Match My Statement) ---
                // We only count "Faturado" if status is completed/paid
                if (app.status === 'completed' || app.status === 'paid' || app.status === 'Concluído') {
                    const price = Number(app.price || 0)
                    my_gross += price

                    // Calculate Fee
                    const method = Array.isArray(app.payment_methods) ? app.payment_methods[0] : app.payment_methods
                    let appFee = 0
                    if (method) {
                        const pct = Number(method.fee_percent || 0)
                        const fixed = Number(method.fee_fixed || 0)
                        appFee = (price * pct / 100) + fixed
                    }
                    my_fees += appFee
                }
            }
        }

        // --- Yearly Comparison ---
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

        // --- Categories ---
        const s = Array.isArray(app.service) ? app.service[0] : app.service
        if (s) {
            const catName = (s as any).category || (s as any).category_id || 'Sem Categoria'
            categoryCounts[catName] = (categoryCounts[catName] || 0) + 1
        }
    })

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({ name: String(name), count }))

    // --- [NEW] Finalize My Finance Calculations ---
    let my_shared = 0
    let my_received = 0

    // Only fetch if we have a professional_id (Logic for "My Statement")
    const myProfId = profile?.professional_id
    if (myProfId) {
        // 1. Shared Expenses
        const canShare = await hasPermission('financial.share_expenses')
        if (canShare) {
            my_shared = await getClinicSharedExpenses(currentMonth, currentYear) || 0
        }

        // 2. Received Payments
        const payments = await getProfessionalPayments(user.id, currentMonth, currentYear)
        my_received = payments?.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0) || 0
    }

    const my_net = my_gross - my_fees - my_shared
    const my_final_pending = my_net - my_received

    return {
        birthdays: { today: birthdaysToday, week: birthdaysWeek },
        financials,
        my_finance: {
            total: my_gross,
            received: my_received,
            pending: my_final_pending
        },
        demographics: { men, women, children, total: appointments?.length || 0 },
        yearly_comparison: {
            appointments: { current: apptsCurrent, last: apptsLast },
            revenue: { current: revCurrent, last: revLast },
            completed: { current: compCurrent, last: compLast }
        },
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
