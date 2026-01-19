"use client"

import { usePermissionsContext } from "@/components/providers/permissions-provider" // We'll need this hook
import { PermissionCode } from "@/lib/rbac"
import { ReactNode } from "react"

interface PermissionGuardProps {
    permission: PermissionCode
    children: ReactNode
    fallback?: ReactNode
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
    const { hasPermission, loading } = usePermissionsContext()

    if (loading) return null // or skeleton?
    if (hasPermission(permission)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
