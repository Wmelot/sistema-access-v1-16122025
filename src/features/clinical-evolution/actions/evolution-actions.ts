'use server'

import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { EVOLUTION_MASTER_PROMPT } from "../utils/ai-prompts"

// --- TYPES ---
export interface Exercise {
    id: string
    name: string
    category: string
    is_pilates: boolean
    equipment: string
    default_load_type: string
}

export interface AttendanceExercise {
    exercise_id: string
    sets: number
    reps: number
    load_value: string
    pain_during: number
    pain_after: number
    pain_next_morning: number
    rpe: number
}

// --- ACTIONS ---

export async function getExercises() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        console.error("Error fetching exercises:", error)
        return []
    }
    return data as Exercise[]
}

export async function getLastEvolution(patientId: string) {
    const supabase = await createClient()

    // Buscar o último registro TEXTUAL (field 'evolution_text' in content or 'evolution' type)
    const { data, error } = await supabase
        .from('patient_records')
        .select('content, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) return null

    // Extract relevant data for AI context
    return {
        text: data.content?.evolution_text || data.content?.description || "",
        exercises: data.content?.exercises || []
    }
}

export async function generateAIEvolution(input: {
    mode: 'audio' | 'structured',
    transcript?: string,
    structured_data?: any,
    patient_id: string,
    clinical_context?: {
        current_phase: number;
        tissue_type: string;
    }
}) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error("API Key missing")

        // 1. Get History
        const history = await getLastEvolution(input.patient_id)

        // 2. Prepare Context for AI
        const contextPayload = {
            mode: input.mode,
            transcript: input.transcript,
            structured_data: input.structured_data,
            history: history,
            clinical_context: input.clinical_context // Inject Clinical Engine Context
        }

        // 3. Call AI
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        })

        const result = await model.generateContent([
            { text: EVOLUTION_MASTER_PROMPT },
            { text: `INPUT DATA: ${JSON.stringify(contextPayload)}` }
        ])

        const responseText = result.response.text()
        return { success: true, data: JSON.parse(responseText) }

    } catch (error: any) {
        console.error("AI Generation Error:", error)
        return { success: false, msg: error.message }
    }
}

export async function saveClinicalEvolution(appointmentId: string, data: {
    evolution_text: string,
    exercises: AttendanceExercise[]
}) {
    const supabase = await createClient()

    // Resolve Attendance ID from Appointment ID
    const { data: attendance } = await supabase
        .from('attendances')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single()

    // If no attendance found (rare), maybe try to use appointmentId if they are same, or fail gracefully
    // But usually attendance must exist. 
    // If the schema uses appointment_id as PK for attendance, then attendance.id === appointmentId.
    const attendanceId = attendance?.id || appointmentId;

    // 1. Insert Exercises into separate table (Relational)
    if (data.exercises && data.exercises.length > 0) {
        const exercisesToInsert = data.exercises.map(ex => ({
            attendance_id: attendanceId,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: ex.reps,
            load_value: ex.load_value,
            pain_during: ex.pain_during,
            pain_after: ex.pain_after,
            pain_next_morning: ex.pain_next_morning,
            rpe: ex.rpe
        }))

        const { error: insertError } = await supabase
            .from('attendance_exercises')
            .insert(exercisesToInsert)

        if (insertError) {
            console.error("Error saving attendance_exercises:", insertError)
            // Non-blocking, but good to know. The text evolution is primary.
        }
    }

    // 2. Save Text to Main Record (JSON Content) - handled by Generic Form Save usually, 
    // but we might want to ensure it's saved here if specific logic is needed.
    // Usually the frontend calls saveAttendanceRecord with 'content'.
    // Here we just return success. The frontend will likely call saveAttendanceRecord with the text result.

    return { success: true }
}

export async function createExercise(data: {
    name: string,
    category: string,
    modality_type: string // 'Força', 'Mobilidade', etc used for is_pilates logic
}) {
    const supabase = await createClient()

    // Map frontend modality to DB flags if needed (e.g. is_pilates)
    const isPilates = data.category === 'Pilates' || data.name.toLowerCase().includes('pilates');

    const { data: newExercise, error } = await supabase
        .from('exercises')
        .insert({
            name: data.name,
            category: data.category,
            is_pilates: isPilates,
            default_load_type: 'kg', // Default
            is_custom: true // Flag to identify user created
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating exercise:", error)
        return { success: false, error: error.message }
    }

    return { success: true, data: newExercise }
}
