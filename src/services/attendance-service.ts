import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * ATTENDANCE CENTRAL SERVICE
 * The single source of truth for starting, finishing and checking active attendances.
 */

export interface AttendanceResult {
    success: boolean
    error?: string
    activeId?: string
    patientName?: string
    data?: any
}

export const AttendanceService = {
    /**
     * Checks if a professional has any active (in_progress or checked_in) attendance.
     * Bypasses RLS to ensure Master users see their appointments across all organizations.
     */
    async getActiveAttendance(professionalId: string): Promise<any | null> {
        const supabaseAdmin = await createAdminClient()

        const { data, error } = await supabaseAdmin
            .from('appointments')
            .select(`
                id,
                start_time,
                created_at,
                status,
                patient_id,
                patient:patients(name)
            `)
            .eq('professional_id', professionalId)
            .in('status', ['in_progress', 'checked_in'])
            .order('status', { ascending: false }) // Prioritize in_progress (alphabetical 'i' vs 'c')
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('[AttendanceService] Error checking active attendance:', error)
            return null
        }

        return data
    },

    /**
     * Starts an attendance for a specific appointment.
     * Includes the Single Attendance Lock safeguard.
     */
    async startAttendance(appointmentId: string, professionalId: string, slug?: string, force: boolean = false): Promise<AttendanceResult> {
        const supabaseAdmin = await createAdminClient()

        // 1. [SAFETY LOCK] Check if another attendance is already in progress
        const active = await this.getActiveAttendance(professionalId)

        // If there's an active one AND it's not the one we are trying to start
        if (active && active.id !== appointmentId && active.status === 'in_progress') {
            if (force) {
                // Auto-finish previous one if force is true
                await this.finishAttendance(active.id, slug)
            } else {
                const pName = (Array.isArray(active.patient) ? active.patient[0]?.name : (active.patient as any)?.name) || 'Outro Paciente'
                return {
                    success: false,
                    error: 'ALREADY_IN_ATTENDANCE',
                    activeId: active.id,
                    patientName: pName
                }
            }
        }

        // 2. Start the attendance
        // Calculate new end_time based on current duration to keep it consistent
        const originalStart = new Date(active?.start_time || new Date()).getTime()
        const originalEnd = new Date(active?.end_time || new Date()).getTime()
        const durationMs = (originalEnd - originalStart) || (45 * 60000)

        const now = new Date()
        const newEndTime = new Date(now.getTime() + durationMs)

        const { error } = await supabaseAdmin
            .from('appointments')
            .update({
                status: 'in_progress',
                start_time: now.toISOString(),
                end_time: newEndTime.toISOString()
            })
            .eq('id', appointmentId)

        if (error) {
            console.error('[AttendanceService] Error starting attendance:', error)
            return { success: false, error: 'Erro ao iniciar atendimento no banco de dados.' }
        }

        // 3. Revalidate paths
        if (slug) {
            revalidatePath(`/dashboard/${slug}/schedule`)
            revalidatePath(`/dashboard/${slug}/attendance/${appointmentId}`)
        } else {
            revalidatePath('/dashboard/schedule')
        }

        return { success: true }
    },

    /**
     * Finishes an attendance.
     * Ensures status is updated to 'attended' using Admin privileges.
     */
    async finishAttendance(appointmentId: string, slug?: string): Promise<AttendanceResult> {
        const supabaseAdmin = await createAdminClient()

        const { error } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'attended' })
            .eq('id', appointmentId)

        if (error) {
            console.error('[AttendanceService] Error finishing attendance:', error)
            return { success: false, error: 'Erro ao finalizar atendimento.' }
        }

        // Force clearing the path cache
        if (slug) {
            revalidatePath(`/dashboard/${slug}/schedule`)
            revalidatePath(`/dashboard/${slug}/attendance/${appointmentId}`)
        } else {
            revalidatePath('/dashboard/schedule')
        }

        return { success: true }
    }
}
