"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
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
    Microscope,
    Briefcase,
    MapPin,
    Stethoscope,
    FileText,
    Tag,
    Megaphone,
    Shield,
    Activity,
    FileSignature,
    PenTool
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
import { QuickAttendanceButton } from "@/features/attendance/components/QuickAttendanceButton";
import { DraftsModalButton } from "@/features/attendance/components/DraftsModalButton";
import { DraftCountBadge } from "@/features/attendance/components/DraftCountBadge";

interface SidebarProps {
    logoUrl?: string;
    clinicName?: string;
    isMobile: boolean;
    isDesktopMode: boolean;
    toggleDesktopMode: () => void;
    features?: Record<string, any>;
    slug?: string;
    trialEndsAt?: string;
    currentUser?: any;
}

export function Sidebar(props: SidebarProps) {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const { isMobile } = props;

    // We only show the traditional sidebar on desktop
    if (isMobile && !props.isDesktopMode) return null;

    const { showLoading } = useGlobalLoader();

    return (
        <>
            <div
                data-sidebar="true"
                className={cn(
                    "hidden border-r bg-white md:block fixed left-0 top-0 h-full transition-all duration-300 ease-in-out shrink-0 print:hidden z-[100]",
                    isCollapsed ? "w-[60px]" : "w-[250px]"
                )}
            >
                <SidebarContent {...props} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} showLoading={showLoading} />
            </div>
            {/* Spacer to push content when sidebar is fixed */}
            <div className={cn("hidden md:block shrink-0 transition-all duration-300", isCollapsed ? "w-[60px]" : "w-[250px]")} />
        </>
    );
}

import { usePermissionsContext } from "@/components/providers/permissions-provider";
import { PermissionCode } from "@/lib/rbac";

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
    showLoading,
    currentUser
}: SidebarProps & { isCollapsed?: boolean, setIsCollapsed?: (v: boolean) => void, onNavigate?: () => void, showLoading?: () => void }) {
    const displayName = clinicName || "Minha Clínica";
    const dashboardPrefix = `/dashboard/${slug || ''}`;
    const { hasPermission } = usePermissionsContext();

    // Safety bypass for Master and Administrator
    const userRole = currentUser?.role?.toLowerCase();
    const isMaster = userRole === 'master';
    const isAdmin = userRole === 'administrador' || userRole === 'admin';

    const checkPermission = (code: PermissionCode) => {
        return hasPermission(code);
    };

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
                        className="h-6 w-6 rounded-full shadow-md bg-background sidebar-toggle-btn z-[110]"
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
                {/* ── Ações Rápidas (Destacadas) ── */}
                <div className="flex flex-col gap-1 py-4">
                    <QuickAttendanceButton isCollapsed={isCollapsed} />
                    <DraftsModalButton isCollapsed={isCollapsed} />

                    <ReminderWidget isCollapsed={isCollapsed} />
                </div>

                {!isCollapsed && <div className="mx-6 my-2 border-t border-slate-100" />}

                <nav className={cn("grid items-start px-2 text-base font-medium", isCollapsed ? "justify-center" : "lg:px-4 py-2 gap-1")}>


                    {/* ── Menu principal — alfabético ── */}
                    {[
                        { href: dashboardPrefix, icon: Home, label: "Tela Inicial", perm: 'sidebar.home.view' },
                        { href: `${dashboardPrefix}/schedule`, icon: CalendarIcon, label: "Agenda", perm: 'sidebar.schedule.view', feature: 'agenda_module', id: 'nav-agenda' },
                        { href: `${dashboardPrefix}/auditor`, icon: Microscope, label: "Auditor PBE", perm: 'sidebar.auditor.view' },
                        { href: `${dashboardPrefix}/management`, icon: Settings, label: "Configurações Gerais", perm: 'sidebar.management.view', id: 'nav-management' },
                        { href: `${dashboardPrefix}/products`, icon: ShoppingBag, label: "Estoque", perm: 'sidebar.products.view', feature: 'products_module' },
                        { href: `${dashboardPrefix}/financial?tab=my_statement`, icon: DollarSign, label: "Finanças", perm: 'sidebar.financial.view', feature: 'financial_module' },
                        { href: `${dashboardPrefix}/forms`, icon: ClipboardList, label: "Formulários", perm: 'sidebar.forms.view' },
                        { href: `${dashboardPrefix}/marketing`, icon: Megaphone, label: "Marketing", perm: 'sidebar.marketing.view' },
                        { href: `${dashboardPrefix}/patients`, icon: Users, label: "Pacientes", perm: 'sidebar.patients.view', feature: 'records_module' },
                        { href: `${dashboardPrefix}/settings/communication`, icon: MessageCircle, label: "WhatsApp", perm: 'sidebar.whatsapp.view', feature: 'whatsapp_integration' },
                    ]
                        .sort((a, b) => {
                            if (a.label === "Tela Inicial") return -1;
                            if (b.label === "Tela Inicial") return 1;
                            return a.label.localeCompare(b.label, 'pt-BR');
                        })
                        .map((item: any) => {
                            if (!checkPermission(item.perm)) return null;
                            return (
                                <NavItem
                                    key={item.href}
                                    id={item.id}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    isCollapsed={isCollapsed}
                                    locked={item.feature ? !checkFeature(item.feature) : false}
                                    onClick={onNavigate}
                                    showLoading={showLoading}
                                    badge={item.badge}
                                />
                            );
                        })}
                </nav>

                {/* Trial Display */}
                {!isCollapsed && <TrialDisplay trialEndsAt={trialEndsAt} />}
            </div>
        </div>
    )
}

function NavItem({ id, href, icon: Icon, label, isCollapsed, locked = false, className, onClick, showLoading, badge }: { id?: string, href: string, icon: any, label: string, isCollapsed: boolean, locked?: boolean, className?: string, onClick?: () => void, showLoading?: (msg?: string) => void, badge?: React.ReactNode }) {
    const pathname = usePathname();
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
            id={id}
            href={href}
            onClick={(e) => {
                // Check if the link goes to a different page to avoid stuck loaders
                const isCurrentPath = pathname === href || pathname === href?.split('?')[0];

                if (!href.startsWith('#') && !isCurrentPath) {
                    if (showLoading) {
                        showLoading(`Abrindo ${label}`);
                        // No need for local setTimeout here as GlobalLoaderProvider has a safety one
                    } else {
                        toast.loading(`Abrindo ${label}...`, { id: `nav-${href}` });
                    }
                }

                if (onClick) onClick();
            }}
            className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-zinc-600 transition-all hover:text-zinc-900 hover:bg-zinc-50 active:scale-95 active:brightness-90 w-full font-medium",
                isCollapsed ? "justify-center px-0" : "px-3",
                className
            )}
            title={isCollapsed ? label : undefined}
        >
            <div className="relative">
                <Icon className="h-4 w-4" strokeWidth={2} />
                {isCollapsed && badge && (
                    <div className="absolute -top-2 -right-2">
                        {badge}
                    </div>
                )}
            </div>
            {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">{label}</span>
                    {badge}
                </div>
            )}
        </Link>
    )
}
