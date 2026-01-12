'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type PlanConfig = {
    id: string
    name: string
    slug: string
    features: Record<string, boolean | number>
    is_active: boolean
}

export async function getPlans() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('plan_configs')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) {
        console.error("Error fetching plans:", error)
        return []
    }

    return data as PlanConfig[]
}

export async function updatePlan(id: string, data: Partial<PlanConfig>) {
    const supabase = await createClient()

    // Validate Master Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // Update
    const { error } = await supabase
        .from('plan_configs')
        .update({
            name: data.name,
            features: data.features,
            is_active: data.is_active
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/plans')
    return { success: true }
}

export async function createPlan(data: Omit<PlanConfig, 'id'>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('plan_configs')
        .insert({
            name: data.name,
            slug: data.slug,
            features: data.features,
            is_active: true
        })

    if (error) return { error: error.message }

    revalidatePath('/admin/plans')
    return { success: true }
}
