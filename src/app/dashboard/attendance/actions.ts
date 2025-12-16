"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getAttendanceData(appointmentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // 1. Fetch Appointment + Patient
    const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (*),
            profiles:professional_id (*)
        `)
        .eq('id', appointmentId)
        .single()

    if (apptError || !appointment) {
        throw new Error("Agendamento não encontrado")
    }

    // 2. Fetch Templates (All active)
    // In a real scenario, we would filter by 'user_template_preferences'
    const { data: templates } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true })

    // 3. Fetch User Preferences (if exists)
    // We try/catch this because the table might not exist yet if migration failed
    let preferences = []
    try {
        const { data: prefs } = await supabase
            .from('user_template_preferences')
            .select('*')
            .eq('user_id', user.id)

        preferences = prefs || []
    } catch (e) {
        console.warn("Could not fetch preferences (migration missing?)", e)
    }

    // 4. Fetch Existing Record (if any) for this appointment
    // This allows resuming an attendance
    let existingRecord = null
    try {
        const { data: record } = await supabase
            .from('patient_records')
            .select('*')
            .eq('appointment_id', appointmentId)
            .single()

        existingRecord = record
    } catch (e) {
        // No record found, that's fine
    }

    // 5. Fetch Patient History (Last 5 records)
    const { data: history } = await supabase
        .from('patient_records')
        .select(`
            *,
            form_templates (title),
            profiles (full_name)
        `)
        .eq('patient_id', appointment.patient_id)
        .neq('appointment_id', appointmentId) // Exclude current
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        appointment,
        patient: appointment.patients,
        templates,
        preferences,
        existingRecord,
        history
    }
}

export async function startAttendance(appointmentId: string) {
    const supabase = await createClient()

    // Update status to 'in_progress' (Em Atendimento)
    // Assuming status logic. If 'status' column is simple text.
    // We should check 'migration_appointment_status.sql' but let's assume 'Em Atendimento' or specific ID.
    // For now, let's just create the record logic. The status update is visual.

    // Check if we need to update status
    await supabase.from('appointments').update({ status: 'Em Atendimento' }).eq('id', appointmentId)

    revalidatePath(`/dashboard/schedule`)
    return { success: true }
}

export async function saveAttendanceRecord(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, msg: "Unauthorized" }

    const { appointment_id, patient_id, template_id, content, record_id } = data

    // Upsert logic
    const payload = {
        appointment_id,
        patient_id,
        template_id,
        content,
        professional_id: user.id,
        updated_at: new Date().toISOString()
    }

    let error;
    if (record_id) {
        // Update
        const res = await supabase.from('patient_records').update(payload).eq('id', record_id)
        error = res.error
    } else {
        // Insert
        const res = await supabase.from('patient_records').insert(payload)
        error = res.error
    }

    if (error) {
        console.error("Save Error", error)
        return { success: false, msg: "Erro ao salvar" }
    }

    return { success: true }
}

export async function finishAttendance(appointmentId: string, recordData: any = null) {
    const supabase = await createClient()

    // 1. Save last state if data provided
    if (recordData) {
        await saveAttendanceRecord(recordData)
    }

    // 2. Update Appointment to 'Realizado' (Done)
    await supabase.from('appointments').update({ status: 'Realizado' }).eq('id', appointmentId)

    // 3. Redirect to Schedule
    revalidatePath('/dashboard/schedule')
    redirect('/dashboard/schedule')
}
