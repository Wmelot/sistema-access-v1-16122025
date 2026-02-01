'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { GoogleGenerativeAI } from "@google/generative-ai"


export async function getReportTemplates(slug?: string) {
    const supabase = await createClient()

    // [MULTI-TENANT] Get Organization ID
    let organizationId: string | undefined
    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) organizationId = org.id
    }

    if (!organizationId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }
    }

    if (organizationId) {
        await ensureDefaultReportTemplates(organizationId)
    }

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

async function ensureDefaultReportTemplates(organizationId: string) {
    const supabase = await createClient()

    const defaults = [
        {
            title: 'Atestado de Comparecimento',
            type: 'atestado',
            category: 'Documentos',
            content: `ATESTADO DE COMPARECIMENTO\n\nAtesto para os devidos fins que o(a) Sr(a). {{patient_name}} compareceu a este serviço de fisioterapia na data de hoje, {{data_atual}}, para realização de tratamento fisioterapêutico.\n\n{{profissional_nome}}\n{{profissional_registro}}\n{{profissional_especialidade}}`
        },
        {
            title: 'Declaração de Acompanhamento',
            type: 'declaracao',
            category: 'Documentos',
            content: `DECLARAÇÃO\n\nDeclaro que o(a) Sr(a). {{patient_name}} encontra-se em tratamento fisioterapêutico sob meus cuidados, necessitando de acompanhamento regular.\n\nAtenciosamente,\n\n{{profissional_nome}}\n{{profissional_registro}}\n{{profissional_especialidade}}`
        },
        {
            title: 'Encaminhamento',
            type: 'encaminhamento',
            category: 'Documentos',
            content: `ENCAMINHAMENTO\n\nAo(A) Dr(a). Especialista,\n\nEncaminho o(a) paciente {{patient_name}} para avaliação e conduta, apresentando quadro de [DESCREVER QUADRO].\n\nSigo à disposição para discussão do caso.\n\nAtenciosamente,\n\n{{profissional_nome}}\n{{profissional_registro}}\n{{profissional_especialidade}}`
        },
        {
            title: 'Relatório de Evolução',
            type: 'relatorio',
            category: 'Laudos',
            content: `RELATÓRIO DE EVOLUÇÃO\n\nPaciente: {{patient_name}}\nData: {{data_atual}}\n\nPaciente vem apresentando evolução [SATISFATÓRIA/ESTÁVEL] ao tratamento proposto. Observa-se melhora na amplitude de movimento e redução do quadro álgico.\n\nPlano terapêutico mantido.\n\n{{profissional_nome}}\n{{profissional_registro}}\n{{profissional_especialidade}}`
        },
        {
            title: 'Relatório para Reembolso (Convênio)',
            type: 'financeiro',
            category: 'Financeiro',
            content: `RELATÓRIO DE ATENDIMENTO PARA REEMBOLSO\n\nPaciente: {{patient_name}}\nMês de Referência: {{financeiro_mes_extenso}} / {{financeiro_ano}}\n\nDurante o mês de {{financeiro_mes_extenso}}, foram realizados {{financeiro_qtd_atendimentos}} atendimentos nesta clínica para o(a) paciente acima citado(a).\n\nO valor de cada sessão é de {{financeiro_valor_sessao}}, totalizando {{financeiro_valor_total}}.\n\nAs sessões ocorreram nas seguintes datas:\n{{financeiro_lista_datas}}\n\nPor ser verdade, firmo o presente.\n\n{{profissional_nome}}\n{{profissional_registro}}\n{{profissional_especialidade}}`
        }
    ]

    // Check if the organization already has ANY templates
    const { count } = await supabase
        .from('report_templates')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

    if (count !== null && count > 0) {
        return // Already has templates
    }

    for (const def of defaults) {
        await supabase.from('report_templates').insert({
            ...def,
            organization_id: organizationId
        })
    }
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

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    const payload = {
        title,
        type,
        category,
        content,
        config,
        updated_at: new Date().toISOString(),
        profile_id: user.id,
        organization_id: profile?.organization_id
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
        return { error: `Erro ao salvar: ${error.message}` }
    }

    revalidatePath('/dashboard/settings/reports')
    return { success: true }
}

// [UPDATED] Secure Delete Action
export async function deleteReportTemplate(id: string, password?: string) {
    const supabase = await createClient()

    // 1. Security Check (Password)
    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })

            if (authError) {
                return { error: 'Senha incorreta.' } // Match UI expected error format if simple string
                // Or better: return { success: false, message: 'Senha incorreta.' } 
                // But existing delete uses { error: string } or { success: true }
            }
        } else {
            return { error: 'Usuário não autenticado.' }
        }
    } else {
        return { error: 'Confirmação de segurança necessária.' }
    }

    const { error } = await supabase.from('report_templates').delete().eq('id', id)

    if (error) {
        return { error: "Erro ao excluir modelo" }
    }

    revalidatePath('/dashboard/settings/reports')
    return { success: true }
}

export async function duplicateReportTemplate(id: string, password?: string) {
    const supabase = await createClient()

    // 1. Security Check
    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })

            if (authError) return { success: false, message: 'Senha incorreta.' }
        } else {
            return { success: false, message: 'Usuário não autenticado.' }
        }
    } else {
        return { success: false, message: 'Confirmação de segurança necessária.' }
    }

    // 2. Fetch Original
    const { data: original, error: fetchError } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !original) {
        return { success: false, message: 'Modelo original não encontrado.' }
    }

    // 3. Create Copy
    // Remove ID, created_at, updated_at, and append "Cópia" to title
    const { id: _, created_at: __, updated_at: ___, ...rest } = original

    const newTitle = `Cópia - ${original.title}`.slice(0, 100) // Ensure limit if any

    const { error: insertError } = await supabase
        .from('report_templates')
        .insert({
            ...rest,
            title: newTitle,
            updated_at: new Date().toISOString(),
            organization_id: original.organization_id // Preserva o mesmo org_id
        })

    if (insertError) {
        console.error("Duplicate error:", insertError)
        return { success: false, message: 'Erro ao duplicar modelo.' }
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
// OpenAI Integration (Alternative) -> Migrated to Gemini
export async function generateReportAI(context: string) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
        return { error: "Chave da API GEMINI não encontrada (GEMINI_API_KEY)." }
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{
                        text: `Você é um fisioterapeuta especialista. Escreva um parágrafo de conclusão técnica para um laudo/relatório médico.
                    Regras:
                    1. Use linguagem técnica e profissional.
                    2. Sugira onde as variáveis devem se encaixar para fazer sentido (ex: {{paciente_nome}}).
                    3. Seja conciso (1 parágrafo).
                    4. Retorne apenas o texto final.
                    
                    Contexto e Dados: ${context}`
                    }]
                }
            ]
        });

        const text = result.response.text()

        return { text }
    } catch (error: any) {
        console.error("Gemini Error:", error)
        return { error: `Erro na IA: ${error.message}` }
    }
}
