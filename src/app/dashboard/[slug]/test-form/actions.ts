'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { normalizePhone } from "@/utils/format-phone"

export async function saveSandboxAssessment(
    slug: string,
    formType: string,
    data: any,
    patientId?: string,
    newPatientData?: { name: string, phone: string },
    force?: boolean,
    appointmentIdToUse?: string,
    specificTemplateId?: string
) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "User not authenticated" }
    }

    try {
        // 1. Get Organization
        const { data: org } = await adminSupabase.from('organizations').select('id').eq('slug', slug).single()
        if (!org) return { error: "Organization not found" }

        // 2. Identify Patient
        let targetPatientId = patientId

        if (!targetPatientId && newPatientData) {
            // [IMPROVED] Check if patient with same name already exists
            const { data: duplicateNames } = await adminSupabase
                .from('patients')
                .select('id, name, phone, cpf')
                .ilike('name', newPatientData.name.trim())
                .eq('organization_id', org.id)
                .limit(100)

            if (duplicateNames && duplicateNames.length > 0 && !force) {
                return {
                    error: "PATIENT_NAME_EXISTS",
                    existingPatient: {
                        id: duplicateNames[0].id,
                        name: duplicateNames[0].name,
                        phone: duplicateNames[0].phone,
                        cpf: duplicateNames[0].cpf
                    },
                    existingPatients: duplicateNames,
                    msg: `Já existe ${duplicateNames.length > 1 ? duplicateNames.length + ' pacientes cadastrados' : 'um paciente cadastrado'} com o nome "${duplicateNames[0].name}".`
                }
            }

            // If forced or definitely new, create it
            const { data: newPatient, error: createError } = await adminSupabase
                .from('patients')
                .insert({
                    organization_id: org.id,
                    name: newPatientData.name.trim(),
                    phone: normalizePhone(newPatientData.phone) || newPatientData.phone.trim(),
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (createError) return { error: "Error creating patient: " + createError.message }
            targetPatientId = newPatient.id
        }

        if (!targetPatientId) {
            return { error: "No patient specified" }
        }

        // [NEW] Check for Duplicate Appointment on the same day for this patient
        if (!force) {
            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date()
            endOfDay.setHours(23, 59, 59, 999)

            const { data: existingToday } = await adminSupabase
                .from('appointments')
                .select('id, start_time, services(name)')
                .eq('patient_id', targetPatientId)
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString())
                .neq('status', 'cancelled')
                .limit(1)
                .maybeSingle()

            if (existingToday) {
                return {
                    error: "DUPLICATE_TODAY",
                    appointmentId: existingToday.id,
                    startTime: existingToday.start_time,
                    serviceName: (existingToday.services as any)?.name || 'Atendimento',
                    msg: `Paciente já tem agendamento hoje às ${new Date(existingToday.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
                }
            }
        }

        // 3. Identify Template based on formType
        // Map formType (from URL) to Template Title or Type
        let templateType = 'assessment'
        let templateTitleQuery = ''

        switch (formType) {
            case 'womens-health':
                templateTitleQuery = 'Saúde da Mulher'
                break
            case 'pbe-5':
                templateTitleQuery = 'PBE 5.0'
                break
            case 'pbe':
            case 'advanced-pbe':
            case 'smart-assessment':
                templateTitleQuery = 'Avaliação PBE'
                break
            case 'physical':
                templateTitleQuery = 'Avaliação Física Avançada'
                break
            case 'diabetic-foot':
                templateTitleQuery = 'Pé Diabético'
                break
            case 'ultimate-pbe':
                templateTitleQuery = 'Ultimate PBE'
                break
            case 'palmilha-5':
                templateTitleQuery = 'Palmilha 5.0'
                break
            case 'palmilha':
            case 'palmilha-v3':
                templateTitleQuery = 'Palmilha'
                break
            default:
                templateTitleQuery = 'Avaliação'
        }

        // Map System Strings to valid Seeded UUIDs just like in attendance.ts
        const SYSTEM_UUID_MAP: Record<string, string> = {
            'palmilha-5': 'e0000000-0000-0000-0000-000000000005',
            'palmilha_5_system': 'e0000000-0000-0000-0000-000000000005',
            'system-physical-assessment': 'e0000000-0000-0000-0000-000000000002',
            'womens_health_system': 'e0000000-0000-0000-0000-000000000003',
            'clinical_evolution_system': 'e0000000-0000-0000-0000-000000000004',
            'ultimate_pbe_system': 'e0000000-0000-0000-0000-000000000006',
            'tree_wizard_system': 'e0000000-0000-0000-0000-000000000007',
            'pbe_concept_system': 'e0000000-0000-0000-0000-000000000008',
            'diabetic_foot_system': 'e0000000-0000-0000-0000-000000000009',
        };

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let templateId = specificTemplateId;

        if (templateId && SYSTEM_UUID_MAP[templateId]) {
            templateId = SYSTEM_UUID_MAP[templateId];
        } else if (templateId && !uuidRegex.test(templateId)) {
            templateId = undefined; // Force lookup instead of passing an invalid syntax string
        }

        if (!templateId) {
            const { data: templates } = await adminSupabase
                .from('form_templates')
                .select('id, title')
                .eq('organization_id', org.id)
                .ilike('title', `%${templateTitleQuery}%`)
                .order('created_at', { ascending: false })
                .limit(1)

            templateId = templates?.[0]?.id

            // [NEW] Very specific fallback for Palmilha if the query above fails
            if (!templateId && (formType === 'palmilha' || templateTitleQuery.includes('Palmilha'))) {
                templateId = '13fa2f92-41fa-462f-aa7e-5407d619dd94'
            }
        }

        if (!templateId) {
            // Fallback: Find any active template of this type
            const { data: fallback } = await adminSupabase
                .from('form_templates')
                .select('id')
                .eq('organization_id', org.id)
                .limit(1)

            templateId = fallback?.[0]?.id
        }

        if (!templateId) {
            return { error: "Nenhum modelo de formulário compatível encontrado para salvar." }
        }

        // 4. Create or Use Appointment (Record Container)
        let appointmentResult: any;

        if (appointmentIdToUse) {
            // Use existing
            const { data: existingAppt, error: fetchError } = await adminSupabase
                .from('appointments')
                .select('*')
                .eq('id', appointmentIdToUse)
                .single()

            if (fetchError) return { error: "Agendamento existente não encontrado." }

            // Update status to 'attended' so it doesn't trigger active restoration
            await adminSupabase.from('appointments').update({ status: 'attended' }).eq('id', appointmentIdToUse)

            appointmentResult = existingAppt
        } else {
            // Create New Phantom
            const now = new Date()
            const defaultDurationMinutes = 45
            const endTime = new Date(now.getTime() + defaultDurationMinutes * 60000)
            const appointmentData: any = {
                organization_id: org.id,
                patient_id: targetPatientId,
                professional_id: user.id,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: 'attended',
                type: 'appointment',
                title: `Atendimento - ${templateTitleQuery}`,
                notes: `Gravado via Sandbox`
            }

            const { data: profile } = await adminSupabase.from('profiles').select('id').eq('id', user.id).single()
            if (profile) appointmentData.professional_id = profile.id

            const { data: newAppt, error: appError } = await adminSupabase
                .from('appointments')
                .insert(appointmentData)
                .select()
                .single()

            if (appError) {
                console.error("Appointment Creation Failed:", appError);
                return { error: "Erro ao criar container do agendamento: " + appError.message }
            }
            appointmentResult = newAppt
        }

        const appointment = appointmentResult

        // 5. IMPORTANT: Insert into patient_records (Evaluation) 
        // This is what AttendanceClient uses to render the active form.
        const { error: recordError } = await adminSupabase
            .from('patient_records')
            .insert({
                appointment_id: appointment.id,
                patient_id: targetPatientId,
                template_id: templateId,
                content: {
                    ...data,
                    _record_type: templateType || 'evolution'
                },
                professional_id: appointment.professional_id,
                organization_id: org.id
            })

        if (recordError) {
            console.error("Admin Record Insert Failed:", recordError);
            return { error: "Erro ao inicializar prontuário: " + recordError.message };
        }

        revalidatePath(`/dashboard/${slug}/patients/${targetPatientId}`)
        revalidatePath(`/dashboard/${slug}/attendance/${appointment.id}`)

        return { success: true, patientId: targetPatientId, appointmentId: appointment.id }

    } catch (err: any) {
        console.error("Save Sandbox Error:", err)
        return { error: err.message }
    }
}
