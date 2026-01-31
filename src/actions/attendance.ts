'use server'

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getAttendanceData(appointmentId: string, slug?: string) {
    const supabase = await createClient()

    let organizationId: string | undefined

    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) organizationId = org.id
    }

    if (!organizationId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }
    }

    // 1. Fetch Appointment detailed (Direct DB)
    const apptRes = await db.query(`
        SELECT 
            a.*,
            json_build_object(
                'id', p.id,
                'name', p.name,
                'birthdate', p.birthdate,
                'gender', p.gender,
                'phone', p.phone,
                'cpf', p.cpf
            ) as patients,
            json_build_object(
                'id', s.id,
                'name', s.name,
                'duration', s.duration
            ) as services,
            json_build_object(
                'id', prof.id,
                'full_name', prof.full_name,
                'council_number', prof.council_number,
                'council_type', prof.council_type,
                'digital_signature_url', prof.digital_signature_url
            ) as profiles,
            json_build_object(
                'id', l.id,
                'name', l.name
            ) as location
        FROM public.appointments a
        LEFT JOIN public.patients p ON a.patient_id = p.id
        LEFT JOIN public.services s ON a.service_id = s.id
        LEFT JOIN public.profiles prof ON a.professional_id = prof.id
        LEFT JOIN public.locations l ON a.location_id = l.id
        WHERE a.id = $1
    `, [appointmentId])

    const appointment = apptRes.rows[0]

    if (appointment && organizationId && appointment.organization_id !== organizationId) {
        console.warn(`[getAttendanceData] Access mismatch: Appt Org ${appointment.organization_id} vs Req Org ${organizationId}`)
    }

    if (!appointment) {
        throw new Error("Agendamento não encontrado.")
    }

    const patientId = appointment.patient_id
    if (!patientId) {
        throw new Error("Este agendamento não possui um paciente vinculado.")
    }

    // 2. Fetch Prontuário / History & Others (Parallel DB Queries)
    // Note: patient_records and patient_assessments don't have organization_id column yet
    // TODO: Re-enable organization_id filters after confirming columns exist
    const [historyRes, assessmentsRes, paymentMethodsRes, professionalsRes, templatesRes, recordRes] = await Promise.all([
        db.query("SELECT * FROM public.patient_records WHERE patient_id = $1 ORDER BY created_at DESC", [patientId]),
        db.query("SELECT * FROM public.patient_assessments WHERE patient_id = $1 ORDER BY created_at DESC", [patientId]),
        db.query("SELECT * FROM public.payment_methods WHERE active = true"),
        db.query("SELECT id, full_name FROM public.profiles WHERE organization_id = $1", [organizationId]),
        db.query("SELECT * FROM public.form_templates WHERE deleted_at IS NULL AND is_active = true", []),
        db.query("SELECT * FROM public.patient_records WHERE appointment_id = $1 LIMIT 1", [appointmentId])
    ])

    return {
        appointment,
        patient: appointment.patients,
        history: historyRes.rows || [],
        assessments: assessmentsRes.rows || [],
        paymentMethods: paymentMethodsRes.rows || [],
        professionals: professionalsRes.rows || [],
        templates: templatesRes.rows || [],
        existingRecord: recordRes.rows[0] || null,
        preferences: []
    }
}

export async function startAttendance(appointmentId: string, slug?: string) {
    const supabase = await createClient()

    // Update status to in_progress
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'in_progress', start_time: new Date().toISOString() }) // Optionally track real start time
        .eq('id', appointmentId)

    if (error) {
        return { error: 'Erro ao iniciar atendimento.' }
    }

    if (slug) revalidatePath(`/dashboard/${slug}/attendance/${appointmentId}`)
    else revalidatePath(`/dashboard/attendance/${appointmentId}`)
    return { success: true }
}
