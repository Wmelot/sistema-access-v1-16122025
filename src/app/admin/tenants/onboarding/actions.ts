'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function onboardNewClinic(data: {
    name: string
    slug: string
    ownerEmail: string
    planSlug: string
    features: string[]
}) {
    const supabase = createAdminClient()

    try {
        // 1. Check if owner exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', data.ownerEmail)
            .single()

        if (!profile) {
            return { error: 'Usuário (Dono) não encontrado. Solicite que ele faça login no sistema primeiro ou cadastre-o manualmente.' }
        }

        // 2. Resolve Plan Config
        const { data: planConfig } = await supabase
            .from('plan_configs')
            .select('id, features')
            .eq('slug', data.planSlug)
            .single()

        if (!planConfig) {
            return { error: 'Plano selecionado não encontrado.' }
        }

        // 3. Create Organization
        const featuresToUse = { ...((planConfig as any).features || {}) }
        data.features.forEach(f => {
            featuresToUse[f] = true
        })

        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: data.name,
                slug: data.slug,
                plan: data.planSlug,
                plan_config_id: planConfig.id,
                owner_id: profile.id,
                features: featuresToUse,
                status: 'active',
                primary_color: '#000000'
            })
            .select()
            .single()

        if (orgError) throw orgError

        // 4. Update Profile to link to org as Admin
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                organization_id: org.id,
                role: 'admin'
            })
            .eq('id', profile.id)

        if (updateError) throw updateError

        revalidatePath('/admin/tenants')
        return { success: true, orgId: org.id }

    } catch (e: any) {
        console.error('Onboarding Error:', e)
        return { error: e.message }
    }
}
