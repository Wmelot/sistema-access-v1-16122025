
"use client"

import { PermissionCode } from "@/lib/rbac"
import { fetchUserPermissions } from "@/app/dashboard/[slug]/rbac-actions"
import { useEffect, useState, createContext, useContext, ReactNode } from "react"

interface PermissionsContextType {
    permissions: PermissionCode[]
    loading: boolean
    hasPermission: (code: PermissionCode) => boolean
    isMaster: boolean
    isAdmin: boolean
}

const PermissionsContext = createContext<PermissionsContextType>({
    permissions: [],
    loading: true,
    hasPermission: () => false,
    isMaster: false,
    isAdmin: false
})

export function PermissionsProvider({ children, userRole }: { children: ReactNode, userRole?: string }) {
    const [permissions, setPermissions] = useState<PermissionCode[]>([])
    const [loading, setLoading] = useState(true)

    const isMaster = userRole?.toLowerCase() === 'master'
    const isAdmin = userRole?.toLowerCase() === 'administrador' || userRole?.toLowerCase() === 'admin'

    useEffect(() => {
        // Fetch permissions on mount
        fetchUserPermissions()
            .then(setPermissions)
            .finally(() => setLoading(false))
    }, [])

    const hasPermission = (code: PermissionCode) => {
        if (isMaster || isAdmin) return true
        return permissions.includes(code)
    }

    return (
        <PermissionsContext.Provider value={{ permissions, loading, hasPermission, isMaster, isAdmin }}>
            {children}
        </PermissionsContext.Provider>
    )
}

export function usePermissionsContext() {
    return useContext(PermissionsContext)
}
