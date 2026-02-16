'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { getBrazilStartOfMonth, getBrazilEndOfMonth, getBrazilDate } from "@/lib/date-utils"
import { verifyAdminPassword } from "@/actions/admin-password"
import { createReminder } from "@/app/dashboard/[slug]/reminders/actions"

// [UPDATED] for Payables
export async function getTransactions(startDate?: string, endDate?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const userOrgId = profile?.organization_id

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
        .eq('organization_id', userOrgId as string) // FIX: Cast to string
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const userOrgId = profile?.organization_id

    let query = supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
        .eq('organization_id', userOrgId as string) // FIX: Cast to string
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const userOrgId = profile?.organization_id

    if (!userOrgId) return []

    const { data } = await supabase.from('financial_categories').select('*').eq('organization_id', userOrgId).order('name')
    return data || []
}


export async function createTransaction(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify Organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id
    if (!organizationId) return { error: 'Erro crítico: Organização não identificada.' }

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
            .eq('organization_id', organizationId) // Scope by Org
            .single()

        if (!existing) {
            await supabase.from('financial_categories').insert({
                name: categoryName,
                type: type === 'income' ? 'income' : 'expense',
                organization_id: organizationId
            })
        }
    }


    // 2. Handle Product Stock
    if (product_id && type === 'income') {
        const { data: product } = await supabase.from('products')
            .select('stock_quantity, is_unlimited, organization_id')
            .eq('id', product_id).single()

        // Cast to any to bypass potential type mismatch if types aren't regenerated
        const p = product as any

        if (p && p.organization_id === organizationId && !p.is_unlimited) {
            const newStock = Math.max(0, (p.stock_quantity || 0) - quantity)
            await supabase.from('products').update({ stock_quantity: newStock }).eq('id', product_id)
        }
    }


    // 3. Create Transactions (Loop for installments)
    const installmentAmount = totalAmount / installments
    const baseDate = getBrazilDate(date)
    const baseDueDate = dueDateInput ? getBrazilDate(dueDateInput) : getBrazilDate(date)

    const transactionsToInsert = []

    for (let i = 0; i < installments; i++) {
        const currentCompDate = new Date(baseDate)
        currentCompDate.setMonth(baseDate.getMonth() + i)

        const currentDueDate = new Date(baseDueDate)
        currentDueDate.setMonth(baseDueDate.getMonth() + i)

        const desc = installments > 1
            ? `${description} (${i + 1}/${installments})`
            : description

        const paidAt = status === 'paid' ? currentCompDate.toISOString() : null

        transactionsToInsert.push({
            organization_id: organizationId, // Explicit Tenant ID
            // user_id: user.id, // removed: column does not exist
            type,
            amount: installmentAmount,
            description: desc,
            category: categoryName,
            date: currentCompDate.toISOString().split('T')[0],
            due_date: currentDueDate.toISOString().split('T')[0],
            status,
            paid_at: paidAt,
            is_recurring: isRecurring,
            patient_id,
            product_id,
            professional_id,
            production_cost: (i === 0) ? production_cost : 0,
            quantity: (i === 0) ? quantity : 0
        })
    }

    const { error } = await supabase.from('transactions').insert(transactionsToInsert)

    if (error) {
        console.error('Error creating transaction:', error)
        if (error.code === '23505') return { error: 'Opa! Já existe uma transação idêntica (Duplicada).' }
        return { error: 'Erro banco de dados: ' + error.message }
    }

    await logAction("CREATE_TRANSACTION", { type, totalAmount, description, installments, status })
    revalidatePath('/dashboard/financial')
    revalidatePath('/dashboard/products')
}


export async function updateTransaction(id: string, formData: FormData) {
    const supabase = await createClient()

    // 1. Verify Scope
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) {
        return { error: 'Organização não identificada.' }
    }

    // Check Transaction Ownership
    const { data: transaction } = await supabase.from('transactions').select('*').eq('id', id).single()
    const t = transaction as any
    if (t?.organization_id && t.organization_id !== organizationId) {
        return { error: 'Acesso negado: Transação pertence a outra organização.' }
    }

    const description = formData.get('description') as string
    const amount = Number(formData.get('amount')) || 0
    const categoryName = formData.get('category') as string
    const date = formData.get('date') as string
    const dueDateInput = formData.get('due_date') as string
    const isRecurring = formData.get('is_recurring') === 'true'

    // Handle Category Creation
    if (categoryName) {
        const { data: existing } = await supabase
            .from('financial_categories')
            .select('id')
            .eq('name', categoryName)
            .eq('organization_id', organizationId)
            .single()

        if (!existing) {
            await supabase.from('financial_categories').insert({
                name: categoryName,
                type: 'expense',
                organization_id: organizationId
            })
        }
    }

    const updateData: any = {
        description,
        amount,
        category: categoryName,
        date: date ? getBrazilDate(date).toISOString().split('T')[0] : undefined,
        due_date: dueDateInput ? getBrazilDate(dueDateInput).toISOString().split('T')[0] : undefined,
        is_recurring: isRecurring,
    }

    const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)

    if (error) {
        console.error('Error updating transaction DETAILS:', error)
        return { error: `Erro ao atualizar conta: ${error.message}` }
    }

    await logAction("UPDATE_TRANSACTION", { id, description, amount })

    // [STEP 2] Audit Financial Changes on Paid Transactions
    if (t && t.status === 'paid') {
        const oldAmount = Number(t.amount) || 0
        if (Math.abs(oldAmount - amount) > 0.01) {
            const auditMsg = `🚨 ALTERAÇÃO FINANCEIRA: O valor da transação "${t.description}" foi alterado de R$ ${oldAmount} para R$ ${amount} por ${user.user_metadata?.full_name || user.email}`

            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('organization_id', organizationId)
                .in('role', ['admin', 'master'])

            if (admins) {
                for (const admin of admins) {
                    await createReminder(auditMsg, new Date(), admin.id).catch(e => console.error("Error notifying admin:", e))
                }
            }

            await logAction('FINANCIAL_CHANGE_TRANSACTION_VALUE', {
                transaction_id: id,
                old_amount: oldAmount,
                new_amount: amount,
                user: user.email
            }, 'transactions', id, organizationId)
        }
    }

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function updatePayableValue(id: string, amount: number) {
    const supabase = await createClient()

    // 1. Update Amount and Clear Pending Resolution flag
    // Also likely set status to pending if it was pending_value_resolution?
    // User flow: "Definir Valor" -> Opens Dialog -> user inputs value -> Save.
    // Result: Amount set, pending_value_resolution = false. Status remains 'pending' (ready to be paid).

    const { error } = await supabase
        .from('transactions')
        .update({
            amount: amount,
            pending_value_resolution: false
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating payable value:', error)
        return { error: 'Erro ao atualizar valor.' }
    }

    await logAction("UPDATE_PAYABLE_VALUE", { id, amount })
    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function markTransactionAsPaid(id: string, paidDate: string, amount?: number) {
    const supabase = await createClient()

    const updateData: any = {
        status: 'paid',
        paid_at: new Date(paidDate).toISOString()
    }

    if (amount !== undefined) {
        updateData.amount = amount
    }

    const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)

    if (error) {
        return { error: 'Erro ao registrar pagamento' }
    }

    revalidatePath('/dashboard/financial')
}

export async function deleteTransaction(id: string, password?: string, justification?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) {
        return { error: 'Organização não identificada.' }
    }

    // Check Ownership and Status
    const { data: transaction } = await supabase.from('transactions').select('*').eq('id', id).single()
    const t = transaction as any
    if (t?.organization_id && t.organization_id !== organizationId) {
        return { error: 'Acesso negado.' }
    }

    if (!t) return { error: 'Transação não encontrada.' }

    // [STEP 2] Financial Lock for Paid Transactions
    const isPaid = t.status === 'paid'
    const { data: profileFull } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isDeleterAdmin = ['admin', 'master'].includes(profileFull?.role || '')
    const isOwner = user.id === t.professional_id

    if (isPaid) {
        if (!isOwner && !isDeleterAdmin) {
            return { error: 'Apenas o administrador ou o próprio profissional responsável podem excluir uma transação liquidada.' }
        }

        if (!password) {
            return { error: 'PASSWORD_REQUIRED', message: 'Esta transação já foi liquidada. Digite sua senha para confirmar a exclusão.' }
        }
        if (!justification || justification.length < 5) {
            return { error: 'JUSTIFICATION_REQUIRED', message: 'Por favor, forneça uma justificativa para excluir este registro financeiro (mínimo 5 caracteres).' }
        }

        // Verify Password (Login or Admin PIN)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password
        })

        if (signInError) {
            const isValidAdmin = await verifyAdminPassword(password)
            if (!isValidAdmin) return { error: 'Senha incorreta. Use sua senha de login ou o PIN Master.' }
        }
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) {
        console.error('Error deleting transaction:', error)
        if (error.code === '23503') return { error: 'Não é possível excluir. Existem registros dependentes.' }
        return { error: 'Erro ao excluir transação.' }
    }

    await logAction("DELETE_TRANSACTION", {
        id,
        description: t.description,
        amount: t.amount,
        status: t.status,
        justification: justification || 'N/A'
    }, 'transactions', id, organizationId)

    // [STEP 2] Notify Admin of Financial Deletion
    if (isPaid && !isDeleterAdmin) {
        const adminContent = `🚨 EXCLUSÃO FINANCEIRA: A transação "${t.description}" (R$ ${t.amount}) foi excluída por ${user.user_metadata?.full_name || user.email}. Justificativa: ${justification}`

        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', organizationId)
            .in('role', ['admin', 'master'])

        if (admins) {
            for (const admin of admins) {
                await createReminder(adminContent, new Date(), admin.id).catch(e => console.error("Error notifying admin:", e))
            }
        }
    }

    revalidatePath('/dashboard/financial')
}

// ... existing exports ...



// --- Payment Fees & Card Brands Actions ---

export async function getCardBrands() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    const { data, error } = await supabase
        .from('card_brands')
        .select('*')
        .eq('active', true)
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching card brands:', error)
        return []
    }
    return data
}

export async function getPaymentFees() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    const { data, error } = await supabase
        .from('payment_method_fees')
        .select(`
            *,
            card_brand:card_brands(id, name, slug),
            acquirer:payment_acquirers(id, name, receipt_days)
        `)
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('method', { ascending: true })
        .order('installments', { ascending: true })

    if (error) {
        console.error('Error fetching fees:', error)
        return []
    }
    return data
}

export async function updatePaymentFee(id: string, fee_percent: number, fee_fixed?: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('payment_method_fees')
        .update({
            fee_percent,
            fee_fixed: fee_fixed || 0,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating fee:', error)
        return { error: 'Erro ao atualizar taxa' }
    }

    revalidatePath('/dashboard/financial')
    revalidatePath('/dashboard/patients')
}

export async function deletePaymentFee(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('payment_method_fees')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting fee:', error)
        return { error: 'Erro ao excluir taxa' }
    }

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function createCardBrand(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return { error: 'Organização não identificada' }

    const name = formData.get('name') as string
    if (!name || name.trim().length === 0) {
        return { error: 'Nome da bandeira é obrigatório' }
    }

    const slug = name.toLowerCase().replace(/\s+/g, '_')
    const icon_emoji = formData.get('icon_emoji') as string || '💳'

    // Check if brand already exists for this organization
    const { data: existing } = await supabase
        .from('card_brands')
        .select('id')
        .eq('slug', slug)
        .eq('organization_id', organizationId)
        .single()

    if (existing) {
        return { error: `Bandeira "${name}" já existe para sua organização` }
    }

    const { data, error } = await supabase
        .from('card_brands')
        .insert({
            name,
            slug,
            icon_emoji,
            organization_id: organizationId,
            active: true
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating card brand:', error)
        return { error: 'Erro ao criar bandeira: ' + error.message }
    }

    revalidatePath('/dashboard/financial')
    return { success: true, data }
}

export async function updateCardBrand(id: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const icon_emoji = formData.get('icon_emoji') as string
    const active = formData.get('active') === 'true'

    const { error } = await supabase
        .from('card_brands')
        .update({ name, icon_emoji, active })
        .eq('id', id)

    if (error) {
        console.error('Error updating card brand:', error)
        return { error: 'Erro ao atualizar bandeira' }
    }

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function deleteCardBrand(id: string) {
    const supabase = await createClient()

    // Soft delete by setting active = false
    const { error } = await supabase
        .from('card_brands')
        .update({ active: false })
        .eq('id', id)

    if (error) {
        console.error('Error deleting card brand:', error)
        return { error: 'Erro ao desativar bandeira' }
    }

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function createPaymentFee(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    const method = formData.get('method') as string
    const installments = parseInt(formData.get('installments') as string)
    const fee_percent = parseFloat(formData.get('fee_percent') as string)
    const card_brand_id = formData.get('card_brand_id') as string || null

    const acquirer_id = formData.get('acquirer_id') as string || null
    const fee_fixed = parseFloat(formData.get('fee_fixed') as string || '0')

    const { error } = await supabase
        .from('payment_method_fees')
        .insert({
            method,
            installments,
            fee_percent,
            fee_fixed,
            card_brand_id,
            acquirer_id,
            organization_id: organizationId
        })

    if (error) {
        console.error('Error creating fee:', error)
        return { error: 'Erro ao criar taxa' }
    }

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function getOrganizationPaymentSettings() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return null

    const { data } = await supabase
        .from('organization_payment_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    return data || { max_installments: 12 } // Default
}

export async function updateOrganizationPaymentSettings(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return { error: 'Organização não identificada' }

    const max_installments = parseInt(formData.get('max_installments') as string)

    // Robust Check & Update
    const { data: existing } = await supabase
        .from('organization_payment_settings')
        .select('id')
        .eq('organization_id', organizationId)
        .single()

    let error;
    if (existing) {
        const res = await supabase
            .from('organization_payment_settings')
            .update({ max_installments, updated_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
        error = res.error
    } else {
        const res = await supabase
            .from('organization_payment_settings')
            .insert({ organization_id: organizationId, max_installments })
        error = res.error
    }

    if (error) {
        console.error('Error updating payment settings:', error)
        return { error: 'Erro ao atualizar configurações: ' + error.message }
    }

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function getFinancialSummary(date: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const userOrgId = profile?.organization_id

    // Importante: Fetch Fees Configuration to fallback if applied_fee_rate is missing
    const { data: feeRules } = await supabase
        .from('payment_method_fees')
        .select('*')
        .or(`organization_id.eq.${userOrgId},organization_id.is.null`)

    // 1. Get Paid Invoices (Income) up to date
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total, payment_method, payment_date, applied_fee_rate, card_brand_id, installments, card_brands(name)')
        .eq('status', 'paid')
        .eq('organization_id', userOrgId as string)
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
        .eq('organization_id', userOrgId as string)
        .lte('date', date)

    if (expError) {
        console.error('Error fetching expenses:', expError)
        return { error: 'Erro ao buscar despesas' }
    }

    // 3. Process Data
    let totalIncome = 0
    let totalExpense = 0
    const accounts = {
        cash: 0,
        bank: 0,
        future: 0
    }
    const brandBreakdown: Record<string, number> = {}

    invoices?.forEach(inv => {
        const gross = Number(inv.total) || 0
        let feeRate = Number(inv.applied_fee_rate)

        // RETROACTIVE FIX: If feeRate is 0/null but we have brand + installments, find the rule
        if ((!feeRate || feeRate === 0) && inv.card_brand_id && feeRules) {
            // Find specific rule for this brand and installment count
            // Try exact match first
            let rule = feeRules.find((r: any) =>
                r.card_brand_id === inv.card_brand_id &&
                r.installments === (inv.installments || 1)
            )

            // If no exact match, try to find for generic brand (if specific installment exists)
            // Or usually fee rules are set: 1x, 2x, 3x... 
            // If explicit rule not found, maybe default? For now, stringent matched.

            if (rule) {
                feeRate = Number(rule.fee_percent)
            }
        }

        const feeFixed = inv.fee_fixed ? Number(inv.fee_fixed) : 0
        const netValue = gross - (gross * (feeRate / 100)) - feeFixed

        totalIncome += netValue

        // Brand Breakdown (Using NET Value)
        if (inv.card_brand_id && inv.card_brands?.name) {
            const brandName = inv.card_brands.name
            brandBreakdown[brandName] = (brandBreakdown[brandName] || 0) + netValue
        }

        const method = inv.payment_method || ''
        if (method.includes('cash') || method === 'dinheiro') {
            accounts.cash += netValue
        } else if (method.includes('credit_card')) {
            accounts.future += netValue
        } else {
            // Pix, Debit, Transfer -> Bank
            accounts.bank += netValue
        }
    })

    expenses?.forEach(exp => {
        const val = exp.amount || 0
        totalExpense += val
        accounts.bank -= val
    })

    return {
        totalBalance: totalIncome - totalExpense,
        income: totalIncome,
        expense: totalExpense,
        accounts,
        brandBreakdown
    }
}

// --- Shared Expenses Actions (Sócio) ---

export async function getClinicSharedExpenses(month: number, year: number) {
    const supabase = await createClient()

    // 1. Calculate Period
    const startDate = getBrazilStartOfMonth(year, month)
    const endDate = getBrazilEndOfMonth(year, month)

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

    const startDate = getBrazilStartOfMonth(year, month)
    const endDate = getBrazilEndOfMonth(year, month) // End of month

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

export async function getMonthlyExpenses(month: number, year: number) {
    const supabase = await createClient()
    const startDate = getBrazilStartOfMonth(year, month)
    const endDate = getBrazilEndOfMonth(year, month)

    const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) {
        console.error("Error fetching monthly expenses:", error)
        return 0
    }

    // Sum up (assuming amount is negative for expenses, or positive? Usually stored positive with type='expense')
    // Let's assume positive magnitude.
    const total = data.reduce((acc, curr) => acc + Number(curr.amount), 0)
    return total
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
                price,
                payment_method:payment_methods(name),
                service_id,
                professional_id,
                invoice:invoices(applied_fee_rate, installments, card_brand_id, card_brand:card_brands(name), payment_method_text:payment_method)
            )
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false })

    if (month && year) {
        const startDate = getBrazilStartOfMonth(year, month)
        const endDate = getBrazilEndOfMonth(year, month)
        query = query.gte('created_at', startDate).lte('created_at', endDate)
    }

    const { data: rawCommissions, error } = await query

    if (error) {
        console.error("Error fetching pro statement:", error)
        return []
    }

    // Fetch Rules & Fees for enrichment
    const { data: rules } = await supabase.from('professional_commission_rules').select('*').eq('professional_id', professionalId)

    // Fetch Organization Fees for Fallback
    const { data: { user } } = await supabase.auth.getUser()
    let feeRules: any[] = []
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (profile?.organization_id) {
            const { data: fees } = await supabase.from('payment_method_fees').select('*').or(`organization_id.eq.${profile.organization_id},organization_id.is.null`)
            feeRules = fees || []
        }
    }

    const enriched = rawCommissions?.map((comm: any) => {
        const appt = comm.appointment
        if (!appt) return comm

        const invoice = appt.invoice
        const grossPrice = appt.price || 0
        let netPrice = grossPrice
        let feeRate = 0
        let ruleApplied = 'Sem Regra'

        // 1. Calculate Fee (Use Stored Invoice Data OR Fallback)
        if (invoice) {
            feeRate = Number(invoice.applied_fee_rate || 0)

            // RETROACTIVE FIX: Fallback lookup
            if ((!feeRate || feeRate === 0) && invoice.card_brand_id && feeRules.length > 0) {
                let rule = feeRules.find((r: any) =>
                    r.card_brand_id === invoice.card_brand_id &&
                    r.installments === (invoice.installments || 1)
                )
                if (rule) feeRate = Number(rule.fee_percent)
            }
        }

        const feeFixed = invoice?.fee_fixed ? Number(invoice.fee_fixed) : 0
        const feeAmount = ((grossPrice * feeRate) / 100) + feeFixed
        netPrice = grossPrice - feeAmount

        // 2. Find Rule (Contextual Display)
        let exactRule = rules?.find((r: any) => r.service_id === appt.service_id)
        if (!exactRule) {
            exactRule = rules?.find((r: any) => r.service_id === null)
        }

        if (exactRule) {
            ruleApplied = exactRule.type === 'percentage' ? `${exactRule.value}%` : `R$ ${exactRule.value}`
        }

        return {
            ...comm,
            appointment: {
                ...appt,
                paymentMethodName: appt.payment_method?.name,
                netPrice,
                feeAmount,
                ruleApplied
            }
        }
    })

    return enriched || []
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
    // Date Range
    const startDate = getBrazilStartOfMonth(year, month).split('T')[0] // Only Date part needed for Payables? 
    // Wait, getProfessionalPayments compares 'due_date'. dueDate is just DATE or TIMESTAMP?
    // It's usually DATE column so comparisons with string 'YYYY-MM-DD' work.
    // getBrazilStartOfMonth returns '...T00:00:00-03:00'.
    // We can slice it. 

    // Actually, let's look at the original: `${year}-${month...}-01`. That is a simple string.
    // original endDate: new Date(y, m, 0).toISOString().split('T')[0]
    // If we use getBrazilEndOfMonth().split('T')[0], we get the correct last day string.

    // So let's replace both to be safe.

    // But startDate was explicitly constructed as YYYY-MM-DD string roughly.
    // Let's keep strict logic.
    const startStr = getBrazilStartOfMonth(year, month).split('T')[0]
    const endStr = getBrazilEndOfMonth(year, month).split('T')[0]

    const { data, error } = await supabase
        .from('financial_payables')
        .select('amount, date:due_date, description')
        .eq('linked_professional_id', userId)
        .eq('status', 'paid')
        .gte('due_date', startStr)
        .lte('due_date', endStr)

    if (error) {
        console.error("Error fetching pro payments:", error)
        return []
    }

    return data
}

export async function getMonthlyConfigs(month: number, year: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return null

    const { data, error } = await supabase
        .from('financial_monthly_configs' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('target_month', month)
        .eq('target_year', year)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching monthly configs:", error)
        return null
    }

    return data || { tax_rate: 0, other_deductions: 0 }
}

export async function saveMonthlyConfigs(month: number, year: number, config: { tax_rate: number, other_deductions: number }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return { error: 'Org não encontrada' }

    const { error } = await supabase
        .from('financial_monthly_configs' as any)
        .upsert({
            organization_id: organizationId,
            target_month: month,
            target_year: year,
            tax_rate: config.tax_rate,
            other_deductions: config.other_deductions,
            updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id, target_month, target_year' })

    if (error) {
        console.error("Error saving monthly configs:", error)
        return { error: 'Erro ao salvar configurações do mês.' }
    }

    revalidatePath('/dashboard/financial')
    return { success: true }
}

export async function getOverdueInvoices() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id
    if (!organizationId) return []

    // Get Today in Brazil
    const now = new Date().toISOString()

    const { data, error } = await supabase
        .from('invoices')
        .select(`
            id,
            total,
            status,
            payment_date,
            created_at,
            patient:patients(id, name, phone),
            appointment:appointments(id, start_time)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('payment_date', { ascending: true })

    if (error) {
        console.error("Error fetching overdue invoices:", error)
        return []
    }

    // Filter those where payment_date < now OR (if payment_date is null) where appointment_date < now
    const overdue = data.filter((inv: any) => {
        const dateToTarget = inv.payment_date || inv.appointment?.start_time || inv.created_at
        return new Date(dateToTarget) < new Date()
    })

    return overdue
}
