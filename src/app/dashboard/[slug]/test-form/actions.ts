'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveSandboxAssessment(
    slug: string,
    formType: string,
    data: any,
    patientId?: string,
    newPatientData?: { name: string, phone: string }
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
            // Check if patient already exists (Avoid Duplicates)
            const { data: existingPatient } = await adminSupabase
                .from('patients')
                .select('id')
                .ilike('name', newPatientData.name.trim())
                .eq('phone', newPatientData.phone.trim())
                .eq('organization_id', org.id)
                .maybeSingle()

            if (existingPatient) {
                targetPatientId = existingPatient.id
            } else {
                // Create New Patient
                const { data: newPatient, error: createError } = await adminSupabase
                    .from('patients')
                    .insert({
                        organization_id: org.id,
                        name: newPatientData.name.trim(),
                        phone: newPatientData.phone.trim(),
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (createError) return { error: "Error creating patient: " + createError.message }
                targetPatientId = newPatient.id
            }
        }

        if (!targetPatientId) {
            return { error: "No patient specified" }
        }

        // 3. Identify Template based on formType
        // Map formType (from URL) to Template Title or Type
        let templateType = 'assessment'
        let templateTitleQuery = ''

        switch (formType) {
            case 'womens-health':
                templateTitleQuery = 'Saúde da Mulher'
                break
            case 'pbe':
                // Smart Assessment might be flexible, but let's assume a default logic or standard template
                templateTitleQuery = 'Avaliação Clínica Inteligente' // or 'General'
                break
            case 'physical':
                templateTitleQuery = 'Avaliação Física'
                break
            case 'diabetic-foot':
                templateTitleQuery = 'Pé Diabético'
                break
            default:
                templateTitleQuery = 'Avaliação Padrão'
        }

        // Find Template
        const { data: templates } = await adminSupabase
            .from('form_templates')
            .select('id')
            .eq('organization_id', org.id)
            .ilike('title', `%${templateTitleQuery}%`)
            .limit(1)

        let templateId = templates?.[0]?.id

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

        // 4. Create Appointment (Record Container)
        // We create a "phantom" appointment to hold the record, status 'in_progress'
        const appointmentData = {
            organization_id: org.id,
            patient_id: targetPatientId,
            professional_id: user.id, // Or profile id
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            status: 'in_progress', // Em atendimento (Survive refreshes & shows banner)
            type: 'appointment',
            title: `Atendimento - ${templateTitleQuery}`
        }

        // Get Profile ID for professional_id (user.id might not be profile id in some setups, but usually linked)
        // Let's verify profile
        const { data: profile } = await adminSupabase.from('profiles').select('id').eq('user_id', user.id).single()
        if (profile) {
            appointmentData.professional_id = profile.id
        }

        const { data: appointment, error: appError } = await adminSupabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single()

        if (appError) return { error: "Error creating record container: " + appError.message }

        // 5a. Insert into patient_assessments (Legacy/Legacy Storage for some reports)
        const { error: assessError } = await adminSupabase
            .from('patient_assessments')
            .insert({
                patient_id: targetPatientId,
                professional_id: appointmentData.professional_id,
                organization_id: org.id,
                type: formType,
                title: templateTitleQuery,
                data: data, // jsonb
                scores: {
                    fromSandbox: true,
                    appointment_id: appointment.id,
                    savedAt: new Date().toISOString()
                }
            })

        if (assessError) console.error("Admin Assessment Insert Failed:", assessError);

        // 5b. IMPORTANT: Insert into patient_records (Evolution) 
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
                professional_id: appointmentData.professional_id,
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
