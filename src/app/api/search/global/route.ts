
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const slug = searchParams.get('slug')

        console.log('[GlobalSearch] Request:', { query, slug })

        if (!query || query.length < 2) {
            console.log('[GlobalSearch] Query too short or empty, returning empty results.')
            return NextResponse.json([])
        }

        // Helper for accent-insensitive search
        const normalize = (str: string | null | undefined) => {
            if (!str) return '';
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        }
        const qNormalized = normalize(query)
        console.log('[GlobalSearch] Normalized query:', qNormalized)

        const systemActions = [
            { title: "Nova Consulta", subtitle: "Agendar atendimento", url: `/dashboard/${slug}/schedule?openDialog=true`, keywords: ['agendar', 'agenda', 'nova', 'consulta', 'horario', 'marcar'] },
            { title: "Novo Paciente", subtitle: "Cadastrar ficha", url: `/dashboard/${slug}/patients?new=true`, keywords: ['paciente', 'novo', 'cadastro', 'ficha', 'prontuario'] },
            { title: "Fluxo de Caixa", subtitle: "Financeiro > Relatórios", url: `/dashboard/${slug}/financial?tab=overview`, keywords: ['fluxo', 'caixa', 'financeiro', 'dre', 'balancete', 'lucro', 'movimentacao'] },
            { title: "Contas a Pagar", subtitle: "Financeiro > Despesas", url: `/dashboard/${slug}/financial?tab=payables`, keywords: ['pagar', 'despesa', 'conta', 'saida', 'custo', 'boleto', 'compra'] },
            { title: "Contas a Receber", subtitle: "Financeiro > Receitas", url: `/dashboard/${slug}/financial?tab=transactions`, keywords: ['receber', 'fatura', 'venda', 'receita', 'entrada', 'pagamento'] },
            { title: "Extrato Bancário", subtitle: "Financeiro > Conciliação", url: `/dashboard/${slug}/financial?tab=concatenation`, keywords: ['extrato', 'banco', 'conciliacao', 'ofx', 'saldo'] },
            { title: "DRE Detalhado", subtitle: "Financeiro > Demonstrativo", url: `/dashboard/${slug}/financial?tab=overview`, keywords: ['dre', 'demonstrativo', 'resultado', 'exercicio', 'contabilidade', 'gestao'] },
            { title: "Relatórios de Gestão", subtitle: "Ver métricas", url: `/dashboard/${slug}/reports`, keywords: ['relatorio', 'gestao', 'metricas', 'indicadores', 'grafico'] },
            { title: "Configurar WhatsApp", subtitle: "Mensagens automáticas", url: `/dashboard/${slug}/settings/communication`, keywords: ['whatsapp', 'mensagem', 'configurar', 'link', 'api', 'disparo'] },
            { title: "Agenda Completa", subtitle: "Ver calendário", url: `/dashboard/${slug}/schedule`, keywords: ['agenda', 'calendario', 'horario', 'grade', 'semana'] },
            { title: "Lista de Pacientes", subtitle: "Cadastro geral", url: `/dashboard/${slug}/patients`, keywords: ['pacientes', 'lista', 'prontuario', 'buscar'] },
            { title: "Formulários Customizados", subtitle: "Builder & Templates", url: `/dashboard/${slug}/forms`, keywords: ['formulario', 'personalizado', 'teste', 'builder', 'anamnese', 'modelo', 'gestao'] },
            { title: "Configurações Gerais", subtitle: "Ajustes do sistema", url: `/dashboard/${slug}/settings`, keywords: ['configuracao', 'ajuste', 'perfil', 'clinica', 'logo', 'gestao', 'configuracoes'] },
            { title: "Perfis de Acesso", subtitle: "Controle de permissões", url: `/dashboard/${slug}/settings?tab=roles`, keywords: ['perfil', 'perfis', 'acesso', 'permissao', 'rbac', 'gestao', 'seguranca'] },
        ]

        const results: any[] = []

        // 1. Filter System Actions (Search title and keywords)
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
        console.log('[GlobalSearch] System Actions matched:', matchedActions.length)

        // 2. Database Search (Requires Auth)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            let organizationId: string | null = null

            // Get Org ID from slug or user profile
            if (slug) {
                const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).maybeSingle()
                if (org) organizationId = org.id
            }
            if (!organizationId) {
                const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).maybeSingle()
                organizationId = profile?.organization_id
            }

            console.log('[GlobalSearch] Using Organization ID:', organizationId)

            if (organizationId) {
                // Parallelize search for better performance
                const [patientsRes, formsRes, financialRes] = await Promise.allSettled([
                    // Search Patients
                    db.query(`
                        SELECT id, name, phone, email, cpf
                        FROM patients 
                        WHERE organization_id = $1 
                        AND (name ILIKE $2 OR cpf ILIKE $2 OR name ILIKE $3)
                        ORDER BY name 
                        LIMIT 10
                    `, [organizationId, `%${query}%`, `%${qNormalized}%`]),

                    // Search Custom Forms
                    db.query(`
                        SELECT id, title, description, is_locked
                        FROM form_templates
                        WHERE (organization_id = $1 OR organization_id IS NULL)
                        AND title ILIKE $2
                        AND status = 'active'
                        LIMIT 5
                    `, [organizationId, `%${query}%`]),

                    // Search Financial Entries (Expenses/Incomes)
                    db.query(`
                        SELECT id, title, description, amount, type, date
                        FROM financial_entries
                        WHERE organization_id = $1
                        AND (title ILIKE $2 OR description ILIKE $2)
                        ORDER BY date DESC
                        LIMIT 5
                    `, [organizationId, `%${query}%`]),
                ])

                // Process Patients
                if (patientsRes.status === 'fulfilled') {
                    patientsRes.value.rows.forEach((p: any) => {
                        results.push({
                            id: `patient-${p.id}`,
                            type: 'patient',
                            title: p.name,
                            subtitle: `Prontuário | ${p.email || 'Sem email'}`,
                            url: `/dashboard/${slug}/patients/${p.id}`,
                            meta: p
                        })
                    })
                }

                // Process Forms
                if (formsRes.status === 'fulfilled') {
                    formsRes.value.rows.forEach((f: any) => {
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
                }

                // Process Financial Entries
                if (financialRes.status === 'fulfilled') {
                    financialRes.value.rows.forEach((entry: any) => {
                        results.push({
                            id: `financial-${entry.id}`,
                            type: 'financial',
                            title: entry.title,
                            subtitle: `${entry.type === 'expense' ? 'Despesa' : 'Receita'} | R$ ${Math.abs(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            url: `/dashboard/${slug}/financial?tab=${entry.type === 'expense' ? 'payables' : 'transactions'}&id=${entry.id}`,
                            meta: entry
                        })
                    })
                }
            }
        }

        console.log('[GlobalSearch] Final Results Count:', results.length)
        return NextResponse.json(results)
    } catch (error) {
        console.error('[GlobalSearch] API Search Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
