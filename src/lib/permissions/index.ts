/**
 * Permissions System - Core Logic
 * 
 * This module provides the core functionality for the granular permissions system.
 * It handles checking permissions for actions and menu visibility.
 */

import { createClient } from '@/lib/supabase/client'

export type PermissionAction =
    | 'view'
    | 'create'
    | 'update'
    | 'delete'
    | 'menu_visible'
    | 'block'
    | 'fit_in'
    | 'cash_flow'
    | 'accounts'
    | 'discounts'
    | 'records'
    | 'certificates'
    | 'prescriptions'
    | 'files'
    | 'movements'
    | 'kits'
    | 'overview_menu'
    | 'dre_menu'
    | 'pricing_menu'
    | 'products_menu'
    | 'services_menu'
    | 'professionals_menu'
    | 'forms_menu'
    | 'questionnaires_menu'
    | 'locations_menu'
    | 'whatsapp_menu'
    | 'reports_menu'
    | 'system_menu'
    | 'migration_menu'

export type PermissionModule =
    | 'dashboard'
    | 'schedule'
    | 'patients'
    | 'financial'
    | 'inventory'
    | 'campaigns'
    | 'my_billing'
    | 'forms'
    | 'reminders'
    | 'settings'

export interface Permission {
    id: string
    role_id: string
    module: PermissionModule
    action: PermissionAction
    granted: boolean
}

/**
 * Permission cache to avoid repeated database queries
 */
let permissionsCache: Map<string, Permission[]> = new Map()
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch all permissions for a given role
 */
export async function getPermissions(roleId: string): Promise<Permission[]> {
    // Check cache
    const now = Date.now()
    if (permissionsCache.has(roleId) && (now - cacheTimestamp) < CACHE_TTL) {
        return permissionsCache.get(roleId)!
    }

    const supabase = createClient()
    const { data, error } = await supabase
        .from('granular_permissions' as any)
        .select('*')
        .eq('role_id', roleId)

    if (error) {
        console.error('[Permissions] Error fetching permissions:', error)
        return []
    }

    const permissions = data as any as Permission[]

    // Update cache
    permissionsCache.set(roleId, permissions)
    cacheTimestamp = now

    return permissions
}

/**
 * Check if a role has a specific permission
 */
export async function can(
    roleId: string,
    module: PermissionModule,
    action: PermissionAction
): Promise<boolean> {
    const permissions = await getPermissions(roleId)

    const permission = permissions.find(
        p => p.module === module && p.action === action
    )

    return permission?.granted ?? false
}

/**
 * Check multiple permissions at once
 */
export async function canAny(
    roleId: string,
    checks: Array<{ module: PermissionModule; action: PermissionAction }>
): Promise<boolean> {
    const permissions = await getPermissions(roleId)

    return checks.some(({ module, action }) => {
        const permission = permissions.find(
            p => p.module === module && p.action === action
        )
        return permission?.granted ?? false
    })
}

/**
 * Check if all permissions are granted
 */
export async function canAll(
    roleId: string,
    checks: Array<{ module: PermissionModule; action: PermissionAction }>
): Promise<boolean> {
    const permissions = await getPermissions(roleId)

    return checks.every(({ module, action }) => {
        const permission = permissions.find(
            p => p.module === module && p.action === action
        )
        return permission?.granted ?? false
    })
}

/**
 * Clear permissions cache (useful after role updates)
 */
export function clearPermissionsCache(roleId?: string) {
    if (roleId) {
        permissionsCache.delete(roleId)
    } else {
        permissionsCache.clear()
        cacheTimestamp = 0
    }
}

/**
 * Get all granted permissions for a role
 */
export async function getGrantedPermissions(roleId: string): Promise<Permission[]> {
    const permissions = await getPermissions(roleId)
    return permissions.filter(p => p.granted)
}

/**
 * Batch permission check - returns a map of permission results
 */
export async function batchCan(
    roleId: string,
    checks: Array<{ module: PermissionModule; action: PermissionAction }>
): Promise<Map<string, boolean>> {
    const permissions = await getPermissions(roleId)
    const results = new Map<string, boolean>()

    checks.forEach(({ module, action }) => {
        const key = `${module}.${action}`
        const permission = permissions.find(
            p => p.module === module && p.action === action
        )
        results.set(key, permission?.granted ?? false)
    })

    return results
}
