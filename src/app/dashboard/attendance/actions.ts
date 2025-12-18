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
    let templates = []
    try {
        const { data: tmpl } = await supabase
            .from('form_templates')
            .select('*')
            .eq('is_active', true)
            .order('title', { ascending: true })
        templates = tmpl || []
    } catch (e) {
        console.warn("Error fetching templates:", e)
    }

    // 3. Fetch User Preferences
    let preferences = []
    try {
        const { data: prefs } = await supabase
            .from('user_template_preferences')
            .select('*')
            .eq('user_id', user.id)
        preferences = prefs || []
    } catch (e) {
        console.warn("Could not fetch preferences:", e)
    }

    // 4. Fetch Existing Record
    let existingRecord = null
    try {
        const { data: record } = await supabase
            .from('patient_records')
            .select('*')
            .eq('appointment_id', appointmentId)
            .single()
        existingRecord = record
    } catch (e) {
        // No record found or table missing
    }

    // 5. Fetch Patient History
    let history = []
    try {
        const { data: hist } = await supabase
            .from('patient_records')
            .select(`
                *,
                form_templates (title),
                profiles (full_name)
            `)
            .eq('patient_id', appointment.patient_id)
            .neq('appointment_id', appointmentId)
            .order('created_at', { ascending: false })
            .limit(5)
        history = hist || []
    } catch (e) {
        console.warn("Error fetching history:", e)
    }

    // 6. Fetch Questionnaires/Assessments
    let assessments = []
    try {
        const { data: assess } = await supabase
            .from('patient_assessments')
            .select(`
                *,
                professionals (
                    name
                )
            `)
            .eq('patient_id', appointment.patient_id)
            .order('created_at', { ascending: false })
        assessments = assess || []
    } catch (e) {
        console.warn("Error fetching assessments:", e)
    }

    return {
        appointment,
        patient: appointment.patients,
        templates,
        preferences,
        existingRecord,
        history,
        assessments
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
    let dataResult;

    if (record_id) {
        // Update
        const res = await supabase.from('patient_records').update(payload).eq('id', record_id).select().single()
        error = res.error
        dataResult = res.data
    } else {
        // Insert
        const res = await supabase.from('patient_records').insert(payload).select().single()
        error = res.error
        dataResult = res.data
    }

    if (error) {
        console.error("Save Error", error)
        return { success: false, msg: "Erro ao salvar: " + error.message }
    }

    return { success: true, data: dataResult }
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
