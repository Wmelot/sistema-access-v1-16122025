import { createClient } from "@/lib/supabase/server"

// Define Permission Codes type for safety
export type PermissionCode =
    | 'dashboard.view'
    | 'settings.view'
    | 'settings.edit'
    | 'roles.manage'
    | 'financial.view'
    | 'financial.manage'
    | 'financial.view_own'
    | 'financial.view_clinic'
    | 'financial.share_expenses'
    | 'schedule.view_all'
    | 'schedule.manage_all'
    | 'schedule.view_own'
    | 'schedule.manage_own'
    | 'patients.view'
    | 'patients.edit'
    | 'patients.delete'
    | 'records.view_all'
    | 'records.edit_all'
    | 'records.view_own'
    | 'records.edit_own'
    | 'system.view_logs'
    | 'system.manage_apis';

/**
 * Checks if the current user has a specific permission.
 * Uses the new `role_permissions` and `permissions` tables.
 */
export async function hasPermission(permission: PermissionCode): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // 1. Get User's Role ID from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single()

    if (!profile?.role_id) return false

    // Master Bypass
    // @ts-ignore
    const roleName = profile.roles?.name || (Array.isArray(profile.roles) ? profile.roles[0]?.name : '');
    if (roleName === 'Master') return true;

    // 2. Check if this Role has the mapping to the permission Code
    // We join role_permissions -> permissions
    const { count } = await supabase
        .from('role_permissions')
        .select('permissions!inner(code)', { count: 'exact', head: true })
        .eq('role_id', profile.role_id)
        .eq('permissions.code', permission)

    return (count || 0) > 0
}

/**
 * Gets all permissions for the current user.
 * Useful for initializing the frontend session or context.
 */
export async function getCurrentUserPermissions(): Promise<PermissionCode[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single()

    if (!profile?.role_id) return []

    const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('permissions(code)')
        .eq('role_id', profile.role_id)

    if (!rolePerms) return []

    // Flatten the result
    return rolePerms
        .map((rp: any) => rp.permissions?.code as PermissionCode)
        .filter(Boolean)
}

/**
 * Checks if current user is a "Master" (or Admin).
 * Useful for super-admin bypasses if hardcoded, OR simply check for a high-level permission.
 */
export async function isMasterUser(): Promise<boolean> {
    return hasPermission('settings.edit') // Proxy for Master for now
}
