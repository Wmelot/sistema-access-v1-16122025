"use client"

import Link from "next/link"
import {
    Calendar as CalendarIcon,
    CircleUser,
    Home,
    LineChart,
    Menu,
    Megaphone,
    Package2,
    Search,
    ShoppingCart,
    Users,
    MapPin,
    Stethoscope,
    Tag,
    ScrollText,
    Briefcase,
    Settings,
    FileText,
    Loader2,
    Plus,
    MessageSquare,
    RefreshCw,
    ClipboardList,
    DollarSign,
    BriefcaseMedical,
    ChevronRight,
    ChevronLeft,
    Bell,
    Shield
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { usePathname, useSearchParams, useRouter, useParams } from "next/navigation"
import { CommandMenu } from "@/components/layout/command-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useState, useContext, useEffect, createContext } from "react"
import { cn } from "@/lib/utils"
import { LogViewer } from "@/components/logs/LogViewer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"


import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import Swal from 'sweetalert2'



import { ReminderWidget } from "@/components/reminders/ReminderWidget"
import { NotificationBell } from "@/components/reminders/NotificationBell"
import { ActiveEvaluationWidget } from "@/features/attendance/components/ActiveEvaluationWidget"

import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ActiveAttendanceProvider, useActiveAttendance } from "@/components/providers/active-attendance-provider" // [NEW]
import { GlobalAttendanceRestorer } from "@/features/attendance/components/GlobalAttendanceRestorer"
import { Sidebar, SidebarContent } from "@/components/dashboard/Sidebar"
import { useGlobalLoader } from "@/components/providers/global-loader-provider"
import { WhatsappStatusAlert } from "@/components/dashboard/WhatsappStatusAlert"

// Desktop Mode Context
const DesktopModeContext = createContext<{
    isDesktopMode: boolean,
    toggleDesktopMode: () => void
}>({
    isDesktopMode: false,
    toggleDesktopMode: () => { }
})

import { ImpersonationBar } from "@/components/admin/impersonation-bar"; // Import added

interface DashboardLayoutClientProps {
    children: React.ReactNode
    logoUrl?: string
    clinicName?: string
    currentUser?: {
        id: string,
        role: string,
        avatarUrl?: string | null,
        email?: string,
        name?: string,
        organizationId?: string | null
    } | null
    features?: Record<string, any>
    trialEndsAt?: string
    slug?: string
    userOriginSlug?: string // [NEW]
}

export default function DashboardLayoutClient(props: DashboardLayoutClientProps) {
    const [isDesktopMode, setIsDesktopMode] = useState(false)
    const toggleDesktopMode = () => setIsDesktopMode(!isDesktopMode)

    // [NEW] Impersonation Logic Client-Side
    const viewedSlug = props.slug
    const { currentUser, userOriginSlug } = props

    const isMasterRole = currentUser?.role === 'master' || currentUser?.role === 'Master'
    const isImpersonating = isMasterRole && viewedSlug && userOriginSlug && viewedSlug !== userOriginSlug

    // DEBUG LOGS (Remove later)
    useEffect(() => {
        if (isMasterRole) {
            console.log("IMPERSONATION DEBUG:", {
                isMasterRole,
                viewedSlug,
                userOriginSlug,
                isImpersonating,
                idsMatch: viewedSlug === userOriginSlug
            })
        }
    }, [isMasterRole, viewedSlug, userOriginSlug, isImpersonating])

    return (
        <DesktopModeContext.Provider value={{ isDesktopMode, toggleDesktopMode }}>
            <SidebarProvider>
                <ActiveAttendanceProvider>
                    <GlobalAttendanceRestorer />
                    {isImpersonating && (
                        <div className="sticky top-0 z-40 w-full">
                            <ImpersonationBar
                                clinicName={props.clinicName || (typeof viewedSlug === 'string' ? viewedSlug.toUpperCase() : 'DESCONHECIDA')}
                                isOriginClinic={viewedSlug === userOriginSlug}
                            />
                        </div>
                    )}
                    <DashboardLayoutContent {...props} />
                </ActiveAttendanceProvider>
            </SidebarProvider>
        </DesktopModeContext.Provider>
    )
}

function DashboardLayoutContent({
    children,
    logoUrl,
    clinicName,
    currentUser,
    features,
    trialEndsAt,
    slug
}: DashboardLayoutClientProps) {
    const [isLogOpen, setIsLogOpen] = useState(false)

    // Listen for custom event to open logs from other components
    useEffect(() => {
        const handleOpenLogs = () => setIsLogOpen(true)
        window.addEventListener('open-lgpd-logs', handleOpenLogs)
        return () => window.removeEventListener('open-lgpd-logs', handleOpenLogs)
    }, [])
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
    const { isDesktopMode, toggleDesktopMode } = useContext(DesktopModeContext)

    const isMobile = useMediaQuery("(max-width: 768px)")
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const searchParams = useSearchParams()
    const { activeAttendanceId, patientName, startTime, status } = useActiveAttendance()
    const [elapsed, setElapsed] = useState("00:00")
    const { showLoading } = useGlobalLoader()

    useEffect(() => {
        if (!startTime || !activeAttendanceId) return

        const updateTimer = () => {
            const start = new Date(startTime)
            if (isNaN(start.getTime())) return
            const now = new Date()
            const diff = now.getTime() - start.getTime()

            // [FIX] Prevent negative countdowns by clamping to 0
            const safeDiff = diff > 0 ? diff : 0

            const hours = Math.floor(safeDiff / 3600000)
            const minutes = Math.floor((safeDiff % 3600000) / 60000)
            const seconds = Math.floor((safeDiff % 60000) / 1000)

            const fmt = (n: number) => n.toString().padStart(2, '0')
            setElapsed(`${hours > 0 ? fmt(hours) + ':' : ''}${fmt(minutes)}:${fmt(seconds)}`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [startTime, activeAttendanceId])

    // Date Sync Logic
    const dateParam = searchParams?.get('date')
    const date = dateParam ? new Date(dateParam + 'T12:00:00') : new Date()

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return
        const params = new URLSearchParams(searchParams?.toString() || "")
        params.set('date', newDate.toISOString().split('T')[0])
        router.push(`${pathname}?${params.toString()}`)
    }

    // [NEW] Automatically dismiss navigation toasts when the page changes
    useEffect(() => {
        toast.dismiss();
    }, [pathname]);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Sair do Sistema',
            text: 'Tem certeza que deseja encerrar sua sessão?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, Sair!',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        })

        if (result.isConfirmed) {
            showLoading("ENCERRANDO SESSÃO...")
            window.location.href = '/auth/signout'
        }
    }

    // Default to "Minha Clínica" if no name provided to avoid showing Access everywhere
    const displayName = clinicName || "Minha Clínica"
    const dashboardPrefix = `/dashboard/${slug || ''}`

    return (
        <div className="flex bg-background min-h-screen w-full">
            <Sidebar
                logoUrl={logoUrl}
                clinicName={clinicName}
                isMobile={isMobile}
                isDesktopMode={isDesktopMode}
                toggleDesktopMode={toggleDesktopMode}
                features={features}
                trialEndsAt={trialEndsAt}
                slug={slug}
            />

            <div className="flex flex-col min-h-screen flex-1 min-w-0 print:block print:w-full">
                <header className="sticky top-0 z-30 relative flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 print:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[280px]">
                            <SidebarContent
                                logoUrl={logoUrl}
                                clinicName={clinicName}
                                isMobile={isMobile}
                                isDesktopMode={isDesktopMode}
                                toggleDesktopMode={toggleDesktopMode}
                                features={features}
                                trialEndsAt={trialEndsAt}
                                slug={slug}
                                onNavigate={() => setIsMobileMenuOpen(false)}
                                showLoading={showLoading}
                            />
                        </SheetContent>
                    </Sheet>

                    {/* NOTIFICATION BELL (Mobile Left / Desktop Right logic could be applied, but user said 'move to left') */}
                    {/* User requested shifting reminder icon to left side. We place it here. */}
                    <div className="md:hidden">
                        <NotificationBell />
                    </div>

                    <div className="flex-1 flex justify-center md:justify-start items-center gap-4">
                        <div className="hidden md:block">
                            <CommandMenu />
                        </div>

                        {/* GLOBAL PROACTIVE TIMER PILL */}
                        {activeAttendanceId && !pathname.includes(`/attendance/${activeAttendanceId}`) && (
                            <Link
                                href={slug ? `/dashboard/${slug}/attendance/${activeAttendanceId}` : `/dashboard/attendance/${activeAttendanceId}`}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-200 shadow-md transition-all animate-in fade-in slide-in-from-top-2",
                                    "md:relative md:left-0",
                                    "fixed left-1/2 -translate-x-1/2 md:translate-x-0" // Center on mobile
                                )}
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status === 'in_progress' ? 'bg-amber-400' : 'bg-blue-400'} opacity-40`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                </span>
                                <span className="truncate max-w-[120px] sm:max-w-[150px]">
                                    {/* MOBILE: Just RETOMAR */}
                                    <span className="md:hidden font-black">RETOMAR</span>
                                    {/* DESKTOP: Complete Info */}
                                    <span className="hidden md:inline">
                                        {status === 'in_progress' ? 'ATENDENDO' : 'AGUARDANDO'}: {patientName?.toUpperCase() || 'PACIENTE'}
                                    </span>
                                </span>
                                <span className="font-mono bg-amber-950/10 px-2 py-0.5 rounded ml-1">{elapsed}</span>
                                <ChevronRight className="w-4 h-4 text-amber-600 hidden md:block" />
                            </Link>
                        )}
                    </div>

                    {/* TOP MENUS - Right Side */}
                    <div className="flex items-center gap-2">
                        <div className="hidden md:block">
                            <NotificationBell />
                        </div>
                        {/* Removidos os dropdowns de Financeiro e Configurações - agora estão no menu do usuário */}
                    </div>

                    {/* LGPD Activity Log - Master/Admin only */}
                    {(currentUser?.role === 'Master' || currentUser?.role === 'Administrador') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsLogOpen(true)}
                            title="Log de Atividades (LGPD)"
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ScrollText className="h-5 w-5" />
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2">
                                <span className="hidden md:block text-sm font-medium">{currentUser?.name || 'Usuário'}</span>
                                <Avatar className="h-8 w-8 rounded-md">
                                    <AvatarImage src={currentUser?.avatarUrl || undefined} alt={currentUser?.name || 'User'} />
                                    <AvatarFallback className="rounded-md">{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2">
                            <DropdownMenuLabel className="mb-2">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">{currentUser?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* FINANCEIRO GERAL */}
                            {(currentUser?.role === 'Master' || currentUser?.role === 'Administrador') && (
                                <Link href={`${dashboardPrefix}/financial`}>
                                    <DropdownMenuItem
                                        className="cursor-pointer gap-2 py-2.5"
                                        onClick={() => {
                                            const target = `${dashboardPrefix}/financial`;
                                            if (pathname !== target) showLoading("ABRINDO FINANCEIRO...");
                                        }}
                                    >
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                        <span className="font-medium">Financeiro geral</span>
                                    </DropdownMenuItem>
                                </Link>
                            )}

                            {/* CONFIGURAÇÕES GERAIS */}
                            {(currentUser?.role === 'Master' || currentUser?.role === 'Administrador') && (
                                <Link href={`${dashboardPrefix}/management`}>
                                    <DropdownMenuItem
                                        className="cursor-pointer gap-2 py-2.5"
                                        onClick={() => {
                                            const target = `${dashboardPrefix}/management`;
                                            if (pathname !== target) showLoading("ABRINDO CONFIGURAÇÕES...");
                                        }}
                                    >
                                        <Settings className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium">Configurações gerais</span>
                                    </DropdownMenuItem>
                                </Link>
                            )}

                            {/* CONFIGURAÇÕES DE PERFIL */}
                            <Link href={`${dashboardPrefix}/profile/me`}>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 py-2.5"
                                    onClick={() => {
                                        const target = `${dashboardPrefix}/profile/me`;
                                        if (pathname !== target) showLoading("ABRINDO PERFIL...");
                                    }}
                                >
                                    <CircleUser className="h-4 w-4 text-zinc-600" />
                                    <span className="font-medium">Configurações de perfil</span>
                                </DropdownMenuItem>
                            </Link>

                            {/* PAINEL MASTER - Somente wmelot@gmail.com */}
                            {currentUser?.email === 'wmelot@gmail.com' && (
                                <Link href="/admin">
                                    <DropdownMenuItem
                                        className="cursor-pointer gap-2 py-2.5 text-indigo-700 font-bold bg-indigo-50/50"
                                        onClick={() => {
                                            if (pathname !== '/admin') showLoading("ACESSANDO PAINEL MASTER...");
                                        }}
                                    >
                                        <Shield className="h-4 w-4" />
                                        Painel Master
                                    </DropdownMenuItem>
                                </Link>
                            )}

                            {/* SUPORTE */}
                            <Link href={`${dashboardPrefix}/support`}>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 py-2.5"
                                    onClick={() => {
                                        const target = `${dashboardPrefix}/support`;
                                        if (pathname !== target) showLoading("ABRINDO SUPORTE...");
                                    }}
                                >
                                    <MessageSquare className="h-4 w-4 text-orange-600" />
                                    <span className="font-medium">Suporte</span>
                                </DropdownMenuItem>
                            </Link>

                            <DropdownMenuSeparator className="my-2" />

                            {/* SAIR */}
                            <DropdownMenuItem
                                className="cursor-pointer gap-2 py-2.5 text-destructive focus:text-destructive font-bold"
                                onClick={handleLogout}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {slug && (
                        <WhatsappStatusAlert
                            slug={slug}
                            role={currentUser?.role}
                        />
                    )}
                    {children}
                </main>

                <LogViewer open={isLogOpen} onOpenChange={setIsLogOpen} />
            </div >

        </div >
    )
}
