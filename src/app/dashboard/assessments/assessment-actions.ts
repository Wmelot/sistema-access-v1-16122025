'use server'

import { createClient } from "@/lib/supabase/server"

export async function getPatientStats(patientId: string) {
    const supabase = await createClient()

    try {
        const { data: records, error } = await supabase
            .from('patient_records')
            .select('created_at, content')
            .eq('patient_id', patientId)
            //.eq('record_type', 'assessment') // Some legacy might not have type, check content props
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching stats:', error)
            return { success: false, data: [] }
        }

        // Filter and map data for charts
        const stats = records.map(record => {
            const content = record.content || {}
            // Check if it's a physical assessment by looking for key fields
            if (!content.antro && !content.cardio) return null

            return {
                date: new Date(record.created_at).toLocaleDateString('pt-BR'),
                // Antro
                weight: content.antro?.weight ? Number(content.antro.weight) : null,
                fatPercent: content.antroResult?.fatPercent ? Number(content.antroResult.fatPercent) : null,
                // Cardio
                vo2: content.cardioResult?.vo2 ? Number(content.cardioResult.vo2) : null,
                // Strength
                relativeForce: content.strengthResult?.relativeForce ? Number(content.strengthResult.relativeForce) : null,
                symmetry: content.strengthResult?.symmetryIndex ? Number(content.strengthResult.symmetryIndex) : null,
                // Mobility
                wells: content.mobility?.wells ? Number(content.mobility.wells) : null,
            }
        }).filter(item => item !== null) // Remove non-assessments

        return { success: true, data: stats }

    } catch (error) {
        console.error('Unexpected error fetching stats:', error)
        return { success: false, data: [] }
    }
}
