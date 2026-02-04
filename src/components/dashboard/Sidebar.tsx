"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
    Calendar as CalendarIcon,
    Home,
    MessageCircle,
    Package2,
    Users,
    ChevronLeft,
    ChevronRight,
    Monitor,
    MonitorOff,
    ClipboardList,
    Settings,
    DollarSign,
    Bell,
    ShoppingBag,
    Lock,
    Microscope
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReminderWidget } from "@/components/reminders/ReminderWidget";
import { useSidebar } from "@/hooks/use-sidebar";
import { TrialDisplay } from "./TrialDisplay";
import { ActiveEvaluationWidget } from "@/features/attendance/components/ActiveEvaluationWidget";
import { toast } from "sonner";
import { useGlobalLoader } from "@/components/providers/global-loader-provider";
import { CommandMenu } from "@/components/layout/command-menu";

interface SidebarProps {
    logoUrl?: string;
    clinicName?: string;
    isMobile: boolean;
    isDesktopMode: boolean;
    toggleDesktopMode: () => void;
    features?: Record<string, any>;
    slug?: string;
    trialEndsAt?: string;
}

export function Sidebar(props: SidebarProps) {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const { isMobile } = props;

    // We only show the traditional sidebar on desktop
    if (isMobile && !props.isDesktopMode) return null;

    const { showLoading } = useGlobalLoader();

    return (
        <div
            className={cn(
                "hidden border-r bg-white md:block sticky top-0 h-screen transition-all duration-300 ease-in-out shrink-0 print:hidden z-[100]",
                isCollapsed ? "w-[60px]" : "w-[250px]"
            )}
        >
            <SidebarContent {...props} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} showLoading={showLoading} />
        </div>
    );
}

export function SidebarContent({
    logoUrl,
    clinicName,
    isDesktopMode,
    toggleDesktopMode,
    features = {},
    trialEndsAt,
    slug,
    isCollapsed = false,
    setIsCollapsed,
    onNavigate,
    isMobile,
    showLoading
}: SidebarProps & { isCollapsed?: boolean, setIsCollapsed?: (v: boolean) => void, onNavigate?: () => void, showLoading?: () => void }) {
    const displayName = clinicName || "Minha Clínica";
    const dashboardPrefix = `/dashboard/${slug || ''}`;

    const checkFeature = (key: string) => features[key] !== false;

    return (
        <div className="flex h-full max-h-screen flex-col bg-white">
            <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px]", isCollapsed ? "justify-center px-2" : "px-6")}>
                <Link
                    href={dashboardPrefix}
                    className="flex items-center gap-2 font-semibold overflow-hidden whitespace-nowrap"
                    onClick={onNavigate}
                >
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={displayName}
                            className={cn("object-contain transition-all rounded-md scale-95", isCollapsed ? "h-8 w-8" : "h-9 w-auto max-w-[40px]")}
                        />
                    ) : (
                        <Package2 className="h-6 w-6 shrink-0" />
                    )}
                    {!isCollapsed && <span className="truncate">{displayName}</span>}
                </Link>
            </div>

            {/* Active Attendance Widget - Handles its own collapsed state */}
            <ActiveEvaluationWidget className="px-3 py-4 mb-2" slug={slug} />

            {/* Toggle Button (Desktop only) */}
            {setIsCollapsed && (
                <div className="absolute -right-3 top-20 z-10 hidden md:block">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full shadow-md bg-background"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    </Button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {isMobile && !isDesktopMode && (
                    <div className="px-4 py-4 border-b bg-slate-50">
                        <CommandMenu />
                    </div>
                )}
                <nav className={cn("grid items-start px-2 text-base font-medium", isCollapsed ? "justify-center" : "lg:px-4 py-4 gap-1")}>
                    <NavItem href={dashboardPrefix} icon={Home} label="Tela Inicial" isCollapsed={isCollapsed} onClick={onNavigate} showLoading={showLoading} />

                    <NavItem
                        href={`${dashboardPrefix}/schedule`}
                        icon={CalendarIcon}
                        label="Agenda"
                        isCollapsed={isCollapsed}
                        locked={!checkFeature('agenda_module')}
                        onClick={onNavigate}
                        showLoading={showLoading}
                    />
                    <NavItem
                        href={`${dashboardPrefix}/patients`}
                        icon={Users}
                        label="Pacientes"
                        isCollapsed={isCollapsed}
                        locked={!checkFeature('records_module')}
                        onClick={onNavigate}
                        showLoading={showLoading}
                    />
                    <NavItem
                        href={`${dashboardPrefix}/financial?tab=my_statement`}
                        icon={DollarSign}
                        label="Finanças"
                        isCollapsed={isCollapsed}
                        locked={!checkFeature('financial_module')}
                        onClick={onNavigate}
                        showLoading={showLoading}
                    />
                    <NavItem
                        href={`${dashboardPrefix}/settings/communication`}
                        icon={MessageCircle}
                        label="WhatsApp"
                        isCollapsed={isCollapsed}
                        locked={!checkFeature('whatsapp_integration') && !checkFeature('zapi_messaging')}
                        onClick={onNavigate}
                        showLoading={showLoading}
                    />

                    <NavItem
                        href="/auditor"
                        icon={Microscope}
                        label="Auditor PBE"
                        isCollapsed={isCollapsed}
                        onClick={onNavigate}
                        showLoading={showLoading}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50"
                    />

                    <div className="my-4 border-t border-zinc-100 mx-4" />

                    <NavItem
                        href={`${dashboardPrefix}/management`}
                        icon={Settings}
                        label="Configurações Gerais"
                        isCollapsed={isCollapsed}
                        className="bg-blue-50/50 text-blue-700 hover:bg-blue-100/50 font-bold"
                        onClick={onNavigate}
                        showLoading={showLoading}
                    />


                </nav>

                {/* REMINDERS WIDGET (Sidebar) */}
                <ReminderWidget />

                {/* Trial Display */}
                {!isCollapsed && <TrialDisplay trialEndsAt={trialEndsAt} />}
            </div>
        </div>
    )
}

function NavItem({ href, icon: Icon, label, isCollapsed, locked = false, className, onClick, showLoading }: { href: string, icon: any, label: string, isCollapsed: boolean, locked?: boolean, className?: string, onClick?: () => void, showLoading?: (msg?: string) => void }) {
    if (locked) {
        return (
            <div
                className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-gray-400 cursor-not-allowed w-full group",
                    isCollapsed ? "justify-center px-0" : "px-3",
                    className
                )}
                title={isCollapsed ? `${label} (Indisponível no seu plano)` : undefined}
            >
                <div className="relative">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    <Lock className="h-2.5 w-2.5 absolute -top-1 -right-1 text-amber-500" />
                </div>
                {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                        <span className="text-sm">{label}</span>
                        <Lock className="h-3 w-3 text-amber-500" />
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link
            href={href}
            onClick={(e) => {
                if (!href.startsWith('#')) {
                    if (showLoading) {
                        showLoading(`Abrindo ${label}...`);
                        // Auto-hide after timeout as safety (since nextjs route events are tricky in app dir without events)
                        setTimeout(() => {
                            // We can't easily hide it from here if the context isn't exposed to let us know navigation finished.
                            // But usually the new page will load and if the layout re-renders it might persist or reset.
                            // Actually, GlobalLoader is in RootLayout. It persists.
                            // We need to hide it when path changes. The hook in layout or loader provider should handle this.
                            // For now let's just trigger it.
                        }, 5000);
                    } else {
                        toast.loading(`Abrindo ${label}...`, { id: `nav-${href}` });
                    }

                    if (onClick) onClick();
                }
            }}
            className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-zinc-600 transition-all hover:text-zinc-900 hover:bg-zinc-50 active:scale-95 active:brightness-90 w-full font-medium",
                isCollapsed ? "justify-center px-0" : "px-3",
                className
            )}
            title={isCollapsed ? label : undefined}
        >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {!isCollapsed && <span className="text-sm">{label}</span>}
        </Link>
    )
}
