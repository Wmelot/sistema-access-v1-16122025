'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getFormTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('form_templates')
        .select('id, title, fields')
        .order('title', { ascending: true })

    if (error) {
        console.error('Error fetching form templates:', error)
        return []
    }
    return data
}

export async function getMetrics() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('form_metrics')
        .select('*')
        .order('title', { ascending: true })

    if (error) {
        console.error('Error fetching metrics:', error)
        return []
    }
    return data
}

export async function saveMetric(metric: any) {
    const supabase = await createClient()

    // Validate if calculation_rule is valid JSON
    let rule = metric.calculation_rule
    if (typeof rule === 'string') {
        try {
            rule = JSON.parse(rule)
        } catch (e) {
            return { error: 'Regra de cálculo inválida' }
        }
    }

    const payload = {
        title: metric.title,
        description: metric.description,
        target_min: metric.target_min || 0,
        target_max: metric.target_max || 10,
        calculation_rule: rule,
        updated_at: new Date().toISOString()
    }

    if (metric.id) {
        const { error } = await supabase
            .from('form_metrics')
            .update(payload)
            .eq('id', metric.id)

        if (error) return { error: error.message }
    } else {
        const { error } = await supabase
            .from('form_metrics')
            .insert(payload)

        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function deleteMetric(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('form_metrics')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
