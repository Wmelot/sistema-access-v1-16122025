'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

const SENSITIVE_KEYS = ['cpf', 'password', 'token', 'secret', 'cvv', 'card_number', 'email'];

function maskSensitiveData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    const shaded = Array.isArray(data) ? [...data] : { ...data };

    for (const key in shaded) {
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
            shaded[key] = '********';
        } else if (typeof shaded[key] === 'object') {
            shaded[key] = maskSensitiveData(shaded[key]);
        }
    }
    return shaded;
}

export async function logAction(
    action: string,
    details: any,
    resource: string = 'system',
    resourceId?: string,
    organizationId?: string,
    slug?: string
) {
    const supabase = await createClient()

    // 1. Get User Context
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    // 2. Get Organization
    let finalOrgId = organizationId

    // Priority 1: Resolve from slug (most reliable in multi-tenant)
    if (!finalOrgId && slug) {
        const adminClient = await createAdminClient()
        const { data: org } = await adminClient.from('organizations').select('id').eq('slug', slug).single()
        if (org) finalOrgId = org.id
    }

    // Priority 2: Detect from referer URL
    if (!finalOrgId) {
        try {
            const headersList = await headers()
            const referer = headersList.get('referer')
            if (referer && referer.includes('/dashboard/')) {
                const slugPart = referer.split('/dashboard/')[1]?.split('/')[0]?.split('?')[0]
                if (slugPart && slugPart !== 'painel-master') {
                    const adminClient = await createAdminClient()
                    const { data: org } = await adminClient.from('organizations').select('id').eq('slug', slugPart).single()
                    if (org) finalOrgId = org.id
                }
            }
        } catch (e) {
            console.error("Logger referer detection failed:", e)
        }
    }

    // Priority 3 (Last resort): Get from user profile
    if (!finalOrgId) {
        const adminClient = await createAdminClient()
        const { data: profile } = await adminClient.from('profiles').select('organization_id').eq('id', user.id).single()
        finalOrgId = profile?.organization_id
    }

    // 3. Get Request Context
    let ip = 'unknown'
    let userAgent = 'unknown'

    try {
        const headersList = await headers()
        ip = headersList.get('x-forwarded-for') || 'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) { }

    // 4. Log to Audit Table (Masked) - Using Admin Client to bypass RLS
    const maskedDetails = maskSensitiveData(details)
    const adminClient = await createAdminClient()

    const { error } = await adminClient
        .from('audit_logs' as any)
        .insert({
            user_id: user?.id,
            organization_id: finalOrgId,
            action,
            details: maskedDetails,
            resource,
            resource_id: resourceId,
            ip_address: ip,
            user_agent: userAgent
        })

    if (error) {
        console.error('[AUDIT LOG ERROR] Falha ao registrar ação:', action, error.message, error.code, error.details)
    }
}

export async function logError(
    error: any,
    context: string = 'unknown',
    details: any = {},
    organizationId?: string
) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    await logAction('SYSTEM_ERROR', {
        error: errorMsg,
        stack,
        context,
        ...details
    }, 'system', undefined, organizationId);

    console.error(`[SYSTEM_ERROR][${context}]`, error);
}


export async function logAccess(
    resourceType: string,
    resourceId: string | undefined,
    action: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    const adminClient = await createAdminClient()

    // Detect organization from referer URL (most reliable)
    let organizationId: string | undefined
    try {
        const headersList = await headers()
        const referer = headersList.get('referer')
        if (referer && referer.includes('/dashboard/')) {
            const slugPart = referer.split('/dashboard/')[1]?.split('/')[0]?.split('?')[0]
            if (slugPart && slugPart !== 'painel-master') {
                const { data: org } = await adminClient.from('organizations').select('id').eq('slug', slugPart).single()
                if (org) organizationId = org.id
            }
        }
    } catch (e) { }

    // Fallback to profile
    if (!organizationId) {
        const { data: profile } = await adminClient.from('profiles').select('organization_id').eq('id', user.id).single()
        organizationId = profile?.organization_id
    }

    let ip = 'unknown'
    let userAgent = 'unknown'
    try {
        const headersList = await headers()
        ip = headersList.get('x-forwarded-for') || 'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) { }

    const { error } = await adminClient.from('access_logs' as any).insert({
        user_id: user.id,
        organization_id: organizationId,
        resource_type: resourceType,
        resource_id: resourceId,
        action: action,
        ip_address: ip,
        user_agent: userAgent
    })

    if (error) {
        console.error('[ACCESS LOG ERROR] Falha ao registrar acesso:', action, error.message)
    }
}

export async function getLogs(slug?: string, startDate?: string, endDate?: string, masterMode: boolean = false) {
    const supabase = await createClient()
    const adminClient = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await adminClient.from('profiles').select('organization_id').eq('id', user.id).single()
    const userOrgId = profile?.organization_id

    // Security check: Only Master Org (or Master User) can use masterMode
    const isMaster = userOrgId === '00000000-0000-0000-0000-000000000001' || user.email === 'wmelot@gmail.com'
    const useMasterMode = masterMode && isMaster

    let organizationId = userOrgId

    if (slug) {
        const { data: org } = await adminClient.from('organizations').select('id').eq('slug', slug).single()
        if (org) {
            // Security Enforcement: If not master, you can ONLY request your own slug's logs
            if (!isMaster && org.id !== userOrgId) {
                console.error(`Security Warning: User ${user.email} tried to access logs for slug ${slug}`)
                return [] // Block unauthorized access
            }
            organizationId = org.id
        }
    }

    // 2. Build Query (Using Admin Client to bypass RLS on audit_logs)
    let query = adminClient
        .from('audit_logs' as any)
        .select('*')

    if (!useMasterMode) {
        query = query.eq('organization_id', organizationId)
    }

    // Exclude VIEW_* actions from audit logs (they belong in access_logs)
    query = query.not('action', 'like', 'VIEW_%')

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
            const { data: profiles } = await adminClient
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

    let finalLogs = logs || []

    // 4. Hydrate Organization Info (Master Mode only)
    if (useMasterMode && finalLogs.length > 0) {
        const orgIds = Array.from(new Set(finalLogs.map((l: any) => l.organization_id).filter(Boolean)))
        if (orgIds.length > 0) {
            const { data: orgs } = await adminClient
                .from('organizations')
                .select('id, name, slug')
                .in('id', orgIds)

            if (orgs) {
                const orgMap = Object.fromEntries(orgs.map(o => [o.id, o]))
                finalLogs = finalLogs.map((l: any) => ({
                    ...l,
                    organization: orgMap[l.organization_id]
                }))
            }
        }
    }

    return finalLogs || []
}

export async function getAccessLogs(slug?: string, startDate?: string, endDate?: string, masterMode: boolean = false) {
    const supabase = await createClient()
    const adminClient = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await adminClient.from('profiles').select('organization_id').eq('id', user.id).single()
    const userOrgId = profile?.organization_id

    const isMaster = userOrgId === '00000000-0000-0000-0000-000000000001' || user.email === 'wmelot@gmail.com'
    const useMasterMode = masterMode && isMaster

    let organizationId = userOrgId

    if (slug) {
        const { data: org } = await adminClient.from('organizations').select('id').eq('slug', slug).single()
        if (org) {
            if (!isMaster && org.id !== userOrgId) return []
            organizationId = org.id
        }
    }

    let query = adminClient
        .from('access_logs' as any)
        .select('*')

    if (!useMasterMode) {
        query = query.eq('organization_id', organizationId)
    }

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data: logs, error } = await query.order('created_at', { ascending: false }).limit(100)
    if (error) {
        console.error("Error fetching Access Logs:", error)
        return []
    }

    // Hydrate User Info
    if (logs && logs.length > 0) {
        const userIds = Array.from(new Set(logs.map((l: any) => l.user_id).filter(Boolean)))
        if (userIds.length > 0) {
            const { data: profiles } = await adminClient
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

            if (profiles) {
                const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
                logs.forEach((l: any) => { l.users = profileMap[l.user_id] })
            }
        }

        // Hydrate Org Info (Master Mode)
        if (useMasterMode) {
            const orgIds = Array.from(new Set(logs.map((l: any) => l.organization_id).filter(Boolean)))
            if (orgIds.length > 0) {
                const { data: orgs } = await adminClient
                    .from('organizations')
                    .select('id, name, slug')
                    .in('id', orgIds)

                if (orgs) {
                    const orgMap = Object.fromEntries(orgs.map(o => [o.id, o]))
                    logs.forEach((l: any) => { l.organization = orgMap[l.organization_id] })
                }
            }
        }
    }

    return logs || []
}
