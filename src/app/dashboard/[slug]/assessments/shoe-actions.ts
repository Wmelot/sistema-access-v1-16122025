'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function saveShoeModel(data: {
    brand: string;
    model: string;
    weight: number;
    drop: number;
    stackHeight: number;
    minimalismIndex: number;
    organization_id?: string;
    is_global?: boolean;
}) {
    const supabase = await createAdminClient()

    const { error } = await supabase.from('shoe_models').insert({
        brand: data.brand,
        model: data.model,
        weight: data.weight,
        drop: data.drop,
        stack_height: data.stackHeight,
        minimalism_index: data.minimalismIndex,
        organization_id: data.organization_id,
        is_global: data.is_global ?? true // Default to global if master adds it
    })

    if (error) {
        console.error('Error saving shoe model:', error)
        return { error: error.message }
    }

    revalidatePath(`/dashboard/[slug]/assessments`)
    return { success: true }
}

export async function fetchCustomShoes() {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('shoe_models')
        .select('*')
        .order('brand', { ascending: true })

    if (error) return []
    return data.map(s => ({
        id: s.id,
        brand: s.brand,
        model: s.model,
        type: s.type || 'road',
        weight: s.weight,
        drop: s.drop,
        stackHeight: s.stack_height,
        flexibility: s.flexibility,
        stabilityControl: s.stability_control,
        minimalismIndex: s.minimalism_index
    }))
}
