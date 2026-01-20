'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAllOrganizations() {
    const supabase = await createClient()

    // Verificar se usuário é master
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'master') {
        redirect('/dashboard')
    }

    // Buscar todas as organizações com informações dos owners
    const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
            *,
            owner:profiles!organizations_owner_id_fkey(
                id,
                full_name,
                email,
                phone
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar organizações:', error)
        return { organizations: [], error: error.message }
    }

    // Buscar contagem de usuários por organização
    const { data: userCounts } = await supabase
        .from('profiles')
        .select('organization_id')

    const countsMap: Record<string, number> = {}
    userCounts?.forEach((u: any) => {
        if (u.organization_id) {
            countsMap[u.organization_id] = (countsMap[u.organization_id] || 0) + 1
        }
    })

    // Adicionar contagem aos dados
    const orgsWithCounts = organizations?.map((org: any) => ({
        ...org,
        user_count: countsMap[org.id] || 0
    }))

    return { organizations: orgsWithCounts || [], error: null }
}

export async function updateOrganizationPlan(orgId: string, newPlan: string) {
    const supabase = await createClient()

    // Verificar se usuário é master
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'master') {
        return { success: false, error: 'Sem permissão' }
    }

    // Atualizar plano
    const { error } = await supabase
        .from('organizations')
        .update({ plan: newPlan })
        .eq('id', orgId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, error: null }
}

export async function toggleOrganizationStatus(orgId: string) {
    const supabase = await createClient()

    // Verificar se usuário é master
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'master') {
        return { success: false, error: 'Sem permissão' }
    }

    // Buscar status atual
    const { data: org } = await supabase
        .from('organizations')
        .select('status')
        .eq('id', orgId)
        .single()

    const newStatus = org?.status === 'active' ? 'inactive' : 'active'

    // Atualizar status
    const { error } = await supabase
        .from('organizations')
        .update({ status: newStatus })
        .eq('id', orgId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, error: null }
}

export async function getOrganizationStats(orgId: string) {
    const supabase = await createClient()

    // Buscar estatísticas
    const [patients, appointments, users] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    ])

    return {
        patients: patients.count || 0,
        appointments: appointments.count || 0,
        users: users.count || 0,
    }
}
