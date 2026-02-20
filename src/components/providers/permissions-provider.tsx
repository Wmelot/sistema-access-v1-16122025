
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
    refreshPermissions: () => Promise<void>
    setPreviewPermissions: (perms: PermissionCode[] | null) => void
}

const PermissionsContext = createContext<PermissionsContextType>({
    permissions: [],
    loading: true,
    hasPermission: () => false,
    isMaster: false,
    isAdmin: false,
    refreshPermissions: async () => { },
    setPreviewPermissions: () => { }
})

export function PermissionsProvider({ children, userRole }: { children: ReactNode, userRole?: string }) {
    const [permissions, setPermissions] = useState<PermissionCode[]>([])
    const [previewPermissions, setPreviewPermissionsState] = useState<PermissionCode[] | null>(null)
    const [loading, setLoading] = useState(true)

    const isMaster = userRole?.toLowerCase() === 'master'
    const isAdmin = userRole?.toLowerCase() === 'administrador' || userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'master'

    const refreshPermissions = async () => {
        try {
            const perms = await fetchUserPermissions()
            console.log(`[PermissionsProvider] Refreshed ${perms.length} permissions.`);
            setPermissions(perms);
        } catch (error) {
            console.error("Error refreshing permissions:", error);
        }
    }

    useEffect(() => {
        console.log(`[PermissionsProvider] Mount. userRole: "${userRole}" | isMaster: ${isMaster} | isAdmin: ${isAdmin}`);
        setLoading(true)
        refreshPermissions().finally(() => setLoading(false))
    }, [userRole, isMaster, isAdmin])

    const hasPermission = (code: PermissionCode) => {
        if (isMaster) {
            // Visibility: Respect the configuration (Sidebar and Top Menu)
            if (code.startsWith('sidebar.') || code.startsWith('user_menu.')) {
                const list = previewPermissions !== null ? previewPermissions : permissions
                return list.includes(code)
            }
            // Functional Access: Master always sees cards and has total access
            return true
        }

        // Standard Users: Strictly follow database
        const list = previewPermissions || permissions
        return list.includes(code)
    }

    return (
        <PermissionsContext.Provider value={{
            permissions,
            loading,
            hasPermission,
            isMaster,
            isAdmin,
            refreshPermissions,
            setPreviewPermissions: setPreviewPermissionsState
        }}>
            {children}
        </PermissionsContext.Provider>
    )
}

export function usePermissionsContext() {
    return useContext(PermissionsContext)
}
