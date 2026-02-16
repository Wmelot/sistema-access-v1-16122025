'use server'

import { db } from "@/lib/db"
import { isMasterUser } from "@/lib/auth-master"
import { createClient, createAdminClient } from "@/lib/supabase/server"

/**
 * Resolves the active organization ID for the current request context.
 * This is the core logic for "Support Mode" impersonation.
 */
export async function getActiveOrgId(slug: string): Promise<{ orgId: string, isSupportMode: boolean }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    const adminClient = await createAdminClient()

    // 1. Fetch the target organization by slug
    const { data: org, error: orgErr } = await adminClient
        .from('organizations')
        .select('id, support_access_active, support_access_until')
        .eq('slug', slug)
        .single()

    if (orgErr || !org) throw new Error("Organização não encontrada")

    // 2. Fetch the user's assigned organization
    const { data: profile } = await adminClient
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    // 3. Logic:
    // Case A: User belongs to this organization (Natural Access)
    if (profile?.organization_id === org.id) {
        return { orgId: org.id, isSupportMode: false }
    }

    // Case B: User is a MASTER (Universal Access)
    const isMaster = await isMasterUser(user.id, user.email)

    if (isMaster) {
        const supportActive = org.support_access_active
        const until = org.support_access_until ? new Date(org.support_access_until) : null

        console.log(`[Support Mode] Master user ${user.email} accessing org ${slug}. Support Active: ${supportActive}`)
        return {
            orgId: org.id,
            isSupportMode: true // It's support mode because they are not members
        }
    }

    throw new Error("Acesso negado para esta organização. Solicite acesso para suporte técnico nas configurações da clínica.")
}

/**
 * Utility to mask sensitive data if we are in Support Mode.
 * This protects patient privacy while allowing tech maintenance.
 */
export async function maskDataIfRequired<T>(data: T, isSupportMode: boolean): Promise<T> {
    if (!isSupportMode) return data;
    if (!data) return data;

    const mask = (val: string | any, type: 'name' | 'cpf' | 'phone' | 'email') => {
        if (!val || typeof val !== 'string') return val;

        if (type === 'name') {
            const parts = val.split(' ');
            return parts.map((p, i) => i === 0 ? p : p[0] + '***').join(' ');
        }
        if (type === 'cpf') return val.substring(0, 3) + '.***.***-**';
        if (type === 'phone') return val.substring(0, 5) + '****-****';
        if (type === 'email') {
            const [user, domain] = val.split('@');
            return user.substring(0, 2) + '***@' + domain;
        }
        return '********';
    }

    // Recursive helper for objects or arrays
    const process = (item: any): any => {
        if (Array.isArray(item)) return item.map(process);
        if (item && typeof item === 'object') {
            const newItem = { ...item };
            if (newItem.name) newItem.name = mask(newItem.name, 'name');
            if (newItem.full_name) newItem.full_name = mask(newItem.full_name, 'name');
            if (newItem.cpf) newItem.cpf = mask(newItem.cpf, 'cpf');
            if (newItem.phone) newItem.phone = mask(newItem.phone, 'phone');
            if (newItem.email) newItem.email = mask(newItem.email, 'email');
            return newItem;
        }
        return item;
    }

    return process(data);
}
