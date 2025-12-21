'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getReportTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching report templates:", error)
        return []
    }
    return data
}

export async function getReportTemplate(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return null
    }
    return data
}

export async function saveReportTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const configStr = formData.get('config') as string

    // Validate JSON config
    let config = {}
    try {
        config = JSON.parse(configStr)
    } catch (e) {
        return { error: "Invalid configuration format" }
    }

    const payload = {
        title,
        type,
        config,
        updated_at: new Date().toISOString(),
        profile_id: user.id
    }

    // Check for duplicates
    const { data: existing } = await supabase
        .from('report_templates')
        .select('id')
        .eq('title', title)
        .eq('profile_id', user.id) // Scope to user or tenant depending on RLS
        .single()

    if (existing && existing.id !== id) {
        return { error: "Já existe um modelo com este nome." }
    }

    let error
    if (id) {
        const res = await supabase.from('report_templates').update(payload).eq('id', id)
        error = res.error
    } else {
        const res = await supabase.from('report_templates').insert(payload)
        error = res.error
    }

    if (error) {
        console.error("Error saving template:", error)
        return { error: "Erro ao salvar modelo" }
    }

    revalidatePath('/dashboard/settings/reports')
    return { success: true }
}

export async function deleteReportTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('report_templates').delete().eq('id', id)

    if (error) {
        return { error: "Erro ao excluir modelo" }
    }

    revalidatePath('/dashboard/settings/reports')
    return { success: true }
}

export async function getFormTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('form_templates')
        .select('id, title, fields, type')
        .order('title', { ascending: true })

    if (error) {
        console.error("Error fetching form templates:", error)
        return []
    }
    return data
}
