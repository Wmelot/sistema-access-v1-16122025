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

    // 3. Últimas Clínicas
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

    // 4. Cálculo de MRR Estimado (Soma dos preços mensais dos planos ativos)
    // Aqui fazemos uma query que junta as organizações com seus planos
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
            createdAt: c.created_at
        })) || []
    }
}
