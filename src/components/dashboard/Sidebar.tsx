"use client";

import Link from "next/link";
import {
    Calendar as CalendarIcon,
    Home,
    LineChart,
    Megaphone,
    Package2,
    Users,
    ChevronLeft,
    ChevronRight,
    FileText,
    Monitor,
    MonitorOff,
    ClipboardList,
    Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReminderWidget } from "@/components/reminders/ReminderWidget";
import { useSidebar } from "@/hooks/use-sidebar";
import { TrialDisplay } from "./TrialDisplay";
import { ActiveEvaluationWidget } from "@/components/attendance/ActiveEvaluationWidget";


interface SidebarProps {
    logoUrl?: string;
    clinicName?: string;
    isMobile: boolean;
    isDesktopMode: boolean;
    toggleDesktopMode: () => void;
    features?: Record<string, any>;
}

export function Sidebar({
    logoUrl,
    clinicName,
    isMobile,
    isDesktopMode,
    toggleDesktopMode,
    features = {}, // Default to empty
    trialEndsAt // [NEW]
}: SidebarProps & { trialEndsAt?: string }) {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const displayName = clinicName || "Minha Clínica";

    // Helper to check feature
    const checkFeature = (key: string) => {
        // If undefined, assume true (legacy/dev support) unless explicitly false
        return features[key] !== false;
    }

    return (
        <div
            className={cn(
                "hidden border-r bg-muted/40 md:block sticky top-0 h-screen transition-all duration-300 ease-in-out shrink-0 print:hidden",
                isCollapsed ? "w-[60px]" : "w-[250px]"
            )}
        >
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px]", isCollapsed ? "justify-center px-2" : "px-6")}>
                    <Link href="/" className="flex items-center gap-2 font-semibold overflow-hidden whitespace-nowrap">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={displayName}
                                className={cn("object-contain transition-all", isCollapsed ? "h-8 w-8" : "h-8 w-auto")}
                            />
                        ) : (
                            <Package2 className="h-6 w-6" />
                        )}
                        {!isCollapsed && !logoUrl && <span className="">{displayName}</span>}
                        {!isCollapsed && logoUrl && <span className="sr-only">{displayName}</span>}
                    </Link>

                </div>

                {/* Active Attendance Widget - FIXED AT TOP */}
                <ActiveEvaluationWidget className="px-3 mb-2" />

                {/* Toggle Button */}
                <div className="absolute -right-3 top-20 z-10">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full shadow-md bg-background"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <nav className={cn("grid items-start px-2 text-base font-medium", isCollapsed ? "justify-center" : "lg:px-4")}>

                        {/* Desktop: Show All. Mobile: Show limited unless Desktop Mode is on */}
                        {(!isMobile || isDesktopMode) && (
                            <NavItem href="/dashboard" icon={Home} label="Tela Inicial" isCollapsed={isCollapsed} />
                        )}

                        <NavItem href="/dashboard/schedule" icon={CalendarIcon} label="Agenda" isCollapsed={isCollapsed} />
                        <NavItem href="/dashboard/patients" icon={Users} label="Pacientes" isCollapsed={isCollapsed} />
                        <NavItem href="/dashboard/financial" icon={LineChart} label="Financeiro" isCollapsed={isCollapsed} />

                        {/* Marketing Module - Example of Logic */}
                        <NavItem
                            href="/dashboard/marketing"
                            icon={Megaphone}
                            label="Campanhas"
                            isCollapsed={isCollapsed}
                            locked={!checkFeature('marketing_module')} // Assuming marketing_module key
                        />

                        {/* Advanced Reports */}
                        <NavItem
                            href="/dashboard/reports"
                            icon={FileText}
                            label="Meu faturamento"
                            isCollapsed={isCollapsed}
                            locked={!checkFeature('advanced_reports')}
                        />

                        {/* Forms - Assuming limited version for everyone, but full for some? Custom forms check is more granular */}
                        <NavItem href="/dashboard/test-form" icon={ClipboardList} label="Formulários" isCollapsed={isCollapsed} />

                        <NavItem href="/dashboard/settings/scheduling" icon={Settings} label="Configurar Agenda" isCollapsed={isCollapsed} />

                        <div className="md:hidden pt-4 mt-4 border-t">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={toggleDesktopMode}
                            >
                                {isDesktopMode ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                                {!isCollapsed && (isDesktopMode ? "Modo Mobile" : "Versão Computador")}
                            </Button>
                        </div>
                    </nav>

                    {/* REMINDERS WIDGET (Sidebar) */}
                    <ReminderWidget />

                    {/* [NEW] Trial Display */}
                    {!isCollapsed && <TrialDisplay trialEndsAt={trialEndsAt} />}

                    {/* [SLOT] WhatsAppMonitor - Future Integration */}
                    {/* Aqui entrará o componente <WhatsAppMonitor /> em breve */}
                    {/* [SLOT] WhatsAppMonitor - Future Integration */}
                    {/* Aqui entrará o componente <WhatsAppMonitor /> em breve */}
                    <div id="whatsapp-monitor-slot" />


                </div>
            </div>
        </div>
    );
}

import { Lock } from "lucide-react";

function NavItem({ href, icon: Icon, label, isCollapsed, locked = false }: { href: string, icon: any, label: string, isCollapsed: boolean, locked?: boolean }) {
    if (locked) {
        return (
            <div
                className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-gray-400 cursor-not-allowed w-full group",
                    isCollapsed ? "justify-center px-0" : "px-3"
                )}
                title={isCollapsed ? `${label} (Indisponível no seu plano)` : undefined}
            >
                <div className="relative">
                    <Icon className="h-4 w-4" />
                    <Lock className="h-2.5 w-2.5 absolute -top-1 -right-1 text-amber-500" />
                </div>
                {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                        <span>{label}</span>
                        <Lock className="h-3 w-3 text-amber-500" />
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-gray-500 transition-all hover:text-primary w-full",
                isCollapsed ? "justify-center px-0" : "px-3"
            )}
            title={isCollapsed ? label : undefined}
        >
            <Icon className="h-4 w-4" />
            {!isCollapsed && label}
        </Link>
    )
}
