'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

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

    const { error } = await supabase
        .from('locations')
        .insert({ name, capacity, color, active: true })

    if (error) {
        return { error: 'Error creating location.' }
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

    const { error } = await supabase
        .from('locations')
        .update({ name, capacity, color })
        .eq('id', id)

    if (error) {
        return { error: 'Error updating location.' }
    }

    await logAction("UPDATE_LOCATION", { id, name })
    revalidatePath('/dashboard/locations')
    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function deleteLocation(id: string) {
    const supabase = await createClient()

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
        .update({ active: newStatus })
        .eq('id', id)

    if (error) {
        return { error: 'Error toggling status.' }
    }

    revalidatePath('/dashboard/locations')
    return { success: true }
}
