'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssessment(patientId: string, type: string, data: any, scores: any, title?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const payload = {
        patient_id: patientId,
        professional_id: user.id, // Assuming the professional is the logged in user
        type,
        // template_id: type, // Removed as column appears to be missing. type serves this purpose.
        title: title || type, // Store title for display
        data,
        scores: {
            ...scores,
            savedAt: new Date().toISOString()
        }
    }

    const { data: insertedData, error } = await supabase.from('patient_assessments').insert(payload).select()

    // Debug Log
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.resolve(process.cwd(), 'debug_save_assessment.txt');
        fs.appendFileSync(logPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            payload,
            result: insertedData,
            error
        }, null, 2) + "\n---\n");
    } catch (e) { console.error('Log error', e) }

    if (error) {
        console.error('Error creating assessment:', error)
        throw new Error('Failed to create assessment')
    }

    revalidatePath('/dashboard', 'layout')
}

export async function getAssessments(patientId: string) {
    const supabase = await createClient()

    // We might want to join with professionals table to get the name, 
    // but for now let's just get the raw data
    const { data, error } = await supabase
        .from('patient_assessments')
        .select(`
            *,
            professionals (
                name
            )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching assessments:', error)
        return []
    }

    return data
}
