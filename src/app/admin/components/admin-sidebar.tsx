"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    Building2,
    LayoutDashboard,
    LogOut,
    Settings,
    ShieldCheck,
    BarChart3
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
    currentUser: any;
}

export function AdminSidebar({ currentUser }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <div className="hidden border-r border-zinc-200 bg-white text-zinc-900 md:block sticky top-0 h-screen w-[240px] shrink-0 font-sans">
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex h-16 items-center border-b border-zinc-100 px-6">
                    <div className="flex items-center gap-2.5 font-semibold text-zinc-900 tracking-tight">
                        <div className="h-6 w-6 rounded-md bg-zinc-900 text-white flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm">Axiom Central</span>
                    </div>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto py-6 px-3">
                    <nav className="flex flex-col gap-1">
                        <SectionLabel>Visão Geral</SectionLabel>
                        <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" active={pathname === "/admin"} />
                        <NavItem href="/admin/tenants" icon={Building2} label="Clínicas" active={pathname.startsWith("/admin/tenants")} />
                        <NavItem href="/admin/metrics" icon={BarChart3} label="Métricas" active={pathname.startsWith("/admin/metrics")} />

                        <SectionLabel className="mt-8">Sistema</SectionLabel>
                        <NavItem href="/admin/settings" icon={Settings} label="Configurações" active={pathname.startsWith("/admin/settings")} />
                    </nav>
                </div>

                {/* Footer User */}
                <div className="p-4 border-t border-zinc-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {currentUser?.avatarUrl ? (
                            <img src={currentUser.avatarUrl} className="h-8 w-8 rounded-full bg-zinc-100 ring-1 ring-zinc-200" />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                                {currentUser?.name?.[0]}
                            </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate text-zinc-900">{currentUser?.name}</span>
                            <span className="text-[11px] text-zinc-500 truncate uppercase tracking-wider font-semibold">Super Admin</span>
                        </div>
                    </div>
                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 gap-2 h-9 px-2 text-sm font-medium transition-colors">
                            <LogOut className="h-4 w-4" strokeWidth={2} />
                            Sair da Conta
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("px-3 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest", className)}>
            {children}
        </div>
    )
}

function NavItem({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                    ? "bg-zinc-50 text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            )}
        >
            <Icon
                className={cn("h-4 w-4 transition-colors", active ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-900")}
                strokeWidth={2}
            />
            {label}
        </Link>
    )
}
