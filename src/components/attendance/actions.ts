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

    // 2. [SECURITY] Get user's Organization ID
    // Filter by Organization to ensure no cross-tenant leaks logic
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const orgId = profile?.organization_id

    if (!orgId) return { data: null, error: null } // No org, no attendance

    // 3. Use Admin Client to search for appointments, bypassing RLS
    const adminClient = await createAdminClient()

    // Find ANY open appointment for this professional
    // Logic: In Progress only.
    // Enhanced to support legacy null organization_id if it belongs to the same professional
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
        .or(`organization_id.eq.${orgId},organization_id.is.null`) // Fallback for legacy data
        .eq('status', 'in_progress')
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
export async function finishActiveAttendance(appointmentId: string) {
    const adminClient = await createAdminClient()

    // Update using Admin Client to ensure it works even with RLS/Org issues
    const { error } = await adminClient
        .from('appointments')
        .update({ status: 'attended' })
        .eq('id', appointmentId)

    if (error) {
        console.error("Failed to finish attendance via admin:", error)
        return { error: error.message }
    }

    // Sync invoice using regular update status logic (which handles revalidation etc)
    const { updateAppointmentStatus } = await import('@/actions/appointments')
    return updateAppointmentStatus(appointmentId, 'attended')
}
