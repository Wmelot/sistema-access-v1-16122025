'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { redirect } from "next/navigation"
import { verifyAdminPassword } from "@/actions/admin-password"

async function getCurrentOrgId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id
}

export async function getServices() {
    const supabase = await createClient()
    const orgId = await getCurrentOrgId()

    if (!orgId) return []

    const { data, error } = await supabase
        .from('services')
        .select('*, color')
        .eq('organization_id', orgId)
        .order('name')

    if (error) {
        console.error('Error fetching services:', error)
        return []
    }

    return data
}

export async function getService(id: string) {
    const supabase = await createClient()
    const orgId = await getCurrentOrgId()

    // Ensure we only fetch if it belongs to org (security)
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId!)
        .single()

    if (error) return null
    return data
}

export async function createService(formData: FormData) {
    const supabase = await createClient()
    const orgId = await getCurrentOrgId()

    if (!orgId) return { error: 'Organização não identificada.' }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price')) || 0
    const duration = Number(formData.get('duration')) || 60
    const color = formData.get('color') as string || '#64748b'
    const show_online = formData.get('show_online') === 'true'
    const type = formData.get('type') as string || 'standard'

    const adminSupabase = await createAdminClient()

    try {
        const { error } = await adminSupabase
            .from('services')
            .insert({
                name,
                description: description || '',
                price,
                duration,
                color,
                active: true,
                organization_id: orgId,
                show_online,
                type
            })

        if (error) throw error

        await logAction("CREATE_SERVICE", { name, price, color })
    } catch (e: any) {
        console.error('Error creating service:', e)
        return { error: `Erro ao criar serviço: ${e.message}` }
    }

    revalidatePath('/dashboard/services')
    revalidatePath('/dashboard/schedule')
}

export async function updateService(id: string, formData: FormData) {
    const orgId = await getCurrentOrgId()
    if (!orgId) return { error: 'Organização não identificada.' }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price')) || 0
    const duration = Number(formData.get('duration')) || 60
    const color = formData.get('color') as string || '#64748b'
    const show_online = formData.get('show_online') === 'true'
    const type = formData.get('type') as string || 'standard'

    const adminSupabase = await createAdminClient()

    try {
        const { error } = await adminSupabase
            .from('services')
            .update({
                name,
                description: description || '',
                price,
                duration,
                color,
                show_online,
                type
            })
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) throw error
    } catch (e: any) {
        console.error('Error updating service:', e)
        return { error: 'Erro ao atualizar serviço' }
    }

    await logAction("UPDATE_SERVICE", { id, name, price, color })
    revalidatePath('/dashboard/services')
    revalidatePath('/dashboard/schedule')
}

export async function deleteService(id: string, password?: string) {
    const supabase = await createClient()

    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })

            // If login password fails, check admin password
            if (signInError) {
                const isValidAdmin = await verifyAdminPassword(password)
                if (!isValidAdmin) return { error: 'Senha incorreta. Use sua senha de login ou o PIN Master.' }
                // Admin password is correct, continue
            }
        } else {
            return { error: 'Usuário não autenticado' }
        }
    } else {
        return { error: 'Senha necessária para deletar' }
    }

    const { error } = await supabase.from('services').delete().eq('id', id)

    if (error) {
        return { error: 'Erro ao excluir serviço' }
    }

    await logAction("DELETE_SERVICE", { id })
    revalidatePath('/dashboard/services')
    return { success: true }
}

export async function toggleServiceStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient()

    const adminSupabase = await createAdminClient()

    try {
        const { error } = await adminSupabase
            .from('services')
            .update({ active: !currentStatus })
            .eq('id', id)

        if (error) throw error
    } catch (e: any) {
        console.error('Error toggling service status:', e)
        return { error: 'Erro ao alterar status do serviço' }
    }

    await logAction("TOGGLE_SERVICE_STATUS", { id, status: !currentStatus })
    revalidatePath('/dashboard/services')
    revalidatePath('/dashboard/schedule')
    return { success: true }
}
