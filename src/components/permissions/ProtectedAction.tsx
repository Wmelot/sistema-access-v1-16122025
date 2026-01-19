'use client'

import { ReactNode } from 'react'
import { usePermission } from '@/hooks/use-permissions'
import type { PermissionModule, PermissionAction } from '@/lib/permissions'

interface ProtectedActionProps {
    module: PermissionModule
    action: PermissionAction
    children: ReactNode
    fallback?: ReactNode
    hideIfDenied?: boolean
}

/**
 * Wrapper component to protect actions based on permissions
 * 
 * Usage:
 * ```tsx
 * <ProtectedAction module="patients" action="delete">
 *   <DeleteButton />
 * </ProtectedAction>
 * ```
 * 
 * With fallback:
 * ```tsx
 * <ProtectedAction 
 *   module="patients" 
 *   action="delete"
 *   fallback={<DisabledDeleteButton />}
 * >
 *   <DeleteButton />
 * </ProtectedAction>
 * ```
 */
export function ProtectedAction({
    module,
    action,
    children,
    fallback = null,
    hideIfDenied = false
}: ProtectedActionProps) {
    const hasPermission = usePermission(module, action)

    // While loading, show nothing or fallback
    if (hasPermission === null) {
        return hideIfDenied ? null : <>{fallback}</>
    }

    // If permission denied
    if (!hasPermission) {
        return hideIfDenied ? null : <>{fallback}</>
    }

    // Permission granted
    return <>{children}</>
}

interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    module: PermissionModule
    action: PermissionAction
    children: ReactNode
}

/**
 * Button that automatically disables if permission is denied
 * 
 * Usage:
 * ```tsx
 * <ProtectedButton module="patients" action="delete" onClick={handleDelete}>
 *   Delete Patient
 * </ProtectedButton>
 * ```
 */
export function ProtectedButton({
    module,
    action,
    children,
    disabled,
    ...props
}: ProtectedButtonProps) {
    const hasPermission = usePermission(module, action)

    return (
        <button
            {...props}
            disabled={disabled || hasPermission === null || !hasPermission}
            title={hasPermission === false ? 'Você não tem permissão para esta ação' : props.title}
        >
            {children}
        </button>
    )
}
