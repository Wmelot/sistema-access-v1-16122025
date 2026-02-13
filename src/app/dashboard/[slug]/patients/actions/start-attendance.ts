'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { AttendanceService } from "@/services/attendance-service"
import { logAction } from "@/lib/logger"

export async function startNewAttendance(
    patientId: string,
    slug?: string,
    options: {
        templateId?: string,
        recordType?: 'assessment' | 'evolution',
        notes?: string
    } = {}
) {
    const toUUID = (id: any) => {
        if (typeof id !== 'string' || id.trim() === "") return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id) ? id : null;
    };

    const finalTemplateId = toUUID(options.templateId);
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, msg: "Usuário não autenticado" }
    }

    try {
        // [SAFETY LOCK] Check via central service
        const active = await AttendanceService.getActiveAttendance(user.id)

        if (active && active.status === 'in_progress') {
            return {
                success: false,
                error: 'ALREADY_IN_ATTENDANCE',
                activeId: active.id,
                patientName: (Array.isArray(active.patient) ? active.patient[0]?.name : (active.patient as any)?.name) || 'Paciente',
                msg: "Já existe um atendimento em andamento."
            }
        }

        // 1. Resolve Organization
        let organizationId = null
        if (slug) {
            const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
            if (orgData) organizationId = orgData.id
        }
        if (!organizationId) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }

        // 2. Find a Service (preferably "Consulta")
        let serviceId = null;
        let serviceDuration = 60;

        const { data: services } = await supabase
            .from('services')
            .select('id, name, duration')
            .ilike('name', '%Consulta%')
            .limit(1)

        if (services && services.length > 0) {
            serviceId = services[0].id
            serviceDuration = services[0].duration || 60
        } else {
            const { data: anyService } = await supabase
                .from('services')
                .select('id, duration')
                .limit(1)
            if (anyService && anyService.length > 0) {
                serviceId = anyService[0].id
                serviceDuration = anyService[0].duration || 60
            }
        }

        if (!serviceId) {
            return { success: false, msg: "Nenhum serviço disponível." }
        }

        // 3. Fetch Location
        const { data: locations } = await supabase.from('locations').select('id').limit(1)
        const locationId = locations?.[0]?.id || null

        // 4. Create Appointment
        const now = new Date()
        const endTime = new Date(now.getTime() + serviceDuration * 60000)

        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .insert({
                patient_id: patientId,
                professional_id: user.id,
                service_id: serviceId,
                location_id: locationId,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: 'checked_in', // Transitional status before startAttendance sets it to 'in_progress'
                notes: options.notes || 'Atendimento iniciado via Perfil do Paciente',
                type: 'appointment',
                price: 0,
                original_price: 0,
                is_extra: true,
                organization_id: organizationId
            })
            .select('*, patients(name)')
            .single()

        if (apptError) throw apptError

        // 5. If template specified, create a Record pre-linked
        if (options.templateId) {
            const { data: templateData } = await supabase
                .from('form_templates')
                .select('fields')
                .eq('id', finalTemplateId)
                .single()

            await supabase
                .from('patient_records')
                .insert({
                    patient_id: patientId,
                    appointment_id: appointment.id,
                    template_id: finalTemplateId,
                    professional_id: user.id,
                    status: 'draft',
                    content: {},
                    template_snapshot: templateData?.fields || {},
                    record_type: options.recordType || 'evolution',
                    organization_id: organizationId
                })
        }

        // 6. Start the attendance via central Service (updates status to in_progress & triggers revalidate)
        const startRes = await AttendanceService.startAttendance(appointment.id, user.id, slug)

        if (!startRes.success) {
            return { success: false, msg: startRes.error }
        }

        await logAction("CREATE_IMMEDIATE_ATTENDANCE", { appointment_id: appointment.id, template_id: options.templateId }, 'appointment', appointment.id, organizationId)

        revalidatePath('/dashboard/schedule')
        revalidatePath(`/dashboard/patients/${patientId}`)

        return {
            success: true,
            appointmentId: appointment.id,
            patientName: appointment.patients?.name || 'Paciente'
        }

    } catch (error: any) {
        console.error("StartNewAttendance Error:", error)
        return { success: false, msg: "Erro: " + error.message }
    }
}
