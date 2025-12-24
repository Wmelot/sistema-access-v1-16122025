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

    // 1. Revenue (Receita Bruta)
    let revenueQuery = supabase
        .from('appointments')
        .select('price, start_time, invoice_issued')
        .in('status', ['completed', 'confirmed']) // Assuming confirmed are revenue too for accrual? Or just completed? Usually completed.
        .gte('start_time', startDate)
        .lte('start_time', endDate)

    if (viewType === 'fiscal') {
        revenueQuery = revenueQuery.eq('invoice_issued', true)
    }

    const { data: appointments, error: revenueError } = await revenueQuery
    if (revenueError) throw new Error(revenueError.message)

    const grossRevenue = appointments.reduce((sum, appt) => sum + (Number(appt.price) || 0), 0)

    // 2. Expenses (Despesas)
    // Payables use due_date (YYYY-MM-DD string).
    // startDate/endDate are likely Strings (YYYY-MM-DD).
    // Comparisons work fine as strings.
    // However, if checks rely on Date objects, we should use getBrazilDate.
    // In this file, it's just a query. The query uses strings. That's safe.
    // The only calculation is loop.

    // Check if there are other Date usages. none found in visible chunk.

    // Leaving this comment as placeholder or just confirm.
    // Actually, let's just complete the import.
    const { data: payables, error: expensesError } = await supabase
        .from('financial_payables')
        .select('*')
        .eq('status', 'paid')
        .gte('due_date', startDate) // Using due_date as competence? Or paid_at? Competence usually due_date.
        .lte('due_date', endDate)
        .eq('is_excluded', false) // Exclude items marked to be ignored

    if (expensesError) throw new Error(expensesError.message)

    // Categorize
    let taxes = 0
    let staffCosts = 0
    let marketing = 0
    let admin = 0
    let other = 0

    payables.forEach(p => {
        const val = Number(p.amount)
        switch (p.category) {
            case 'simples':
            case 'gps':
                taxes += val
                break
            case 'salary':
                staffCosts += val
                break
            case 'marketing':
                marketing += val
                break
            case 'general':
                admin += val
                break
            case 'partner_distribution':
                // Distribution is Profit Sharing, happens AFTER Operating Profit.
                // Should it appear in DRE? Usually below the line.
                break
            default:
                other += val
        }
    })

    // Prepare Line Items
    const items: DRELineItem[] = [
        { label: "Receita Operacional Bruta", value: grossRevenue, type: 'credit', isBold: true },
        {
            label: "(-) Impostos sobre Vendas",
            value: taxes,
            type: 'debit',
            children: [
                { label: "Simples Nacional / GPS", value: taxes, type: 'debit' }
            ]
        },
        { label: "(=) Receita Líquida", value: grossRevenue - taxes, type: 'total', isBold: true },

        {
            label: "(-) Custos e Despesas",
            value: staffCosts + marketing + admin + other,
            type: 'debit',
            children: [
                { label: "Pessoal / Comissões", value: staffCosts, type: 'debit' },
                { label: "Marketing", value: marketing, type: 'debit' },
                { label: "Administrativo / Geral", value: admin, type: 'debit' },
                { label: "Outros", value: other, type: 'debit' },
            ]
        },

        {
            label: "(=) Resultado Operacional (EBITDA)",
            value: (grossRevenue - taxes) - (staffCosts + marketing + admin + other),
            type: 'total',
            isBold: true
        }
    ]

    return items
}
