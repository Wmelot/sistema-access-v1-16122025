"use client"

import { usePermissions } from "@/hooks/use-permissions" // We'll need this hook
import { PermissionCode } from "@/lib/rbac"
import { ReactNode } from "react"

interface PermissionGuardProps {
    permission: PermissionCode
    children: ReactNode
    fallback?: ReactNode
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
    const { hasPermission, loading } = usePermissions()

    if (loading) return null // or skeleton?
    if (hasPermission(permission)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
