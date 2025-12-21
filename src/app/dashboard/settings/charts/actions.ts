'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCharts() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('chart_templates')
        .select('*')
        .order('title', { ascending: true })

    if (error) {
        console.error('Error fetching charts:', error)
        return []
    }
    return data
}

export async function saveChart(chart: any) {
    const supabase = await createClient()

    // Validate config
    let config = chart.config
    if (typeof config === 'string') {
        try {
            config = JSON.parse(config)
        } catch (e) {
            return { error: 'Configuração inválida' }
        }
    }

    const payload = {
        title: chart.title,
        type: chart.type || 'radar',
        config: config,
        updated_at: new Date().toISOString()
    }

    if (chart.id) {
        const { error } = await supabase
            .from('chart_templates')
            .update(payload)
            .eq('id', chart.id)

        if (error) return { error: error.message }
    } else {
        const { error } = await supabase
            .from('chart_templates')
            .insert(payload)

        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function deleteChart(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('chart_templates')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
