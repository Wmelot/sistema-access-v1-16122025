"use server"

import { createClient } from "@/lib/supabase/server"
import { getBrazilDate } from "@/lib/date-utils"

export interface DRELineItem {
    label: string
    value: number
    type: 'credit' | 'debit' | 'total'
    children?: DRELineItem[]
    isBold?: boolean
}

export interface DREData {
    month: string // YYYY-MM
    items: DRELineItem[]
}

export async function getDREData(startDate: string, endDate: string, viewType: 'managerial' | 'fiscal') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const orgId = profile?.organization_id

    const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', orgId)
        .gte('date', startDate)
        .lte('date', endDate)

    if (tError) throw new Error(tError.message)

    let grossRevenue = 0
    let taxes = 0
    let staffCosts = 0
    let marketing = 0
    let admin = 0
    let equipment = 0
    let services = 0
    let utilities = 0
    let other = 0

    transactions?.forEach(t => {
        const val = Number(t.amount) || 0
        if (t.type === 'income') {
            grossRevenue += val
        } else {
            const cat = (t.category || '').toLowerCase()
            if (cat === 'impostos' || cat === 'taxas') taxes += val
            else if (cat === 'pessoal' || cat === 'comissões' || cat === 'folha') staffCosts += val
            else if (cat === 'marketing') marketing += val
            else if (cat === 'administrativo' || cat === 'geral' || cat === 'aluguel') admin += val
            else if (cat === 'equipamento' || cat === 'laser') equipment += val
            else if (cat === 'serviços' || cat === 'contabilidade' || cat === 'limpeza') services += val
            else if (cat === 'utilidades' || cat === 'cemig' || cat === 'internet' || cat === 'sistema') utilities += val
            else other += val
        }
    })

    const totalExpenses = taxes + staffCosts + marketing + admin + equipment + services + utilities + other

    const items: DRELineItem[] = [
        { label: "Receita Operacional Bruta", value: grossRevenue, type: 'credit', isBold: true },
        {
            label: "(-) Impostos e Taxas",
            value: taxes,
            type: 'debit',
            children: [
                { label: "Impostos Federais/Municipais", value: taxes, type: 'debit' }
            ]
        },
        { label: "(=) Receita Líquida", value: grossRevenue - taxes, type: 'total', isBold: true },

        {
            label: "(-) Custos e Despesas Operacionais",
            value: totalExpenses - taxes,
            type: 'debit',
            children: [
                { label: "Pessoal e Comissões", value: staffCosts, type: 'debit' },
                { label: "Serviços Terceiros", value: services, type: 'debit' },
                { label: "Utilidades / Sistema / Aluguel", value: utilities + admin, type: 'debit' },
                { label: "Equipamentos e Materiais", value: equipment, type: 'debit' },
                { label: "Marketing", value: marketing, type: 'debit' },
                { label: "Outros", value: other, type: 'debit' },
            ]
        },

        {
            label: "(=) Resultado Operacional (Lucro/Prejuízo)",
            value: grossRevenue - totalExpenses,
            type: 'total',
            isBold: true
        }
    ]

    return items
}
