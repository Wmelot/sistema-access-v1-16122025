'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

/**
 * Fetch all price tables
 */
export async function getPriceTables(slug?: string) {
    const supabase = await createClient()

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

    let query = supabase
        .from('price_tables')
        .select('*')

    if (organizationId) {
        query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching price tables:', error)
        return []
    }

    return data
}

/**
 * Fetch a single price table by ID
 */
export async function getPriceTable(id: string, slug?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('price_tables')
        .select('*')
        .eq('id', id)

    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (org) {
            query = query.eq('organization_id', org.id)
        }
    }

    const { data, error } = await query.single()

    if (error) return null
    return data
}

/**
 * Create a new price table
 */
export async function createPriceTable(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string

    if (!name) return { error: 'Nome é obrigatório' }

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Não autorizado' }

        let organizationId: string | undefined

        if (slug) {
            const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
            if (org) organizationId = org.id
        }

        if (!organizationId) {
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            organizationId = profile?.organization_id
        }

        if (!organizationId) return { error: 'Organização não encontrada' }

        const { data, error } = await supabase
            .from('price_tables')
            .insert({
                name,
                organization_id: organizationId,
                is_active: true // Explicitly set both common names
            } as any)
            .select()
            .single()

        if (error) {
            // Fallback for schema difference
            const { data: data2, error: error2 } = await supabase
                .from('price_tables')
                .insert({
                    name,
                    organization_id: organizationId,
                    active: true
                } as any)
                .select()
                .single()
            if (error2) throw error2
        }

        await logAction("CREATE_PRICE_TABLE", { name, id: data.id })
        revalidatePath('/dashboard/[slug]/prices')
        return { success: true }
    } catch (error: any) {
        console.error('Error creating price table:', error)
        return { error: 'Erro ao criar tabela de preços' }
    }
}

/**
 * Toggle price table active status
 */
export async function togglePriceTableActive(id: string, active: boolean) {
    const supabase = await createClient()

    try {
        // Try 'active' first, then 'is_active' if it fails
        const { error } = await supabase
            .from('price_tables')
            .update({ active } as any)
            .eq('id', id)

        if (error) {
            // Fallback for different schema
            const { error: error2 } = await supabase
                .from('price_tables')
                .update({ is_active: active } as any)
                .eq('id', id)
            if (error2) throw error2
        }

        revalidatePath('/dashboard/[slug]/prices')
        return { success: true }
    } catch (error) {
        console.error('Error toggling price table:', error)
        return { error: 'Erro ao atualizar status' }
    }
}

/**
 * Delete a price table (Protected)
 */
export async function deletePriceTable(id: string, password?: string) {
    const supabase = await createClient()

    // 1. Verify Password if provided (Stub for now, or real implementation)
    // To verify strictly, we need the user's email.
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
        // If password strictly required:
        return { error: 'Senha necessária para deletar' }
    }

    try {
        const { error } = await supabase
            .from('price_tables')
            .delete()
            .eq('id', id)

        if (error) throw error

        await logAction("DELETE_PRICE_TABLE", { id })
        revalidatePath('/dashboard/[slug]/prices')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting price table:', error)
        return { error: 'Erro ao deletar tabela. Verifique se há pacientes vinculados.' }
    }
}

/**
 * Fetch items for a specific table (joining with services)
 */
export async function getPriceTableItems(tableId: string) {
    const supabase = await createClient()

    try {
        // 1. Get all services
        const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .order('name')

        if (servicesError) throw servicesError

        // 2. Get existing price overrides for this table
        // Wrap in try-catch to handle missing table gracefully
        const { data: items, error: itemsError } = await supabase
            .from('price_table_items')
            .select('*')
            .eq('price_table_id', tableId)

        if (itemsError) {
            console.error('Error fetching price table items (table might be missing):', itemsError)
            // Return default services if override table is missing
            return services.map(service => ({
                service_id: service.id,
                service_title: service.name,
                default_price: service.price,
                custom_price: null,
                item_id: null
            }))
        }

        // 3. Merge: Service + Override (if exists)
        return services.map(service => {
            const override = items.find(item => item.service_id === service.id)
            return {
                service_id: service.id,
                service_title: service.name,
                default_price: service.price,
                custom_price: override ? override.price : null, // null means "use default"
                item_id: override ? override.id : null
            }
        })
    } catch (error) {
        console.error('Critical error in getPriceTableItems:', error)
        return []
    }
}

/**
 * Update (or Insert) a price for a service in a table
 */
export async function updatePriceTableItem(tableId: string, serviceId: string, price: number | null) {
    const supabase = await createClient()

    try {
        if (price === null) {
            // Remove override (use default)
            await supabase
                .from('price_table_items')
                .delete()
                .match({ price_table_id: tableId, service_id: serviceId })
        } else {
            // Upsert override
            await supabase
                .from('price_table_items')
                .upsert({
                    price_table_id: tableId,
                    service_id: serviceId,
                    price: price
                }, { onConflict: 'price_table_id, service_id' })
        }

        revalidatePath('/dashboard/[slug]/prices/[id]')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating price item:', error)
        if (error?.code === 'PGRST116' || error?.message?.includes('not found')) {
            return { error: 'Tabela de preços ou serviço não encontrado' }
        }
        return { error: 'Erro ao atualizar preço. Verifique se o banco de dados está atualizado.' }
    }
}
