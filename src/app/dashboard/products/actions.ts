'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

export async function getProducts() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }

    return data
}

export async function createProduct(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const price = Number(formData.get('price')) || 0
    const stock_quantity = Number(formData.get('stock_quantity')) || 0
    const is_unlimited = formData.get('is_unlimited') === 'on'
    const active = true

    const { error } = await supabase.from('products').insert({
        name,
        price,
        stock_quantity,
        is_unlimited,
        active
    })

    if (error) {
        return { error: 'Erro ao criar produto' }
    }

    await logAction("CREATE_PRODUCT", { name, price, stock_quantity, is_unlimited })
    revalidatePath('/dashboard/products')
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const price = Number(formData.get('price')) || 0
    const stock_quantity = Number(formData.get('stock_quantity')) || 0
    const is_unlimited = formData.get('is_unlimited') === 'on'

    const { error } = await supabase.from('products').update({
        name,
        price,
        stock_quantity,
        is_unlimited
    }).eq('id', id)

    if (error) {
        return { error: 'Erro ao atualizar produto' }
    }

    await logAction("UPDATE_PRODUCT", { id, name, price, stock_quantity, is_unlimited })
    revalidatePath('/dashboard/products')
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
            if (signInError) {
                return { error: 'Senha incorreta' }
            }
        } else {
            return { error: 'Usuário não autenticado' }
        }
    } else {
        return { error: 'Senha necessária para deletar' }
    }

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
        return { error: 'Erro ao excluir produto' }
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
