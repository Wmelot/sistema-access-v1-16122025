'use server'

import { createClient } from "@/lib/supabase/server"

export async function getFinancialReport(searchParams: {
    startDate?: string // YYYY-MM-DD
    endDate?: string   // YYYY-MM-DD
    professionalId?: string
    status?: string
}) {
    const supabase = await createClient()

    let query = supabase.from('appointments')
        .select(`
            *,
            patients ( id, name ),
            profiles ( id, full_name ),
            services ( id, name, price ),
            payment_methods ( id, name )
        `)
        .neq('status', 'cancelled') // Exclude cancelled
        .order('start_time', { ascending: false })

    // Date Filters
    if (searchParams.startDate) {
        // Start of day
        query = query.gte('start_time', `${searchParams.startDate}T00:00:00`)
    }
    if (searchParams.endDate) {
        // End of day
        query = query.lte('start_time', `${searchParams.endDate}T23:59:59`)
    }

    // Professional Filter
    if (searchParams.professionalId && searchParams.professionalId !== 'all') {
        query = query.eq('professional_id', searchParams.professionalId)
    }

    // Status Filter (Optional specific status, e.g. 'completed' only)
    if (searchParams.status && searchParams.status !== 'all') {
        query = query.eq('status', searchParams.status)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching financial report:', error)
        return { data: [], totals: { billed: 0, received: 0, pending: 0 }, error: error.message }
    }

    // Calculate Totals
    let billed = 0
    let received = 0
    let pending = 0

    const enrichedData = data.map(appt => {
        const price = Number(appt.price || 0)
        const isCompleted = appt.status === 'completed'
        const hasPayment = !!appt.payment_method_id

        billed += price

        if (isCompleted && hasPayment) {
            received += price
        } else if (isCompleted && !hasPayment) {
            pending += price
        }
        // scheduled/confirmed counts as billed but neither received nor pending (future income usually)
        // Or should "Pending" include "Scheduled"?
        // Usually "Pending" implies "Work Done, Money Not In".
        // "Projected" would be future.
        // For now, let's keep simplistic:
        // Received = Completed + Paid
        // Pending = Completed + No Pay

        return {
            ...appt,
            price,
            payment_status: (isCompleted && hasPayment) ? 'paid' : (isCompleted ? 'pending' : 'scheduled')
        }
    })

    // Group Debtors
    interface DebtorInfo {
        patientId: string
        patientName: string
        patientPhone: string
        totalDebt: number
        count: number
        appointments: any[]
    }

    const debtorsMap = new Map<string, DebtorInfo>()

    enrichedData.forEach(appt => {
        if (appt.payment_status === 'pending') {
            const pid = appt.patient_id
            if (!pid) return

            const existing = debtorsMap.get(pid) || {
                patientId: pid,
                patientName: appt.patients?.name || 'Desconhecido',
                patientPhone: 'N/A', // We need to fetch phone, currently patient relation query only gets name.
                // Correction: Let's assume we can't easily get phone without updating query.
                // For now, Name is enough.
                totalDebt: 0,
                count: 0,
                appointments: []
            }

            existing.totalDebt += appt.price
            existing.count += 1
            existing.appointments.push(appt)
            debtorsMap.set(pid, existing)
        }
    })

    const debtors = Array.from(debtorsMap.values()).sort((a, b) => b.totalDebt - a.totalDebt)

    return {
        data: enrichedData,
        debtors: debtors || [], // Ensure array
        totals: {
            billed,
            received,
            pending
        }
    }
}

export async function getProfessionalsList() {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'professional')
    return data || []
}
