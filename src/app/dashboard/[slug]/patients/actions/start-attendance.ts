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
        notes?: string,
        force?: boolean
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

        // [NEW] Check if patient already has an appointment TODAY
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const { data: existingToday } = await supabase
            .from('appointments')
            .select('id, start_time, status, services(name)')
            .eq('patient_id', patientId)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .neq('status', 'cancelled')
            .limit(1)
            .maybeSingle()

        if (existingToday && !options.force) {
            return {
                success: false,
                error: 'DUPLICATE_TODAY',
                appointmentId: existingToday.id,
                startTime: existingToday.start_time,
                serviceName: (existingToday.services as any)?.name || 'Atendimento',
                msg: `O paciente já possui um agendamento para hoje (${new Date(existingToday.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${(existingToday.services as any)?.name || 'Sem serviço'}). Deseja usar o agendamento existente ou criar um novo?`
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

        // 2. Find a Service linked to this Professional based on mode
        let serviceId = null;
        let serviceDuration = 60;

        const { data: profServices } = await supabase
            .from('service_professionals')
            .select('service_id, services(id, name, duration)')
            .eq('profile_id', user.id)

        const targetTerm = options.recordType === 'evolution' ? 'atendimento' : 'consulta';

        // [FIX] Improved matching: Try exact generic matches first, then prefer the shortest matching name
        // (Generic services usually have shorter names than specialized ones)
        const sortedServices = (profServices || []).sort((a: any, b: any) =>
            (a.services?.name?.length || 0) - (b.services?.name?.length || 0)
        );

        const matchingService = sortedServices.find((s: any) => {
            const name = s.services?.name?.toLowerCase() || '';
            // Precise generic matches
            if (name === targetTerm) return true;
            if (name === 'atendimento de fisioterapia' && targetTerm === 'atendimento') return true;
            if (name === 'consulta de fisioterapia' && targetTerm === 'consulta') return true;
            if (name === 'sessão de fisioterapia' && targetTerm === 'atendimento') return true;

            // Fuzzy match as fallback
            return name.includes(targetTerm);
        });

        if (matchingService) {
            serviceId = matchingService.services.id;
            serviceDuration = matchingService.services.duration || 60;
        }
        // [MODIFIED] Removed fallback to avoid guessing wrong services.
        // If nothing matches the intended mode, serviceId remains null and will be requested at finalization.

        const defaultNotes = serviceId ? `Atendimento (${options.recordType === 'evolution' ? 'Evolução' : 'Consulta'}) iniciado` : 'ATENÇÃO: Serviço a definir na finalização';

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
                notes: options.notes || defaultNotes,
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
