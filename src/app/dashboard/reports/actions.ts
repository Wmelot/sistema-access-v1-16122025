'use server'

import { createClient } from "@/lib/supabase/server"

// [DEBUGGING] Enhanced Error Logging
export async function getFinancialReport(searchParams: {
    startDate?: string // YYYY-MM-DD
    endDate?: string   // YYYY-MM-DD
    professionalId?: string
    status?: string
}) {
    const supabase = await createClient()

    try {
        // [SECURITY] Enforce RLS-like logic for Reports
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: [], totals: { billed: 0, received: 0, pending: 0 }, error: 'Unauthorized' }

        // Fetch Profile with Role Name
        const { data: profile } = await supabase.from('profiles')
            .select('id, role:roles(name)')
            .eq('id', user.id)
            .single()

        const roleName = (profile?.role as any)?.name || ''
        const canViewAll = ['master', 'manager', 'admin', 'sócio', 'socio'].includes(roleName.toLowerCase())
        let targetProfId = searchParams.professionalId

        // If restricted user tries to view others, force their own ID
        if (!canViewAll) {
            targetProfId = user.id
        }

        let query = supabase.from('appointments')
            .select(`
                *,
                patients ( id, name ),
                profiles ( id, full_name ),
                services ( id, name, price ),
                payment_methods ( id, name ),
                invoices ( status )
            `)
            .neq('status', 'cancelled') // Exclude cancelled
            .order('start_time', { ascending: false })

        // Date Filters
        if (searchParams.startDate) query = query.gte('start_time', `${searchParams.startDate}T00:00:00-03:00`)
        if (searchParams.endDate) query = query.lte('start_time', `${searchParams.endDate}T23:59:59-03:00`)

        // Professional Filter
        if (targetProfId && targetProfId !== 'all') {
            query = query.eq('professional_id', targetProfId)
        }

        // Status Filter
        if (searchParams.status && searchParams.status !== 'all') {
            query = query.eq('status', searchParams.status)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching financial report:', error)
            return { data: [], totals: { billed: 0, received: 0, pending: 0 }, error: `DB Error: ${error.message}` }
        }

        // Calculate Totals
        let billed = 0
        let received = 0
        let pending = 0
        const enrichedData = data.map(appt => {
            const price = Number(appt.price || 0)
            const invoiceStatus = appt.invoices?.status // joined single

            // Logic: If Invoice exists, Trust Invoice Status.
            // If No Invoice, Check if Completed & Payment Method.

            let payment_status = 'scheduled'

            if (invoiceStatus === 'paid') {
                payment_status = 'paid'
            } else if (invoiceStatus === 'pending') {
                payment_status = 'pending'
            } else {
                // Fallback for legacy / non-invoiced
                const isCompleted = appt.status === 'completed' || appt.status === 'Realizado'
                const hasPayment = !!appt.payment_method_id

                if (isCompleted && hasPayment) payment_status = 'paid'
                else if (isCompleted && !hasPayment) payment_status = 'pending'
                else payment_status = 'scheduled'
            }

            billed += price
            if (payment_status === 'paid') {
                received += price
            } else if (payment_status === 'pending') {
                pending += price
            }

            return {
                ...appt,
                price,
                payment_status
            }
        })

        // Group Debtors logic ...
        // (Simplified for brevity as logic was correct, focusing on headers/errors)
        // Group Debtors logic
        const debtorsMap = new Map()
        enrichedData.forEach(appt => {
            if (appt.payment_status === 'pending' && appt.patients) {
                const patientId = appt.patients.id
                if (!debtorsMap.has(patientId)) {
                    debtorsMap.set(patientId, {
                        patientId: patientId,
                        patientName: appt.patients.name,
                        count: 0,
                        totalDebt: 0,
                        appointments: []
                    })
                }
                const debtor = debtorsMap.get(patientId)
                debtor.count += 1
                debtor.totalDebt += (appt.price || 0)
                debtor.appointments.push({
                    id: appt.id,
                    date: appt.start_time,
                    service: appt.services?.name,
                    price: appt.price
                })
            }
        })

        const debtors = Array.from(debtorsMap.values()).sort((a, b) => b.totalDebt - a.totalDebt)

        return {
            data: enrichedData,
            debtors: debtors,
            totals: { billed, received, pending }
        }

    } catch (e: any) {
        console.error('Critical Error fetching financial report:', e)
        return { data: [], totals: { billed: 0, received: 0, pending: 0 }, error: `System Error: ${e.message || JSON.stringify(e)}` }
    }
}

export async function getProfessionalsList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // [FIX] Fetch role name correctly via Foreign Key OR Legacy Column
    const { data: profile, error: profileError } = await supabase.from('profiles')
        .select('id, full_name, role, role_data:roles(name)')
        .eq('id', user.id)
        .single()

    if (profileError) console.error("Profile Fetch Error:", profileError)

    // Robust Role Check: Try Relation Name -> Fallback to Legacy Column -> Empty
    const roleName = (profile?.role_data as any)?.name || profile?.role || ''

    // Logic: 
    // If Master/Admin/Manager/Sócio -> Return list of ALL professionals
    const canViewAll = ['master', 'manager', 'admin', 'sócio', 'socio'].includes(roleName.toLowerCase())

    if (canViewAll) {
        // Fetch ALL professionals
        const { data, error } = await supabase.from('profiles')
            .select('id, full_name')
            .order('full_name')

        if (error) {
            console.error('getProfessionalsList Error:', error)
            // Fallback to debug label if RLS blocks list
            return [{ id: user.id, full_name: `Erro RLS: ${error.message}` }]
        }

        return data || []
    } else {
        // Restricted to self - DEBUGGING LABEL
        const debugLabel = profile ? `Eu (${roleName || 'Sem Role'})` : `Eu (Erro Perfil: ${profileError?.message || 'Nulo'})`
        return [{ id: user.id, full_name: debugLabel }]
    }
}

// [NEW] Clinic Expenses for Transparency Tab (Master/Sócio only)
export async function getClinicExpenses() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: [], error: 'Unauthorized' }

        // Check if user is Master or Sócio
        const { data: profile } = await supabase.from('profiles')
            .select('id, role:roles(name)')
            .eq('id', user.id)
            .single()

        const roleName = (profile?.role as any)?.name || ''
        const canView = ['master', 'sócio', 'socio'].includes(roleName.toLowerCase())

        if (!canView) {
            return { data: [], error: 'Forbidden: Only Masters and Partners can view clinic expenses' }
        }

        // Use admin client to bypass RLS
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminSupabase = await createAdminClient()

        // Fetch expenses from transactions table (type = 'expense')
        const { data, error } = await adminSupabase
            .from('transactions')
            .select('id, description, amount, due_date, status, date')
            .eq('type', 'expense')
            .order('due_date', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching clinic expenses:', error)
            return { data: [], error: `DB Error: ${error.message}` }
        }

        return { data: data || [], error: null }
    } catch (err: any) {
        console.error('Unexpected error in getClinicExpenses:', err)
        return { data: [], error: err.message }
    }
}


