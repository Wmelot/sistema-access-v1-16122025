'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { AttendanceService } from "@/services/attendance-service"
import { logAction } from "@/lib/logger"
import { z } from "zod"
import { validateAccess, idSchema, slugSchema } from "@/lib/security"

// SCHEMA DE VALIDAÇÃO
const StartAttendanceSchema = z.object({
    patientId: idSchema,
    slug: slugSchema.optional(),
    options: z.object({
        templateId: z.string().uuid().optional().nullable(),
        recordType: z.enum(['assessment', 'evolution']).optional(),
        notes: z.string().max(500).optional(),
        force: z.boolean().optional()
    }).default({})
});

export async function startNewAttendance(patientId: string, slug?: string, options: any = {}) {
    // 1. Validação de Input (Blindagem básica)
    const validation = StartAttendanceSchema.safeParse({ patientId, slug, options });
    if (!validation.success) {
        return { success: false, msg: validation.error.issues[0].message };
    }

    const { options: validatedOptions } = validation.data;

    try {
        // 2. Trava de Segurança (Multi-tenancy)
        const { userId, organizationId } = await validateAccess(patientId, 'patient', slug);

        const supabase = await createClient();

        // 3. Verificação de Atendimento em Andamento (Lógica Original Preservada)
        const active = await AttendanceService.getActiveAttendance(userId);
        if (active && active.status === 'in_progress') {
            return {
                success: false,
                error: 'ALREADY_IN_ATTENDANCE',
                activeId: active.id,
                patientName: (Array.isArray(active.patient) ? active.patient[0]?.name : (active.patient as any)?.name) || 'Paciente',
                msg: "Já existe um atendimento em andamento."
            };
        }

        // 4. Verificação de Duplicidade no Dia (Lógica Original Preservada)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const { data: existingToday } = await supabase
            .from('appointments')
            .select('id, start_time, status, services(name)')
            .eq('patient_id', patientId)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .neq('status', 'cancelled')
            .limit(1)
            .maybeSingle();

        if (existingToday && !validatedOptions.force) {
            return {
                success: false,
                error: 'DUPLICATE_TODAY',
                appointmentId: existingToday.id,
                startTime: existingToday.start_time,
                serviceName: (existingToday.services as any)?.name || 'Atendimento',
                msg: `O paciente já possui um agendamento para hoje. Deseja usar o agendamento existente?`
            };
        }

        // 5. Busca de Serviço (Lógica Original Preservada)
        let serviceId = null;
        let serviceDuration = 60;
        const { data: profServices } = await supabase
            .from('service_professionals')
            .select('service_id, services(id, name, duration)')
            .eq('profile_id', userId);

        const targetTerm = validatedOptions.recordType === 'evolution' ? 'atendimento' : 'consulta';
        const sortedServices = (profServices || []).sort((a: any, b: any) =>
            (a.services?.name?.length || 0) - (b.services?.name?.length || 0)
        );

        const matchingService = sortedServices.find((s: any) => {
            const name = s.services?.name?.toLowerCase() || '';
            if (name === targetTerm) return true;
            if (name === 'atendimento de fisioterapia' || name === 'consulta de fisioterapia') return true;
            return name.includes(targetTerm);
        });

        if (matchingService) {
            serviceId = matchingService.services.id;
            serviceDuration = matchingService.services.duration || 60;
        }

        // 6. Localização
        const { data: locations } = await supabase.from('locations').select('id').limit(1);
        const locationId = locations?.[0]?.id || null;

        // 7. Criação do Agendamento (Appointment)
        const now = new Date();
        const endTime = new Date(now.getTime() + serviceDuration * 60000);

        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .insert({
                patient_id: patientId,
                professional_id: userId,
                service_id: serviceId,
                location_id: locationId,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: 'checked_in',
                notes: validatedOptions.notes || `Iniciado em ${now.toLocaleTimeString()}`,
                type: 'appointment',
                price: 0,
                original_price: 0,
                is_extra: true,
                organization_id: organizationId,
                created_by: userId
            })
            .select('*, patients(name)')
            .single();

        if (apptError) throw apptError;

        // 8. Criação do Registro Pré-vinculado (se houver template)
        if (validatedOptions.templateId) {
            const { data: templateData } = await supabase
                .from('form_templates')
                .select('fields')
                .eq('id', validatedOptions.templateId)
                .single();

            await supabase
                .from('patient_records')
                .insert({
                    patient_id: patientId,
                    appointment_id: appointment.id,
                    template_id: validatedOptions.templateId,
                    professional_id: userId,
                    status: 'draft',
                    content: {},
                    template_snapshot: templateData?.fields || {},
                    record_type: validatedOptions.recordType || 'evolution',
                    organization_id: organizationId,
                    created_by: userId
                });
        }

        // 9. Ativação do Atendimento via central Service
        const startRes = await AttendanceService.startAttendance(appointment.id, userId, slug);
        if (!startRes.success) throw new Error(startRes.error);

        await logAction("CREATE_IMMEDIATE_ATTENDANCE", { appointment_id: appointment.id }, 'appointment', appointment.id, organizationId);

        revalidatePath('/dashboard/schedule');
        revalidatePath(`/dashboard/patients/${patientId}`);

        return {
            success: true,
            appointmentId: appointment.id,
            patientName: appointment.patients?.name || 'Paciente'
        };

    } catch (error: any) {
        console.error("StartNewAttendance Security Failure:", error.message);
        return { success: false, msg: "Erro ao iniciar atendimento: " + error.message };
    }
}
