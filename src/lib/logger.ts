'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function logAction(
    action: string,
    details: any,
    resource: string = 'system',
    resourceId?: string
) {
    const supabase = await createClient()

    // 1. Get User Context
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    // 2. Get Organization
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    // 3. Get Request Context
    let ip = 'unknown'
    let userAgent = 'unknown'

    try {
        const headersList = await headers()
        ip = headersList.get('x-forwarded-for') || 'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) { }

    // 4. Log to Audit Table
    await supabase
        .from('audit_logs' as any)
        .insert({
            user_id: user.id,
            organization_id: organizationId,
            action,
            details,
            resource,
            resource_id: resourceId,
            ip_address: ip,
            user_agent: userAgent
        })
}

export async function logAccess(
    resourceType: string,
    resourceId: string | undefined,
    action: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    let ip = 'unknown'
    let userAgent = 'unknown'
    try {
        const headersList = await headers()
        ip = headersList.get('x-forwarded-for') || 'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) { }

    await supabase.from('access_logs' as any).insert({
        user_id: user.id,
        organization_id: organizationId,
        resource_type: resourceType,
        resource_id: resourceId,
        action: action,
        ip_address: ip,
        user_agent: userAgent
    })
}

export async function getLogs(slug?: string, startDate?: string, endDate?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 1. Get Organization ID
    let organizationId: string | undefined
    if (slug) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        organizationId = org?.id
    }

    if (!organizationId) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        organizationId = profile?.organization_id
    }

    // 2. Build Query
    let query = supabase
        .from('audit_logs' as any)
        .select('*')
        .eq('organization_id', organizationId)

    if (startDate) {
        query = query.gte('created_at', startDate)
    }
    if (endDate) {
        query = query.lte('created_at', endDate)
    }

    const { data: logs, error } = await query.order('created_at', { ascending: false }).limit(200)
    if (error) {
        console.error("Error fetching Audit Logs:", error)
        return []
    }

    // 3. Hydrate User Info (Since Join is not available in schema)
    if (logs && logs.length > 0) {
        const userIds = Array.from(new Set(logs.map((l: any) => l.user_id).filter(Boolean)))
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

            if (profiles) {
                const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
                return logs.map((l: any) => ({
                    ...l,
                    users: profileMap[l.user_id]
                }))
            }
        }
    }

    return logs || []
}
