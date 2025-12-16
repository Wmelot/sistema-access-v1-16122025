"use client"

import { PermissionCode } from "@/lib/rbac"
import { fetchUserPermissions } from "@/app/dashboard/rbac-actions"
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
        // Master override? Or assume 'settings.edit' implies powerful user?
        // For now, strict check.
        // Special case: Master role usually gets ALL permissions via DB, 
        // so no need for hardcoded override here if DB is set up right.
        return permissions.includes(code)
    }

    return (
        <PermissionsContext.Provider value={{ permissions, loading, hasPermission }}>
            {children}
        </PermissionsContext.Provider>
    )
}

export function usePermissions() {
    return useContext(PermissionsContext)
}
