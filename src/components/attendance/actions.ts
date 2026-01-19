'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function checkActiveAttendance() {
    // 1. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: null, error: 'User not authenticated' }
    }

    // 2. Use Admin Client to search for appointments, bypassing RLS
    const adminClient = await createAdminClient()

    // Find ANY open appointment for this professional
    // Logic matches 'page.tsx': In Progress, Confirmed, etc.
    // EXCLUDING 'attended', 'billed', 'cancelled', 'no_show' because those mean finished/done
    const { data, error } = await adminClient
        .from('appointments')
        .select(`
            id,
            start_time,
            status,
            patient_id,
            patient:patients(name)
        `)
        .eq('professional_id', user.id)
        .eq('status', 'in_progress') // Only truly active/started appointments
        .order('start_time', { ascending: false })
        .limit(20)

    if (error) {
        console.error("DEBUG: Server Action Attendance Error:", error)
        return { data: null, error: error.message }
    }

    // 3. Filter for active status in JS (Robustness)
    // Prioritize 'in_progress' over 'confirmed'
    const activeAppt = (data || []).sort((a, b) => {
        // Custom sort: in_progress comes first
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1
        if (a.status !== 'in_progress' && b.status === 'in_progress') return 1
        // Then confirmed
        return 0
    })[0]

    // Double check status just in case
    const isValidStatus = activeAppt && activeAppt.status === 'in_progress'

    if (isValidStatus) {
        console.log(`[checkActiveAttendance] Found Active: ${activeAppt.id} (${activeAppt.status})`)
        return { data: activeAppt, error: null }
    } else {
        console.log(`[checkActiveAttendance] No active appointment found.`)
        return { data: null, error: null }
    }
}
