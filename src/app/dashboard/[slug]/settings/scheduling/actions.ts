'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// --- TYPES ---
export type SchedulingRule = {
    id: string
    name: string
    professional_id: string | null
    service_keyword: string | null
    location_id: string
    priority: number
    is_active: boolean
    created_at: string
    profiles?: { full_name: string } | null
    locations?: { name: string } | null
}

export type ProfileSchedulingSettings = {
    id: string
    full_name: string
    smart_scheduling_mode: 'open' | 'optimized' | 'strict'
    anchor_times: string[]
}

// --- HELPERS ---
async function getOrgId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id
}

// --- RULES ACTIONS ---

export async function getSchedulingRules() {
    const supabase = await createClient()
    const orgId = await getOrgId()

    if (!orgId) return []

    const { data, error } = await supabase
        .from('scheduling_rules')
        .select(`
            *,
            profiles (full_name),
            locations (name)
        `)
        .eq('organization_id', orgId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching rules:', error)
        return []
    }
    return data
}

export async function createSchedulingRule(formData: FormData) {
    const supabase = await createAdminClient()
    const orgId = await getOrgId()

    if (!orgId) return { success: false, error: "Sessão expirada." }

    const rawData = {
        name: formData.get('name') as string,
        organization_id: orgId, // FIX: Multi-tenant security
        professional_id: formData.get('professional_id') === 'all' ? null : formData.get('professional_id'),
        service_keyword: formData.get('service_keyword') as string || null,
        location_id: formData.get('location_id') as string,
        priority: Number(formData.get('priority') || 0)
    }

    if (!rawData.name || !rawData.location_id) {
        return { success: false, error: "Nome e Local são obrigatórios." }
    }

    const { error } = await supabase.from('scheduling_rules').insert(rawData)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings/scheduling')
    return { success: true }
}

export async function deleteSchedulingRule(id: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('scheduling_rules').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings/scheduling')
    return { success: true }
}

export async function toggleRuleStatus(id: string, isActive: boolean) {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('scheduling_rules').update({ is_active: isActive }).eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings/scheduling')
    return { success: true }
}

// --- OPTIMIZATION SETTINGS ACTIONS ---

export async function getProfilesSettings() {
    const supabase = await createClient()
    const orgId = await getOrgId()

    if (!orgId) return []

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, smart_scheduling_mode, anchor_times')
        .eq('organization_id', orgId) // FIX: Security Leak
        .order('full_name')

    if (error) return []
    return data
}

export async function updateProfileSettings(id: string, mode: string, anchorTimes: string[]) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('profiles')
        .update({
            smart_scheduling_mode: mode,
            anchor_times: anchorTimes
        })
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings/scheduling')
    return { success: true }
}

// --- HELPERS FOR DROPDOWNS ---

export async function getFormRequisites() {
    const supabase = await createClient()
    const orgId = await getOrgId()

    if (!orgId) return { professionals: [], locations: [] }

    const [regsPro, regsLoc] = await Promise.all([
        supabase.from('profiles')
            .select('id, full_name')
            .eq('user_type', 'professional')
            .eq('organization_id', orgId),
        supabase.from('locations')
            .select('id, name')
            .eq('organization_id', orgId)
    ])

    return {
        professionals: regsPro.data || [],
        locations: regsLoc.data || []
    }
}
