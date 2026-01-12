'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { redirect } from "next/navigation"

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
        .eq('organization_id', orgId) // Filter by Org
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

    const { data, error } = await supabase.from('services').insert({
        name,
        description,
        price,
        duration,
        color,
        active: true,
        organization_id: orgId // Assign Org
    }).select().single()

    if (error) {
        console.error('Error creating service:', error)
        return { error: `Erro: ${error.message} (Code: ${error.code})` }
    }

    await logAction("CREATE_SERVICE", { name, price, color })
    revalidatePath('/dashboard/services')
    revalidatePath('/dashboard/schedule')
}

export async function updateService(id: string, formData: FormData) {
    const supabase = await createClient()

    // RLS usually handles org check, but implicit filter is safer
    // We assume update policy checks org, or we rely on the fact that user can only see their own services to edit.

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price')) || 0
    const duration = Number(formData.get('duration')) || 60
    const color = formData.get('color') as string || '#64748b'

    const { error } = await supabase.from('services').update({
        name,
        description,
        price,
        duration,
        color
    }).eq('id', id)

    if (error) {
        console.error('Error updating service:', error)
        return { error: 'Erro ao atualizar serviço' }
    }

    await logAction("UPDATE_SERVICE", { id, name, price, color })
    revalidatePath('/dashboard/services')
    revalidatePath('/dashboard/schedule')
}

export async function deleteService(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('services').delete().eq('id', id)

    if (error) {
        return { error: 'Erro ao excluir serviço' }
    }

    await logAction("DELETE_SERVICE", { id })
    revalidatePath('/dashboard/services')
}
