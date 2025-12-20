'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

// [UPDATED] for Payables
export async function getTransactions(startDate?: string, endDate?: string) {
    const supabase = await createClient()
    let query = supabase
        .from('transactions')
        .select(`
            id,
            type,
            amount,
            description,
            category,
            date,
            due_date,
            status,
            paid_at,
            is_recurring,
            production_cost,
            patient:patients(name),
            product:products(name)
        `)
        .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query

    if (error) {
        console.error('Error fetching transactions:', error)
        return []
    }

    return data
}

export async function getPayables(filters?: { startDate?: string, endDate?: string, status?: string, searchTerm?: string }) {
    const supabase = await createClient()
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
        .order('due_date', { ascending: true })

    // Status Filter (Default to 'pending' if not specified? Or 'all'? Let's default to 'pending' to match previous behavior if undefined, but UI can override)
    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
    } else if (!filters?.status) {
        // Default behavior: pending only (backward compatibility)
        query = query.eq('status', 'pending')
    }

    // Date Range Filter (Using 'due_date' usually for Payables, or 'date'?)
    // For cash flow, Due Date is critical.
    if (filters?.startDate) {
        query = query.gte('due_date', filters.startDate)
    }
    if (filters?.endDate) {
        query = query.lte('due_date', filters.endDate)
    }

    // Search Term
    if (filters?.searchTerm) {
        query = query.ilike('description', `%${filters.searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching payables:', error)
        return []
    }
    return data || []
}

export async function getFinancialCategories() {
    const supabase = await createClient()
    const { data } = await supabase.from('financial_categories').select('*').order('name')
    return data || []
}

export async function createTransaction(formData: FormData) {
    const supabase = await createClient()

    const type = formData.get('type') as 'income' | 'expense'
    const totalAmount = Number(formData.get('amount')) || 0
    const description = formData.get('description') as string
    const categoryName = formData.get('category') as string
    const date = formData.get('date') as string // Created Date (Competência)
    const dueDateInput = formData.get('due_date') as string // Vencimento (Default to Date if empty)
    const status = formData.get('status') as string || 'paid' // 'pending' or 'paid'
    const isRecurring = formData.get('is_recurring') === 'true'

    const patient_id = formData.get('patient_id') as string || null
    const product_id = formData.get('product_id') as string || null
    const professional_id = formData.get('professional_id') as string || null // [NEW]
    const production_cost = Number(formData.get('production_cost')) || 0
    const quantity = Number(formData.get('quantity')) || 1

    // Installments
    const installments = Number(formData.get('installments')) || 1

    // 1. Handle Category (Ensure it exists in the list)
    if (categoryName) {
        const { data: existing } = await supabase
            .from('financial_categories')
            .select('id')
            .eq('name', categoryName)
            .single()

        if (!existing) {
            await supabase.from('financial_categories').insert({
                name: categoryName,
                type: type === 'income' ? 'income' : 'expense' // Simplified inference
            })
        }
    }

    // 2. Handle Product Stock
    if (product_id && type === 'income') {
        const { data: product } = await supabase.from('products').select('stock_quantity, is_unlimited').eq('id', product_id).single()

        if (product && !product.is_unlimited) {
            const newStock = Math.max(0, product.stock_quantity - quantity)
            await supabase.from('products').update({ stock_quantity: newStock }).eq('id', product_id)
        }
    }

    // 3. Create Transactions (Loop for installments)
    const installmentAmount = totalAmount / installments
    const baseDate = new Date(date)
    const baseDueDate = dueDateInput ? new Date(dueDateInput) : new Date(date)

    // For pending payables, we use "Due Date" as the main visual date usually?
    // "Date" = Competence. "Due Date" = Vencimento.

    const transactionsToInsert = []

    for (let i = 0; i < installments; i++) {
        // Competence Date shifts? Usually Yes.
        const currentCompDate = new Date(baseDate)
        currentCompDate.setMonth(baseDate.getMonth() + i)

        // Due Date shifts? Yes.
        const currentDueDate = new Date(baseDueDate)
        currentDueDate.setMonth(baseDueDate.getMonth() + i)

        const desc = installments > 1
            ? `${description} (${i + 1}/${installments})`
            : description

        // If status is 'paid', set paid_at to NOW or Date? 
        // If user says "Paid", usually means paid effectively on that date or today.
        // Let's assume paid_at = date if income, or today? 
        // Simple: If status='paid', paid_at = currentCompDate (instant payment assumption)
        const paidAt = status === 'paid' ? currentCompDate.toISOString() : null

        transactionsToInsert.push({
            type,
            amount: installmentAmount,
            description: desc,
            category: categoryName,
            date: currentCompDate.toISOString().split('T')[0],
            due_date: currentDueDate.toISOString().split('T')[0],
            status,
            paid_at: paidAt,
            is_recurring: isRecurring, // Flag all as recurring? Or just the series? 
            // Usually "Recurrence" implies infinite series, not fixed installments.
            // But if user marks "Recurring" on a single item (installments=1), it means "Remind me next month to create another".
            // If they do installments, it's NOT infinite recurrence, it's fixed.
            // So we generally ignore isRecurring if installments > 1.

            patient_id,
            product_id,
            professional_id, // [NEW]
            production_cost: (i === 0) ? production_cost : 0,
            quantity: (i === 0) ? quantity : 0
        })
    }

    const { error } = await supabase.from('transactions').insert(transactionsToInsert)

    if (error) {
        console.error('Error creating transaction:', error)
        if (error.code === '23505') return { error: 'Opa! Já existe uma transação idêntica (Duplicada).' }
        if (error.code === '23503') return { error: 'Erro de vínculo: Registro relacionado não encontrado.' }
        return { error: 'Erro ao criar transação. Tente novamente.' }
    }

    await logAction("CREATE_TRANSACTION", { type, totalAmount, description, installments, status })
    revalidatePath('/dashboard/financial')
    revalidatePath('/dashboard/products')
}

export async function markTransactionAsPaid(id: string, paidDate: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('transactions')
        .update({
            status: 'paid',
            paid_at: new Date(paidDate).toISOString() // or just date text if column is date? It's timestamp.
        })
        .eq('id', id)

    if (error) {
        return { error: 'Erro ao registrar pagamento' }
    }

    revalidatePath('/dashboard/financial')
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()

    // Optional: Restore stock if deleting a sale? 
    // For simplicity, we won't implement stock restore logic automatically yet to avoid complex bugs, 
    // unless requested. Use manual stock adjustment.

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) {
        console.error('Error deleting transaction:', error)
        if (error.code === '23503') return { error: 'Não é possível excluir. Existem registros dependentes.' }
        return { error: 'Erro ao excluir transação. Tente novamente.' }
    }

    await logAction("DELETE_TRANSACTION", { id })
    revalidatePath('/dashboard/financial')
}

// ... existing exports ...



// --- Payment Fees Actions ---

export async function getPaymentFees() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('payment_method_fees')
        .select('*')
        .order('method', { ascending: true })
        .order('installments', { ascending: true })

    if (error) {
        console.error('Error fetching fees:', error)
        return []
    }
    return data
}

export async function updatePaymentFee(id: string, fee_percent: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('payment_method_fees')
        .update({ fee_percent, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error updating fee:', error)
        return { error: 'Erro ao atualizar taxa' }
    }

    revalidatePath('/dashboard/financial')
    // We might need to revalidate patient paths too if we want immediate updates there
    revalidatePath('/dashboard/patients')
}

export async function getFinancialSummary(date: string) {
    const supabase = await createClient()

    // 1. Get Paid Invoices (Income) up to date
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total, payment_method, payment_date')
        .eq('status', 'paid')
        .lte('payment_date', date)

    if (invError) {
        console.error('Error fetching invoices:', invError)
        return { error: 'Erro ao buscar faturas' }
    }

    // 2. Get Expenses up to date
    const { data: expenses, error: expError } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('type', 'expense')
        .lte('date', date)

    if (expError) {
        console.error('Error fetching expenses:', expError)
        return { error: 'Erro ao buscar despesas' }
    }

    // 3. Process Data
    let totalIncome = 0
    let totalExpense = 0
    const accounts = {
        cash: 0, // payment_method = 'cash'
        bank: 0, // payment_method = 'pix' or 'transfer' or 'debit_card' (assuming immediate deposit)
        future: 0 // payment_method = 'credit_card' (often treated differently, but user asked for "Saldo". I will include it in "Geral" but separate in breakdown if needed. For now, let's treat it as "Receivables")
    }

    invoices?.forEach(inv => {
        const val = inv.total || 0
        totalIncome += val

        const method = inv.payment_method || ''
        if (method.includes('cash') || method === 'dinheiro') {
            accounts.cash += val
        } else if (method.includes('credit_card')) {
            // For now, let's count credit card as "Future/Receivables" but maybe user considers it balance?
            // Usually "Saldo" implies available cash. 
            // Reference image shows "C6" and "Dinheiro". 
            // I'll group Credit Card into "Banco/C6" for simplicity unless user objects, or separate it.
            // Let's separate into "A Receber (Cartão)" vs "Disponível".
            accounts.future += val
        } else {
            // Pix, Debit, Transfer -> Bank
            accounts.bank += val
        }
    })

    expenses?.forEach(exp => {
        const val = exp.amount || 0
        totalExpense += val
        // Deduct from where? We don't track source of expense yet.
        // Assume expenses come out of Bank by default, or split proportion?
        // Let's assume expenses come from "Bank" primarily for now, or just show global balance.
        // User wants "Saldo Geral".
        // Saldo Geral = Income - Expense.

        // For the breakdown cards (Dinheiro vs C6), we can't know where the expense came from without a column.
        // I will display "Saldo Geral" accurately.
        // For the specific accounts "Dinheiro" and "C6", I will show REVENUE only for now, 
        // OR warn that expenses aren't deducted per account. 
        // Actually, let's just deduct everything from "Banco" to avoid negative Cash if they pay via transfer. 
        // Or handle "Total" separately.

        accounts.bank -= val
    })

    return {
        totalBalance: totalIncome - totalExpense,
        income: totalIncome,
        expense: totalExpense,
        accounts
    }
}

// --- Shared Expenses Actions (Sócio) ---

export async function getClinicSharedExpenses(month: number, year: number) {
    const supabase = await createClient()

    // 1. Calculate Period
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    // 2. Fetch Total Clinic Expenses (type=expense)
    // We assume ALL expenses are shared? Or exclude personal expenses?
    // "Despesas Gerais da Clínica" implies general.
    // If we have 'professional_id' linked expenses, maybe those are PERSONAL expenses and shouldn't be shared?
    // User said: "o profissional sócio deve conseguir ver as despesas gerias da clínica... esse valor será abatido... O total dividido pelo numero de sócios".
    // This implies: (Total Clinic Expenses) / 3.
    // Question: Does 'Total Clinic Expenses' include expenses linked to other professionals? 
    // Usually "General" means expenses NOT linked to specific professional, OR all expenses.
    // Let's assume General = Expenses where professional_id IS NULL.
    // If an expense is linked to a pro, it's likely their personal cost or commission.

    // Let's filter for expenses where professional_id is NULL (Common expenses).
    const { data: expenses, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .is('professional_id', null)
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) {
        console.error("Error fetching shared expenses:", error)
        return 0
    }

    const total = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0
    const SHARE_COUNT = 3 // Hardcoded as requested

    return total / SHARE_COUNT
}

// --- Payroll / Commissions Actions ---

export async function getCommissionsOverview(month: number, year: number) {
    const supabase = await createClient()

    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString() // End of month

    // Fetch Commissions
    const { data: commissions, error } = await supabase
        .from('financial_commissions')
        .select(`
            amount,
            status,
            professional:profiles(id, full_name, photo_url)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

    if (error) {
        console.error("Error fetching commissions:", error)
        return []
    }

    // Group by Professional
    const grouped: any = {}
    commissions?.forEach((c: any) => {
        const pid = c.professional.id
        if (!grouped[pid]) {
            grouped[pid] = {
                professional: c.professional,
                totalPending: 0,
                totalPaid: 0,
                items: 0
            }
        }
        if (c.status === 'pending') {
            grouped[pid].totalPending += Number(c.amount)
        } else if (c.status === 'paid') {
            grouped[pid].totalPaid += Number(c.amount)
        }
        grouped[pid].items++
    })

    return Object.values(grouped)
}

export async function getProfessionalStatement(professionalId: string, month?: number, year?: number) {
    const supabase = await createClient()

    let query = supabase
        .from('financial_commissions')
        .select(`
            id,
            amount,
            status,
            created_at,
            paid_at,
            appointment:appointments(
                id,
                date:start_time,
                patient:patients(name),
                service:services(name),
                price
            )
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false })

    if (month && year) {
        const startDate = new Date(year, month - 1, 1).toISOString()
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()
        query = query.gte('created_at', startDate).lte('created_at', endDate)
    }

    const { data, error } = await query
    return data || []
}

export async function markCommissionsAsPaid(commissionIds: string[]) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('financial_commissions')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString()
        })
        .in('id', commissionIds)

    if (error) {
        return { error: 'Erro ao marcar como pago.' }
    }

    // Optional: Create a TRANSACTION (Expense) automatically?
    // User requested "Folha de Pagamento". Usually this IS an expense.
    // Let's create an expense transaction for the sum.
    // Wait, getting sum from IDs might be hard without query.
    // Let's just update for now. 
    // We can add "Create Expense" logic later if user asks.

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function getProfessionalPayments(userId: string, month: number, year: number) {
    const supabase = await createClient()

    // Date Range
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('financial_payables')
        .select('amount, date:due_date, description')
        .eq('linked_professional_id', userId)
        .eq('status', 'paid')
        .gte('due_date', startDate)
        .lte('due_date', endDate)

    if (error) {
        console.error("Error fetching pro payments:", error)
        return []
    }

    return data
}
