
"use client"

import { PermissionCode } from "@/lib/rbac"
import { fetchUserPermissions } from "@/app/dashboard/[slug]/rbac-actions"
import { useEffect, useState, createContext, useContext, ReactNode } from "react"

interface PermissionsContextType {
    permissions: PermissionCode[]
    loading: boolean
    hasPermission: (code: PermissionCode) => boolean
}

const PermissionsContext = createContext<PermissionsContextType>({
    permissions: [],
    loading: true,
    hasPermission: () => false
})

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const [permissions, setPermissions] = useState<PermissionCode[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch permissions on mount
        fetchUserPermissions()
            .then(setPermissions)
            .finally(() => setLoading(false))
    }, [])

    const hasPermission = (code: PermissionCode) => {
        return permissions.includes(code)
    }

    return (
        <PermissionsContext.Provider value={{ permissions, loading, hasPermission }}>
            {children}
        </PermissionsContext.Provider>
    )
}

// Renamed hook to avoid conflict with the new system
export function usePermissionsContext() {
    return useContext(PermissionsContext)
}
