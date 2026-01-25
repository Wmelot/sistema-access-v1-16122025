'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

export async function getProducts() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

    if (data && data.length > 0) {
        // console.log("DEBUG: Product Keys from DB:", Object.keys(data[0]));
        // console.log("DEBUG: Sample Product:", data[0]);
        const fs = require('fs');
        const path = require('path');
        try {
            const logPath = path.resolve(process.cwd(), 'debug_schema.txt');
            fs.writeFileSync(logPath, JSON.stringify(data[0], null, 2));
        } catch (err) {
            console.error('Error writing debug log:', err);
        }
    }

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }

    return data
}

export async function createProduct(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // Get organization_id from logged user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Usuário não autenticado' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return { error: 'Erro crítico: Organização não identificada.' }

    const name = formData.get('name') as string
    const base_price = Number(formData.get('base_price')) || 0
    const cost_price = Number(formData.get('cost_price')) || 0
    const stock_quantity = Number(formData.get('stock_quantity')) || 0
    const is_unlimited = formData.get('is_unlimited') === 'on'
    const is_variable_cost = formData.get('is_variable_cost') === 'on'
    const target_markup = Number(formData.get('target_markup')) || 0
    const active = true

    const { error, data } = await adminSupabase.from('products').insert({
        name,
        organization_id: organizationId,
        base_price,
        cost_price,
        stock_quantity,
        is_unlimited,
        is_variable_cost,
        target_markup,
        active,
        price: base_price // Keep for compatibility
    }).select().single()

    if (error) {
        console.error("CREATE PRODUCT ERROR:", error)
        return { error: `Erro ao criar produto: ${error.message}` }
    }

    await logAction("CREATE_PRODUCT", { name, base_price, cost_price, stock_quantity, is_variable_cost })
    revalidatePath('/dashboard/[slug]/products')
    return { success: true, data }
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado' }

    const name = formData.get('name') as string
    const base_price = Number(formData.get('base_price')) || 0
    const cost_price = Number(formData.get('cost_price')) || 0
    const stock_quantity = Number(formData.get('stock_quantity')) || 0
    const is_unlimited = formData.get('is_unlimited') === 'on'
    const is_variable_cost = formData.get('is_variable_cost') === 'on'
    const target_markup = Number(formData.get('target_markup')) || 0

    const { error } = await adminSupabase.from('products').update({
        name,
        base_price,
        cost_price,
        stock_quantity,
        is_unlimited,
        is_variable_cost,
        target_markup,
        price: base_price
    }).eq('id', id)

    if (error) {
        console.error("UPDATE PRODUCT ERROR:", error)
        return { error: `Erro ao atualizar produto: ${error.message}` }
    }

    await logAction("UPDATE_PRODUCT", { id, name, base_price, stock_quantity, is_unlimited })
    revalidatePath('/dashboard/[slug]/products')
    return { success: true }
}

export async function deleteProduct(id: string, password?: string) {
    const supabase = await createClient()

    // 1. Verify Password
    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })

            // If login password fails, check admin password (Master PIN)
            if (signInError) {
                const { verifyAdminPassword } = await import("@/actions/admin-password")
                const isValidAdmin = await verifyAdminPassword(password)
                if (!isValidAdmin) return { error: 'Senha incorreta. Use sua senha de login ou o PIN Master.' }
            }
        } else {
            return { error: 'Usuário não autenticado' }
        }
    } else {
        return { error: 'Senha necessária para deletar' }
    }

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
        console.error("DELETE PRODUCT ERROR:", error)
        return { error: `Erro ao excluir produto: ${error.message}` }
    }

    await logAction("DELETE_PRODUCT", { id })
    revalidatePath('/dashboard/products')
    return { success: true }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', id)

    if (error) {
        return { error: 'Erro ao atualizar status' }
    }

    await logAction("TOGGLE_PRODUCT", { id, newStatus: !currentStatus })
    revalidatePath('/dashboard/products')
    return { success: true }
}
export async function getProductSalesHistory(productId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('invoice_items' as any)
        .select(`
    *,
        invoices: invoice_id(
            created_at,
            patient_id,
            patients: patient_id(name)
        )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching product history:", error)
        return []
    }

    const items: any[] = data || []

    return items.map(item => ({
        id: item.id,
        date: item.invoices?.created_at,
        patientName: item.invoices?.patients?.name || "Desconhecido",
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total_price,
        cost: item.cost_price || 0
    }))
}
