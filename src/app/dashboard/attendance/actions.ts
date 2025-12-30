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
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        existingRecord = record
        console.log(`[getAttendanceData] existingRecord for ${appointmentId}:`, record ? 'Found' : 'Null')
    } catch (e) {
        // No record found or table missing
        console.log(`[getAttendanceData] Error fetching existingRecord for ${appointmentId}:`, e)
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
                profiles (full_name)
            `)
            .eq('patient_id', appointment.patient_id)
            .order('created_at', { ascending: false })

        // Map strictly to expected format
        assessments = (legacyAssess || []).map((item: any) => ({
            ...item,
            isLegacy: true,
            title: item.title || item.type, // Use saved title first
            author: item.profiles?.full_name || item.professionals?.name
        }))

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

    // 8. [NEW] Professionals
    let professionals: any[] = []
    try {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, name')
        professionals = profs || []
    } catch (e) { }

    return {
        appointment,
        patient: appointment.patients,
        templates,
        preferences,
        existingRecord,
        history,
        assessments: assessments || [],
        paymentMethods, // [NEW]
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

    // Handle System Templates (avoid UUID error)
    let finalTemplateId = template_id
    let finalRecordType = record_type

    if (template_id === 'system-physical-assessment') {
        finalTemplateId = null
        finalRecordType = 'assessment'
    }

    // Upsert logic
    const payload = {
        appointment_id,
        patient_id,
        template_id: finalTemplateId,
        content: finalContent, // Use Modified Content
        professional_id: user.id,
        updated_at: new Date().toISOString(),
        ...(finalRecordType && { record_type: finalRecordType })
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

// ... (previous imports)
import { addDays } from "date-fns"

// ... (existing functions)

export async function finishAttendance(appointmentId: string, recordData: any = null) {
    const supabase = await createClient()

    // 1. Save last state if data provided
    if (recordData) {
        await saveAttendanceRecord(recordData)
    }

    // [RLS BYPASS] Use Admin Client for Status Update
    const adminClient = createAdminClient()

    // --- AUTOMATION TRIGGER START ---
    try {
        // Fetch appointment details to check service type
        const { data: appointment } = await adminClient
            .from('appointments')
            .select(`
                *,
                services (name)
            `)
            .eq('id', appointmentId)
            .single()

        if (appointment && appointment.services?.name) {
            const serviceName = appointment.services.name.toLowerCase()

            // Check if it is an Insole Delivery
            // Adjust keywords as necessary based on actual service names
            const isInsoleDelivery = serviceName.includes('palmilha') && serviceName.includes('entrega')

            if (isInsoleDelivery) {
                // Fetch templates configured for Insole Delivery
                const { data: templates } = await supabase
                    .from('message_templates')
                    .select('*')
                    .eq('is_active', true)
                    .in('trigger_type', ['insole_delivery'])

                if (templates && templates.length > 0) {
                    const followUpsToInsert = templates.map((tmpl: any) => ({
                        patient_id: appointment.patient_id,
                        type: 'insoles_delivery', // General type
                        message_template_id: tmpl.id,
                        scheduled_date: addDays(new Date(), tmpl.delay_days || 0).toISOString(),
                        status: 'pending',
                        delivery_date: new Date().toISOString(),
                        token: crypto.randomUUID(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }))

                    await supabase.from('assessment_follow_ups').insert(followUpsToInsert)
                    console.log(`[Automation] Scheduled ${followUpsToInsert.length} follow-ups for Insole Delivery`)
                }
            }
        }
    } catch (err) {
        console.error("[Automation Error] Failed to schedule follow-ups:", err)
        // Do not block finishing attendance
    }
    // --- AUTOMATION TRIGGER END ---

    // 2. Update Appointment to 'completed'
    const { error } = await adminClient.from('appointments').update({ status: 'completed' }).eq('id', appointmentId).select()

    if (error) {
        console.error("Error finishing attendance:", error)
    }

    // 3. Redirect to Schedule
    revalidatePath('/dashboard/schedule')
    redirect('/dashboard/schedule')
}
