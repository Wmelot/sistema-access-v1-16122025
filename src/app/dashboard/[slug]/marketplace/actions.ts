'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getMarketplaceItems(slug: string) {
    const supabase = await createClient()

    // 1. Get Org Data
    const { data: org } = await supabase
        .from('organizations')
        .select('id, features')
        .eq('slug', slug)
        .single()

    if (!org) return []

    // 2. Get all addons
    const { data: addons } = await supabase
        .from('marketplace_addons')
        .select('*')
        .eq('is_published', true)

    // 3. Get active features for this org
    const { data: activeFeatures } = await supabase
        .from('organization_features')
        .select('feature_key, is_active')
        .eq('organization_id', org.id)

    // Helper to check if a feature is active in the plan (JSONB)
    const checkPlanFeature = (key: string) => {
        const jsonb = (org.features || {}) as any
        if (key === 'whatsapp') return jsonb.whatsapp_integration || jsonb.zapi_messaging || jsonb.whatsapp
        if (key === 'financial_pro') return jsonb.financial_module
        if (key === 'gemini_ai') return jsonb.ai_assistant
        return jsonb[key] || false
    }

    const isAccessFisio = org.id === '9571532e-fdf8-4aaa-b236-416fd6459566'

    return (addons || []).map(addon => {
        const marketplaceActive = activeFeatures?.find(f => f.feature_key === addon.feature_key)?.is_active || false
        const planActive = checkPlanFeature(addon.feature_key)

        return {
            ...addon,
            isActive: marketplaceActive || planActive || isAccessFisio
        }
    })
}

export async function activateFeature(slug: string, featureKey: string, passwordConfirm: string) {
    const supabase = await createClient()

    // 1. Verify Password for security
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Não autorizado." }

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordConfirm,
    })

    if (signInError) {
        return { success: false, error: "Senha incorreta. Confirmação negada." }
    }

    // 2. Get Org
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
    if (!org) return { success: false, error: "Organização não encontrada." }

    // 3. Activate
    const { error } = await supabase
        .from('organization_features')
        .upsert({
            organization_id: org.id,
            feature_key: featureKey,
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id, feature_key' })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/${slug}/marketplace`)
    revalidatePath(`/dashboard/${slug}/settings/communication`)
    return { success: true }
}
