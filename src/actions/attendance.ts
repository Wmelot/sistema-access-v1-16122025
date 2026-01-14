'use server'

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getAttendanceData(appointmentId: string) {
    const supabase = await createClient()

    // 1. Fetch Appointment & Patient
    const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (*),
            services (*),
            profiles (*),
            location:locations(id, name)
        `)
        .eq('id', appointmentId)
        .single()

    if (error || !appointment) {
        throw new Error("Agendamento não encontrado.")
    }

    const patientId = appointment.patient_id
    if (!patientId) {
        throw new Error("Este agendamento não possui um paciente vinculado.")
    }

    // 2. Fetch Prontuário / History
    const [historyRes, assessmentsRes, paymentMethodsRes, professionalsRes, templatesRes, recordRes] = await Promise.all([
        supabase.from('patient_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
        supabase.from('patient_assessments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
        supabase.from('payment_methods').select('*').eq('active', true),
        supabase.from('profiles').select('id, full_name').eq('is_active', true),
        db.query("SELECT * FROM public.form_templates WHERE deleted_at IS NULL AND is_active = true"), // Direct DB for fresh templates
        supabase.from('patient_records').select('*').eq('appointment_id', appointmentId).single()
    ])

    return {
        appointment,
        patient: appointment.patients,
        history: historyRes.data || [],
        assessments: assessmentsRes.data || [],
        paymentMethods: paymentMethodsRes.data || [],
        professionals: professionalsRes.data || [],
        templates: templatesRes.rows || [],
        existingRecord: recordRes.data || null,
        preferences: [] // Placeholder if needed
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
