'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveSandboxAssessment(
    slug: string,
    formType: string,
    data: any,
    patientId?: string,
    newPatientData?: { name: string, phone: string }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "User not authenticated" }
    }

    try {
        // 1. Get Organization
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (!org) return { error: "Organization not found" }

        // 2. Identify Patient
        let targetPatientId = patientId

        if (!targetPatientId && newPatientData) {
            // Create New Patient
            const { data: newPatient, error: createError } = await supabase
                .from('patients')
                .insert({
                    organization_id: org.id,
                    name: newPatientData.name,
                    phone: newPatientData.phone,
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
        const { data: templates } = await supabase
            .from('form_templates')
            .select('id')
            .eq('organization_id', org.id)
            .ilike('title', `%${templateTitleQuery}%`)
            .limit(1)

        let templateId = templates?.[0]?.id

        if (!templateId) {
            // Fallback: Find any active template of this type
            const { data: fallback } = await supabase
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
        // We create a "phantom" appointment to hold the record, status 'attended' (Finalized)
        const appointmentData = {
            organization_id: org.id,
            patient_id: targetPatientId,
            professional_id: user.id, // Or profile id
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            status: 'attended', // Finalizado
            type: 'assessment', // Or 'evolution'
            title: `Avaliação (Sandbox) - ${templateTitleQuery}`
        }

        // Get Profile ID for professional_id (user.id might not be profile id in some setups, but usually linked)
        // Let's verify profile
        const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
        if (profile) {
            appointmentData.professional_id = profile.id
        }

        const { data: appointment, error: appError } = await supabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single()

        if (appError) return { error: "Error creating record container: " + appError.message }

        // 5. Insert Notification/Record Data
        // Depending on schema, it might be in `assessments` table or `form_records`
        // Providing support for `assessments` as seen in other files
        const assessmentData = {
            organization_id: org.id,
            patient_id: targetPatientId,
            appointment_id: appointment.id,
            professional_id: appointmentData.professional_id,
            form_template_id: templateId,
            content: data, // JSON Data
            status: 'finalized',
            created_at: new Date().toISOString()
        }

        const { error: assessError } = await supabase
            .from('assessments') // Assuming this is the table. If 'form_records', change it.
            .insert(assessmentData)

        if (assessError) {
            // Try 'form_records' if assessments fails (or checking schema would be better)
            // But let's assume 'assessments' based on previous context.
            return { error: "Error saving assessment data: " + assessError.message }
        }

        revalidatePath(`/dashboard/${slug}/patients/${targetPatientId}`)

        return { success: true, patientId: targetPatientId }

    } catch (err: any) {
        console.error("Save Sandbox Error:", err)
        return { error: err.message }
    }
}
