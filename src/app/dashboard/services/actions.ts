'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { redirect } from "next/navigation"

export async function getServices() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('*, color') // [UPDATED]
        .order('name')

    if (error) {
        console.error('Error fetching services:', error)
        return []
    }

    return data
}

export async function getService(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function createService(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price')) || 0
    const duration = Number(formData.get('duration')) || 60
    const color = formData.get('color') as string || '#64748b' // [NEW]

    // Default active to true on create
    const { data, error } = await supabase.from('services').insert({
        name,
        description,
        price,
        duration,
        color, // [NEW]
        active: true
    }).select().single()

    if (error) {
        console.error('Error creating service:', error)
        return { error: `Erro: ${error.message} (Code: ${error.code})` }
    }

    await logAction("CREATE_SERVICE", { name, price, color })
    revalidatePath('/dashboard/services')
    revalidatePath('/dashboard/schedule')
    // No redirect, let client handle UI
}

export async function updateService(id: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price')) || 0
    const duration = Number(formData.get('duration')) || 60
    const color = formData.get('color') as string || '#64748b' // [NEW]

    // We are NOT updating 'active' here because the dialog doesn't have the field yet.
    // If we included active, it would set everything to false.
    const { error } = await supabase.from('services').update({
        name,
        description,
        price,
        duration,
        color // [NEW]
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
