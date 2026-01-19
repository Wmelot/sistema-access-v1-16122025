'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    can,
    canAny,
    canAll,
    getGrantedPermissions,
    type PermissionModule,
    type PermissionAction,
    type Permission
} from '@/lib/permissions'

interface UsePermissionsReturn {
    can: (module: PermissionModule, action: PermissionAction) => boolean
    canAny: (checks: Array<{ module: PermissionModule; action: PermissionAction }>) => boolean
    canAll: (checks: Array<{ module: PermissionModule; action: PermissionAction }>) => boolean
    permissions: Permission[]
    loading: boolean
    roleId: string | null
}

/**
 * React hook for checking permissions
 * 
 * Usage:
 * ```tsx
 * const { can, loading } = usePermissions()
 * 
 * if (loading) return <Spinner />
 * if (!can('patients', 'create')) return null
 * 
 * return <CreatePatientButton />
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(true)
    const [roleId, setRoleId] = useState<string | null>(null)

    useEffect(() => {
        async function loadPermissions() {
            try {
                const supabase = createClient()

                // Get current user
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                // Get user's profile to find role_id
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role_id')
                    .eq('id', user.id)
                    .single()

                if (!profile?.role_id) {
                    setLoading(false)
                    return
                }

                setRoleId(profile.role_id)

                // Load permissions for this role
                const perms = await getGrantedPermissions(profile.role_id)
                setPermissions(perms)
            } catch (error) {
                console.error('[usePermissions] Error loading permissions:', error)
            } finally {
                setLoading(false)
            }
        }

        loadPermissions()
    }, [])

    // Helper function to check permission from loaded permissions
    const checkCan = (module: PermissionModule, action: PermissionAction): boolean => {
        return permissions.some(p => p.module === module && p.action === action && p.granted)
    }

    // Helper to check if any permission is granted
    const checkCanAny = (checks: Array<{ module: PermissionModule; action: PermissionAction }>): boolean => {
        return checks.some(({ module, action }) => checkCan(module, action))
    }

    // Helper to check if all permissions are granted
    const checkCanAll = (checks: Array<{ module: PermissionModule; action: PermissionAction }>): boolean => {
        return checks.every(({ module, action }) => checkCan(module, action))
    }

    return {
        can: checkCan,
        canAny: checkCanAny,
        canAll: checkCanAll,
        permissions,
        loading,
        roleId
    }
}

/**
 * Hook to check a single permission
 * Returns null while loading, then boolean
 */
export function usePermission(module: PermissionModule, action: PermissionAction): boolean | null {
    const { can, loading } = usePermissions()

    if (loading) return null
    return can(module, action)
}

/**
 * Hook to check if menu should be visible
 */
export function useMenuVisible(module: PermissionModule): boolean {
    const { can, loading } = usePermissions()

    if (loading) return false
    return can(module, 'menu_visible')
}
