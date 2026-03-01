'use server'

import { createClient } from "@/lib/supabase/server"
import { AttendanceService } from "@/services/attendance-service"
import { logAction } from "@/lib/logger"
import { revalidatePath } from "next/cache"

export type QuickAttendanceType = 'assessment' | 'evolution'

export interface QuickAttendanceResult {
    success: boolean
    appointmentId?: string
    msg?: string
    error?: string
    activeId?: string
    patientName?: string
}

/**
 * Starts a "quick attendance" with NO patient linked.
 * Creates an appointment with patient_id = null.
 * The professional can later link or create a patient from within the attendance.
 */
export async function startQuickAttendance(
    slug: string,
    recordType: QuickAttendanceType,
    templateId?: string | null
): Promise<QuickAttendanceResult> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, msg: 'Usuário não autenticado.' }

        // Get organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) return { success: false, msg: 'Organização não encontrada.' }

        const organizationId = profile.organization_id

        // Check if already in attendance
        const active = await AttendanceService.getActiveAttendance(user.id)
        if (active && active.status === 'in_progress') {
            return {
                success: false,
                error: 'ALREADY_IN_ATTENDANCE',
                activeId: active.id,
                patientName: (Array.isArray(active.patient)
                    ? active.patient[0]?.name
                    : (active.patient as any)?.name) || 'Paciente',
            }
        }

        // Find matching service
        let serviceId: string | null = null
        let serviceDuration = 60

        const { data: profServices } = await supabase
            .from('service_professionals')
            .select('service_id, services(id, name, duration)')
            .eq('profile_id', user.id)

        const targetTerm = recordType === 'evolution' ? 'atendimento' : 'consulta'
        const sorted = (profServices || []).sort((a: any, b: any) =>
            (a.services?.name?.length || 0) - (b.services?.name?.length || 0)
        )
        const match = sorted.find((s: any) => {
            const name = s.services?.name?.toLowerCase() || ''
            return name === targetTerm || name.includes(targetTerm)
        })
        if (match) {
            serviceId = match.services.id
            serviceDuration = match.services.duration || 60
        }

        // Get location
        const { data: locations } = await supabase.from('locations').select('id').limit(1)
        const locationId = locations?.[0]?.id || null

        const now = new Date()
        const endTime = new Date(now.getTime() + serviceDuration * 60000)

        // Create appointment with patient_id = null (anonymous/quick)
        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .insert({
                patient_id: null,
                professional_id: user.id,
                service_id: serviceId,
                location_id: locationId,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: 'checked_in',
                notes: `Atendimento rápido iniciado em ${now.toLocaleTimeString('pt-BR')}`,
                type: 'appointment',
                price: 0,
                original_price: 0,
                is_extra: true,
                organization_id: organizationId,
            })
            .select('id')
            .single()

        if (apptError) {
            // If patient_id cannot be null, the DB will reject it
            // In that case, fall back to the standard flow (assessed separately)
            console.error('[QuickAttendance] Error creating appointment:', apptError)
            return { success: false, msg: 'Erro ao criar atendimento: ' + apptError.message }
        }

        // Create pre-linked patient_record (draft status, no patient)
        if (templateId) {
            const { data: templateData } = await supabase
                .from('form_templates')
                .select('fields')
                .eq('id', templateId)
                .single()

            await supabase.from('patient_records').insert({
                patient_id: null,
                appointment_id: appointment.id,
                template_id: templateId,
                professional_id: user.id,
                status: 'draft',
                content: {},
                template_snapshot: templateData?.fields || {},
                record_type: recordType,
                organization_id: organizationId,
            })
        }

        // Activate the attendance timer
        const startRes = await AttendanceService.startAttendance(appointment.id, user.id, slug)
        if (!startRes.success) throw new Error(startRes.error)

        await logAction('CREATE_QUICK_ATTENDANCE', { appointment_id: appointment.id }, 'appointment', appointment.id, organizationId)

        revalidatePath(`/dashboard/${slug}`)

        return { success: true, appointmentId: appointment.id }

    } catch (err: any) {
        console.error('[QuickAttendance] Unexpected error:', err)
        return { success: false, msg: 'Erro inesperado: ' + err.message }
    }
}
