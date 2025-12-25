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

    // 6. Fetch Questionnaires/Assessments (Legacy + Generic)
    let assessments: any[] = []
    try {
        // A. Legacy Assessments (patient_assessments table)
        const { data: legacyAssess } = await supabase
            .from('patient_assessments')
            .select(`
                *,
                professionals (name)
            `)
            .eq('patient_id', appointment.patient_id)
            .order('created_at', { ascending: false })

        // B. Generic Assessments (patient_records table with record_type='assessment')
        const { data: genericAssess } = await supabase
            .from('patient_records')
            .select(`
                *,
                form_templates (title),
                profiles (full_name)
            `)
            .eq('patient_id', appointment.patient_id)
            .eq('record_type', 'assessment')
            .order('created_at', { ascending: false })

        // C. Merge and Map
        const formattedLegacy = (legacyAssess || []).map((item: any) => ({
            ...item,
            isLegacy: true,
            title: item.type, // Will be mapped later or use type
            author: item.professionals?.name
        }))

        // [MODIFIED] Do NOT merge generic assessments (patient_records) into this list.
        // The user wants 'Histórico de Questionários' to ONLY show Scored Questionnaires.
        // Generic forms (like Palmilha) are already covered in 'Prontuário' / 'History'.

        // Sort combined (descending date)
        assessments = [...formattedLegacy].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

    } catch (e: any) {
        console.warn("Error fetching assessments:", e)
    }

    // DEBUG: Log Assessments to File
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.resolve(process.cwd(), 'debug_assessments.txt');
        fs.writeFileSync(logPath, JSON.stringify({
            count: assessments.length,
            data: assessments,
            patientId: appointment.patient_id
        }, null, 2));
    } catch (err) { console.error('Log error', err) }

    // 7. Fetch Payment Methods
    let paymentMethods = []
    try {
        const { data: pm } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('active', true)
            .order('name')
        paymentMethods = pm || []
    } catch (e) {
        console.warn("Error fetching payment methods:", e)
    }



    // 8. Fetch Active Professionals (For Schedule Switch)
    let professionals: any[] = []
    try {
        const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('is_active', true)
            .eq('has_agenda', true)
            .order('full_name')
        professionals = profs || []
    } catch (e) {
        console.warn("Error fetching professionals:", e)
    }

    return {
        appointment,
        patient: appointment.patients,
        templates,
        preferences,
        existingRecord,
        history,
        assessments,
        paymentMethods,
        professionals // [NEW]
    }
}


export async function startAttendance(appointmentId: string) {
    const supabase = await createClient()

    // Update status to 'in_progress'
    await supabase.from('appointments').update({ status: 'in_progress' }).eq('id', appointmentId)

    revalidatePath(`/dashboard/schedule`)
    return { success: true }
}

import { ASSESSMENTS } from '../patients/components/assessments/definitions'

// ...

export async function saveAttendanceRecord(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, msg: "Unauthorized" }

    const { appointment_id, patient_id, template_id, content, record_id, record_type } = data

    // Scoring is handled by legacy assessment system only
    let finalContent = content

    // Upsert logic
    const payload = {
        appointment_id,
        patient_id,
        template_id,
        content: finalContent, // Use Modified Content
        professional_id: user.id,
        updated_at: new Date().toISOString(),
        ...(record_type && { record_type })
    }

    let error;
    let dataResult;

    if (record_id) {
        // [LGPD] 24h Edit Lock
        const { data: existingRecord } = await supabase
            .from('patient_records')
            .select('created_at, updated_at')
            .eq('id', record_id)
            .single()

        if (existingRecord) {
            // Use updated_at if available to allow editing window to extend based on activity
            // or created_at if updated_at is missing.
            const baseDate = new Date(existingRecord.updated_at || existingRecord.created_at)
            const now = new Date()
            const diffInHours = (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60)

            // Strict lock (can add role check later if needed)
            if (diffInHours > 24 && user.role !== 'admin' && user.role !== 'master') {
                // Allow Admins/Masters to bypass
                return { success: false, error: 'Bloqueio de Conformidade (LGPD): Prontuários com mais de 24 horas sem atividade são imutáveis.' }
            }
        }
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

import { createAdminClient } from "@/lib/supabase/admin" // Ensure this import exists or add it

// ...

export async function finishAttendance(appointmentId: string, recordData: any = null) {
    const supabase = await createClient()

    // 1. Save last state if data provided
    if (recordData) {
        await saveAttendanceRecord(recordData)
    }

    // [RLS BYPASS] Use Admin Client for Status Update to ensure Masters can finish other's appointments
    const adminClient = createAdminClient()

    // 2. Update Appointment to 'completed' (internal value, mapped to Green in UI)
    console.log("Updating appointment status to 'completed' for ID:", appointmentId)
    const { error, data } = await adminClient.from('appointments').update({ status: 'completed' }).eq('id', appointmentId).select()

    if (error) {
        console.error("Error finishing attendance:", error)
        // We might want to throw or return feedback, but for now log it.
    } else {
        console.log("Update success:", data)
    }

    // 3. Redirect to Schedule
    revalidatePath('/dashboard/schedule')
    redirect('/dashboard/schedule')
}
