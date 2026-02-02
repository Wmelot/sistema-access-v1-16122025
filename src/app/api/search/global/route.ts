
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const slug = searchParams.get('slug')

        if (!query || query.length < 2) {
            return NextResponse.json([])
        }

        // Helper for accent-insensitive search
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const qNormalized = normalize(query)

        const systemActions = [
            { title: "Nova Consulta", subtitle: "Agendar atendimento", url: `/dashboard/${slug}/schedule?openDialog=true`, keywords: ['agendar', 'agenda', 'nova', 'consulta'] },
            { title: "Novo Paciente", subtitle: "Cadastrar ficha", url: `/dashboard/${slug}/patients?new=true`, keywords: ['paciente', 'novo', 'cadastro'] },
            { title: "Fluxo de Caixa", subtitle: "Financeiro > Relatório", url: `/dashboard/${slug}/financial?tab=overview`, keywords: ['fluxo', 'caixa', 'financeiro', 'dre'] },
            { title: "Contas a Pagar", subtitle: "Financeiro > Despesas", url: `/dashboard/${slug}/financial?tab=payables`, keywords: ['pagar', 'despesa', 'conta'] },
            { title: "Contas a Receber", subtitle: "Financeiro > Receitas", url: `/dashboard/${slug}/financial?tab=transactions`, keywords: ['receber', 'fatura', 'venda', 'receita'] },
            { title: "Relatórios de Gestão", subtitle: "Ver métricas", url: `/dashboard/${slug}/reports`, keywords: ['relatorio', 'gestao', 'metricas'] },
            { title: "Configurar WhatsApp", subtitle: "Mensagens automáticas", url: `/dashboard/${slug}/settings/communication`, keywords: ['whatsapp', 'mensagem', 'configurar', 'link'] },
            { title: "Agenda Completa", subtitle: "Ver calendário", url: `/dashboard/${slug}/schedule`, keywords: ['agenda', 'calendario'] },
            { title: "Formulários", subtitle: "Ver todos", url: `/dashboard/${slug}/forms`, keywords: ['formulario', 'personalizado', 'teste', 'sandbox'] },
            { title: "Palmilha Biomecânica", subtitle: "Formulário Sandbox", url: `/dashboard/${slug}/test-form`, keywords: ['palmilha', 'biomecanica', 'pisada', 'baropodometria'] },
            { title: "Saúde da Mulher & Pélvica", subtitle: "Formulário Sandbox", url: `/dashboard/${slug}/test-form/womens-health`, keywords: ['mulher', 'pelvica', 'ginecologica', 'uro'] },
            { title: "Avaliação PBE (Inteligente)", subtitle: "Formulário Sandbox", url: `/dashboard/${slug}/test-form/pbe`, keywords: ['pbe', 'inteligente', 'red flags', 'triagem'] },
            { title: "Avaliação Física Avançada", subtitle: "Formulário Sistema", url: `/dashboard/${slug}/test-form/physical`, keywords: ['fisica', 'avancada', 'teste', 'forca', 'cardio'] },
            { title: "Palmilha Pé Insensível", subtitle: "Formulário Sandbox", url: `/dashboard/${slug}/test-form/diabetic-foot`, keywords: ['insensivel', 'diabetico', 'pe'] },
        ]

        const results: any[] = []

        // 1. Filter System Actions (Always available)
        const matchedActions = systemActions.filter(action =>
            normalize(action.title).includes(qNormalized) ||
            action.keywords.some(k => normalize(k).includes(qNormalized))
        )

        matchedActions.forEach(action => {
            results.push({
                id: `action-${action.url}-${action.title}`,
                type: 'action',
                title: action.title,
                subtitle: action.subtitle,
                url: action.url
            })
        })

        // 2. Database Search (Requires Auth)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            let organizationId: string | null = null

            // Get Org
            if (slug) {
                const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
                if (org) organizationId = org.id
            }
            if (!organizationId) {
                const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
                organizationId = profile?.organization_id
            }

            if (organizationId) {
                // Search Patients (DB handles accents usually with proper collation, but simple ILIKE is just case insensitive)
                // For PostgreSQL `unaccent` extension is needed for true accent insensitivity with ILIKE.
                // We'll stick to ILIKE for now, assuming DB might not have unaccent.
                // Or better, we rely on the user typing generally correct or we improve DB config later.
                try {
                    const sqlPatients = `
                        SELECT id, name, phone, email, cpf
                        FROM patients 
                        WHERE organization_id = $1 
                        AND (name ILIKE $2 OR cpf ILIKE $2)
                        ORDER BY name 
                        LIMIT 5
                    `
                    const { rows: patients } = await db.query(sqlPatients, [organizationId, `%${query}%`])

                    patients.forEach((p: any) => {
                        results.push({
                            id: `patient-${p.id}`,
                            type: 'patient',
                            title: p.name,
                            subtitle: 'Prontuário / Dados',
                            url: `/dashboard/${slug}/patients/${p.id}`,
                            meta: p
                        })
                    })
                } catch (err) {
                    console.error("Error searching patients:", err)
                }

                // Search Custom Forms
                try {
                    const sqlForms = `
                        SELECT id, title, description, is_locked
                        FROM form_templates
                        WHERE (organization_id = $1 OR organization_id IS NULL)
                        AND title ILIKE $2
                        LIMIT 5
                    `
                    const { rows: forms } = await db.query(sqlForms, [organizationId, `%${query}%`])

                    forms.forEach((f: any) => {
                        results.push({
                            id: `form-${f.id}`,
                            type: 'action',
                            title: f.title,
                            subtitle: f.is_locked ? 'Formulário Padronizado' : 'Formulário Personalizado',
                            url: f.is_locked
                                ? `/dashboard/${slug}/questionnaires/preview/${f.id}`
                                : `/dashboard/${slug}/forms/builder/${f.id}`
                        })
                    })
                } catch (err) {
                    console.error("Error searching forms:", err)
                }
            }
        }

        return NextResponse.json(results)
    } catch (error) {
        console.error('API Search Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
