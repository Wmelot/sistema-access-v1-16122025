'use server'

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { hasPermission } from "@/lib/rbac"

async function getCurrentOrgId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Direct DB to be safe with RLS triggers
    const res = await db.query('SELECT organization_id FROM public.profiles WHERE id = $1', [user.id])
    return res.rows[0]?.organization_id
}

export async function getLocations() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching locations:', error)
        return []
    }
    return data
}

export async function createLocation(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string) || 1
    const color = formData.get('color') as string

    const orgId = await getCurrentOrgId()
    if (!orgId) return { error: 'Organização não identificada.' }

    try {
        await db.query(
            `INSERT INTO public.locations (name, capacity, color, active, organization_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [name, capacity, color, true, orgId]
        )
    } catch (e: any) {
        console.error("Error creating location:", e)
        return { error: 'Erro ao criar local.' }
    }

    await logAction("CREATE_LOCATION", { name })
    revalidatePath('/dashboard/locations')
    revalidatePath('/dashboard/professionals') // Some dropdowns might use it
    return { success: true }
}

export async function updateLocation(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string) || 1
    const color = formData.get('color') as string

    try {
        await db.query(
            `UPDATE public.locations
             SET name = $1, capacity = $2, color = $3
             WHERE id = $4`,
            [name, capacity, color, id]
        )
    } catch (e: any) {
        console.error("Error updating location:", e)
        return { error: 'Erro ao atualizar local.' }
    }

    await logAction("UPDATE_LOCATION", { id, name })
    revalidatePath('/dashboard/locations')
    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function deleteLocation(id: string, password?: string) {
    const supabase = await createClient()

    // 0. Permission Check
    const canDelete = await hasPermission('system.view_logs')
    if (!canDelete) {
        return { error: 'Permissão negada. Apenas Master pode realizar esta ação.' }
    }

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

    // Check conflicts? For now, let DB FK handle/fail.
    // If appointments exist, this might fail unless cascading.
    // Assuming user knows or we handle error.

    const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error deleting location", error)
        // Check if FK violation (23503)
        if (error.code === '23503') {
            return { error: 'Não é possível excluir local com agendamentos vinculados. Tente desativá-lo.' }
        }
        return { error: 'Erro ao excluir local.' }
    }

    await logAction("DELETE_LOCATION", { id })
    revalidatePath('/dashboard/locations')
    return { success: true }
}

export async function toggleLocationStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient()

    // Toggle
    const newStatus = !currentStatus

    const { error } = await supabase
        .from('locations')
        .update({ active: newStatus } as any)
        .eq('id', id)

    if (error) {
        return { error: 'Error toggling status.' }
    }

    revalidatePath('/dashboard/locations')
    return { success: true }
}
