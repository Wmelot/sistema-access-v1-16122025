'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"

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
    const category = formData.get('category') as string || 'Laudos'
    const content = formData.get('content') as string
    const type = formData.get('type') as string

    // Validate JSON config
    const configStr = formData.get('config') as string
    let config = {}
    if (configStr) {
        try {
            config = JSON.parse(configStr)
        } catch (e) {
            // ignore
        }
    }

    const payload = {
        title,
        type,
        category,
        content,
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

// OpenAI Integration (Alternative)
export async function generateReportAI(context: string) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        return { error: "Chave da API OpenAI não encontrada (OPENAI_API_KEY)." }
    }

    try {
        const openai = new OpenAI({ apiKey })

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Você é um fisioterapeuta especialista. Escreva um parágrafo de conclusão técnica para um laudo/relatório médico.
                    Regras:
                    1. Use linguagem técnica e profissional.
                    2. Sugira onde as variáveis devem se encaixar para fazer sentido (ex: {{paciente_nome}}).
                    3. Seja conciso (1 parágrafo).
                    4. Retorne apenas o texto final.`
                },
                {
                    role: "user",
                    content: `Contexto e Dados: ${context}`
                }
            ],
            model: "gpt-3.5-turbo", // You can switch to "gpt-4" if available
        });

        const text = completion.choices[0].message.content

        return { text }
    } catch (error: any) {
        console.error("OpenAI Error:", error)
        return { error: `Erro na OpenAI: ${error.message}` }
    }
}
