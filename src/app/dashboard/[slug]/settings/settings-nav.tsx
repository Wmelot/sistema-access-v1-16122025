"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Settings, Users, Shield, FileText, Table2, Brain } from "lucide-react"
import { usePermissionsContext } from "@/components/providers/permissions-provider"
import { PermissionCode } from "@/lib/rbac"

interface SettingsNavProps {
    slug: string
}

export function SettingsNav({ slug }: SettingsNavProps) {
    const pathname = usePathname()
    const { hasPermission } = usePermissionsContext()

    const menuItems = [
        { href: `/dashboard/${slug}/settings/general`, label: "Geral", icon: Settings, permission: 'settings.tabs.general' as PermissionCode },
        { href: `/dashboard/${slug}/settings/integrations`, label: "Integrações", icon: Table2, permission: 'settings.tabs.integrations' as PermissionCode },
        { href: `/dashboard/${slug}/settings/reports`, label: "Documentos e Atestados", icon: FileText, permission: 'settings.tabs.reports' as PermissionCode },
        { href: `/dashboard/${slug}/settings/intelligence`, label: "Inteligência", icon: Brain, permission: 'settings.tabs.intelligence' as PermissionCode },
        { href: `/dashboard/${slug}/settings/users`, label: "Usuários", icon: Users, permission: 'settings.tabs.users' as PermissionCode },
        { href: `/dashboard/${slug}/settings/roles`, label: "Perfis de Acesso", icon: Shield, permission: 'settings.tabs.roles' as PermissionCode }
    ]

    const visibleItems = menuItems.filter(item => hasPermission(item.permission))

    return (
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {visibleItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative px-4 py-2 rounded-md gap-2 transition-all duration-300 flex items-center whitespace-nowrap",
                            "hover:text-primary group text-[10px] font-bold uppercase tracking-tight",
                            isActive
                                ? "bg-white dark:bg-slate-800 text-primary shadow-md"
                                : "text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                        )}
                    >
                        <item.icon className={cn(
                            "h-3.5 w-3.5 transition-all",
                            isActive ? "opacity-100 scale-110" : "opacity-60 group-hover:opacity-100"
                        )} />
                        {item.label}
                        {isActive && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                        )}
                    </Link>
                )
            })}
        </div>
    )
}
