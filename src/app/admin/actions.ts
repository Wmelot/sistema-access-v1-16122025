'use server'

import { createClient } from "@/lib/supabase/server"

export async function getAdminStats() {
    const supabase = await createClient()

    // 1. Total de Clínicas
    const { count: clinicsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

    // 2. Total de Usuários
    const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // 3. Últimas Clínicas com Contagem de Profissionais
    const { data: recentClinics } = await supabase
        .from('organizations')
        .select(`
            id, 
            name, 
            status, 
            created_at, 
            plan_config_id,
            plan_configs (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch professional counts for these specific clinics
    const clinicIds = (recentClinics || []).map(c => c.id)
    const { data: profileCountsRaw } = await supabase
        .from('profiles')
        .select('organization_id')
        .in('organization_id', clinicIds)

    const profileCounts: Record<string, number> = {}
    profileCountsRaw?.forEach(p => {
        if (p.organization_id) {
            profileCounts[p.organization_id] = (profileCounts[p.organization_id] || 0) + 1
        }
    })

    // 4. Cálculo de MRR Estimado
    const { data: mrrData } = await supabase
        .from('organizations')
        .select('plan_config_id, plan_configs(price_monthly)')
        .eq('status', 'active')

    const totalMRR = (mrrData || []).reduce((acc, curr: any) => {
        return acc + (curr.plan_configs?.price_monthly || 0)
    }, 0)

    return {
        clinicsCount: clinicsCount || 0,
        usersCount: usersCount || 0,
        totalMRR: totalMRR,
        recentClinics: recentClinics?.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            plan: (c.plan_configs as any)?.name || 'Nenhum',
            createdAt: c.created_at,
            professionalCount: profileCounts[c.id] || 0
        })) || []
    }
}
