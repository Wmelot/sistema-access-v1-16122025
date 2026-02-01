
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const slug = searchParams.get('slug')

        console.log(`[SearchAPI] Query: "${query}", Slug: "${slug}"`)

        if (!query || query.length < 2) {
            return NextResponse.json([])
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let organizationId: string | null = null

        // 1. Try to get Org from Slug (Contextual Search)
        if (slug) {
            const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
            if (org) organizationId = org.id
        }

        // 2. Fallback to User Profile Org
        if (!organizationId) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }

        if (!organizationId) return NextResponse.json([])

        const dashboardPrefix = `/dashboard/${slug || ''}`

        // 1. Search Patients (DB)
        const sql = `
            SELECT id, name, phone, email, cpf, birthdate
            FROM patients 
            WHERE organization_id = $1 
            AND (name ILIKE $2 OR cpf ILIKE $2)
            ORDER BY name 
            LIMIT 5
        `
        const { rows: patients } = await db.query(sql, [organizationId, `%${query}%`])

        // 2. Define System Actions (Hardcoded for now, but could be dynamic)
        const systemActions = [
            { title: "Nova Consulta", subtitle: "Agendar atendimento", url: `${dashboardPrefix}/schedule?openDialog=true`, keywords: ['agendar', 'agenda', 'nova', 'consulta'] },
            { title: "Novo Paciente", subtitle: "Cadastrar ficha", url: `${dashboardPrefix}/patients?new=true`, keywords: ['paciente', 'novo', 'cadastro'] },
            { title: "Fluxo de Caixa", subtitle: "Financeiro > Relatório", url: `${dashboardPrefix}/financial?tab=overview`, keywords: ['fluxo', 'caixa', 'financeiro', 'dre'] },
            { title: "Contas a Pagar", subtitle: "Financeiro > Despesas", url: `${dashboardPrefix}/financial?tab=payables`, keywords: ['pagar', 'despesa', 'conta'] },
            { title: "Contas a Receber", subtitle: "Financeiro > Receitas", url: `${dashboardPrefix}/financial?tab=transactions`, keywords: ['receber', 'fatura', 'venda', 'receita'] },
            { title: "Relatórios de Gestão", subtitle: "Ver métricas", url: `${dashboardPrefix}/reports`, keywords: ['relatorio', 'gestao', 'metricas'] },
            { title: "Configurar WhatsApp", subtitle: "Mensagens automáticas", url: `${dashboardPrefix}/settings/communication`, keywords: ['whatsapp', 'mensagem', 'configurar', 'link'] },
            { title: "Agenda Completa", subtitle: "Ver calendário", url: `${dashboardPrefix}/schedule`, keywords: ['agenda', 'calendario'] },
        ]

        // Filter Actions
        const qLower = query.toLowerCase()
        const matchedActions = systemActions.filter(action =>
            action.title.toLowerCase().includes(qLower) ||
            action.keywords.some(k => k.includes(qLower))
        )

        // 3. Build Results
        const results: any[] = []

        // Add Actions
        matchedActions.forEach(action => {
            results.push({
                id: `action-${action.url}`,
                type: 'action',
                title: action.title,
                subtitle: action.subtitle,
                url: action.url
            })
        })

        // Add Patient Contexts
        patients.forEach((p: any) => {
            // Context 1: Patient Record (Main)
            results.push({
                id: `patient-${p.id}`,
                type: 'patient',
                title: p.name,
                subtitle: 'Prontuário / Dados',
                url: `${dashboardPrefix}/patients/${p.id}`,
                meta: p
            })
            // Context 2: Schedule (Shortcut)
            results.push({
                id: `schedule-${p.id}`,
                type: 'schedule',
                title: `Agendar: ${p.name.split(' ')[0]}`,
                subtitle: 'Ir para Agenda',
                url: `${dashboardPrefix}/schedule?patientId=${p.id}&patientName=${encodeURIComponent(p.name)}&openDialog=true`,
                meta: p
            })
            // Context 3: Financial (Shortcut)
            results.push({
                id: `fin-${p.id}`,
                type: 'financial',
                title: `Financeiro: ${p.name.split(' ')[0]}`,
                subtitle: 'Ver Faturas e Pagamentos',
                url: `${dashboardPrefix}/patients/${p.id}?tab=financial`,
                meta: p
            })
        })

        return NextResponse.json(results)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
