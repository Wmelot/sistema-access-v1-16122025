'use server'

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getAttendanceData(appointmentId: string) {
    const supabase = await createClient()

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
                'full_name', prof.full_name
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

    if (!appointment) {
        throw new Error("Agendamento não encontrado.")
    }

    const patientId = appointment.patient_id
    if (!patientId) {
        throw new Error("Este agendamento não possui um paciente vinculado.")
    }

    // 2. Fetch Prontuário / History & Others (Parallel DB Queries)
    const [historyRes, assessmentsRes, paymentMethodsRes, professionalsRes, templatesRes, recordRes] = await Promise.all([
        db.query("SELECT * FROM public.patient_records WHERE patient_id = $1 ORDER BY created_at DESC", [patientId]),
        db.query("SELECT * FROM public.patient_assessments WHERE patient_id = $1 ORDER BY created_at DESC", [patientId]),
        db.query("SELECT * FROM public.payment_methods WHERE active = true"),
        db.query("SELECT id, full_name FROM public.profiles"),
        db.query("SELECT * FROM public.form_templates WHERE deleted_at IS NULL AND is_active = true"),
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

export async function startAttendance(appointmentId: string) {
    const supabase = await createClient()

    // Update status to in_progress
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'in_progress', start_time: new Date().toISOString() }) // Optionally track real start time
        .eq('id', appointmentId)

    if (error) {
        return { error: 'Erro ao iniciar atendimento.' }
    }

    revalidatePath(`/dashboard/attendance/${appointmentId}`)
    return { success: true }
}
