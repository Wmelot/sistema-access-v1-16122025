"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface SidebarContextType {
    isCollapsed: boolean
    setIsCollapsed: (value: boolean) => void
    toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children, defaultCollapsed = false }: { children: ReactNode, defaultCollapsed?: boolean }) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

    const toggleSidebar = () => setIsCollapsed(prev => !prev)

    return (
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}
