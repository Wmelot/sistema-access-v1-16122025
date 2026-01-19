'use client'

import { ReactNode } from 'react'
import { useMenuVisible } from '@/hooks/use-permissions'
import type { PermissionModule } from '@/lib/permissions'

interface ProtectedMenuProps {
    module: PermissionModule
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Wrapper component to show/hide menu items based on permissions
 * 
 * Usage in Sidebar:
 * ```tsx
 * <ProtectedMenu module="patients">
 *   <SidebarItem href="/dashboard/patients" icon={Users}>
 *     Pacientes
 *   </SidebarItem>
 * </ProtectedMenu>
 * ```
 */
export function ProtectedMenu({
    module,
    children,
    fallback = null
}: ProtectedMenuProps) {
    const isVisible = useMenuVisible(module)

    // While loading or if not visible, show fallback (usually null)
    if (!isVisible) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

interface ProtectedSubmenuProps {
    module: PermissionModule
    submenu: string
    children: ReactNode
}

/**
 * Wrapper for submenu items (like Financial dropdown items)
 * 
 * Usage:
 * ```tsx
 * <ProtectedSubmenu module="financial" submenu="dre_menu">
 *   <DropdownMenuItem>DRE Gerencial</DropdownMenuItem>
 * </ProtectedSubmenu>
 * ```
 */
export function ProtectedSubmenu({
    module,
    submenu,
    children
}: ProtectedSubmenuProps) {
    const { can, loading } = usePermissions()

    if (loading) return null

    const hasPermission = can(module, submenu as any)

    if (!hasPermission) return null

    return <>{children}</>
}

// Re-export hook for convenience
import { usePermissions } from '@/hooks/use-permissions'
