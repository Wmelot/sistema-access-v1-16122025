'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { getSecurityContext } from './security'

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
    // 1. Get Security Context
    const { userId, activeOrgId } = await getSecurityContext(slug);

    // 2. Determinar a Organização Final
    let finalOrgId = organizationId || activeOrgId;

    // 3. Get Request Context
    let ip = 'unknown'
    let userAgent = 'unknown'

    try {
        const headersList = await headers()
        ip = headersList.get('x-forwarded-for') || 'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) { }

    // 4. Log (Usando Admin Client para bypass RLS)
    const maskedDetails = maskSensitiveData(details)
    const adminClient = await createAdminClient()

    const { error } = await adminClient
        .from('audit_logs' as any)
        .insert({
            user_id: userId,
            organization_id: finalOrgId,
            action,
            details: maskedDetails,
            resource,
            resource_id: resourceId,
            ip_address: ip,
            user_agent: userAgent
        })

    if (error) {
        console.error('[AUDIT LOG ERROR] Falha ao registrar ação:', action, error.message)
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
    const { userId, activeOrgId } = await getSecurityContext();
    const adminClient = await createAdminClient()

    let ip = 'unknown'
    let userAgent = 'unknown'
    try {
        const headersList = await headers()
        ip = headersList.get('x-forwarded-for') || 'unknown'
        userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) { }

    const { error } = await adminClient.from('access_logs' as any).insert({
        user_id: userId,
        organization_id: activeOrgId,
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
    const { isMaster, activeOrgId } = await getSecurityContext(slug);
    const useMasterMode = masterMode && isMaster;
    const adminClient = await createAdminClient();

    let query = adminClient
        .from('audit_logs' as any)
        .select('*')

    if (!useMasterMode) {
        query = query.eq('organization_id', activeOrgId)
    }

    query = query.not('action', 'like', 'VIEW_%')

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data: logs, error } = await query.order('created_at', { ascending: false }).limit(200)
    if (error) return []

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
                const hydrated = logs.map((l: any) => ({
                    ...l,
                    users: profileMap[l.user_id]
                }))

                if (useMasterMode) {
                    const orgIds = Array.from(new Set(hydrated.map((l: any) => l.organization_id).filter(Boolean)))
                    const { data: orgs } = await adminClient.from('organizations').select('id, name, slug').in('id', orgIds)
                    if (orgs) {
                        const orgMap = Object.fromEntries(orgs.map(o => [o.id, o]))
                        return hydrated.map(l => ({ ...l, organization: orgMap[l.organization_id] }))
                    }
                }
                return hydrated;
            }
        }
    }

    return logs || []
}

export async function getAccessLogs(slug?: string, startDate?: string, endDate?: string, masterMode: boolean = false) {
    const { isMaster, activeOrgId } = await getSecurityContext(slug);
    const useMasterMode = masterMode && isMaster;
    const adminClient = await createAdminClient();

    let query = adminClient
        .from('access_logs' as any)
        .select('*')

    if (!useMasterMode) {
        query = query.eq('organization_id', activeOrgId)
    }

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data: logs, error } = await query.order('created_at', { ascending: false }).limit(100)
    if (error) return []

    if (logs && logs.length > 0) {
        const userIds = Array.from(new Set(logs.map((l: any) => l.user_id).filter(Boolean)))
        const { data: profiles } = await adminClient.from('profiles').select('id, full_name, email').in('id', userIds)
        const profileMap = profiles ? Object.fromEntries(profiles.map(p => [p.id, p])) : {}

        const hydrated = logs.map((l: any) => ({ ...l, users: profileMap[l.user_id] }))

        if (useMasterMode) {
            const orgIds = Array.from(new Set(hydrated.map((l: any) => l.organization_id).filter(Boolean)))
            const { data: orgs } = await adminClient.from('organizations').select('id, name, slug').in('id', orgIds)
            if (orgs) {
                const orgMap = Object.fromEntries(orgs.map(o => [o.id, o]))
                return hydrated.map(l => ({ ...l, organization: orgMap[l.organization_id] }))
            }
        }
        return hydrated
    }

    return logs || []
}
