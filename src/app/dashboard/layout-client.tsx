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
    Bell
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



import { ReminderWidget } from "@/components/reminders/ReminderWidget"
import { NotificationBell } from "@/components/reminders/NotificationBell"
import { ActiveEvaluationWidget } from "@/features/attendance/components/ActiveEvaluationWidget"

import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ActiveAttendanceProvider, useActiveAttendance } from "@/components/providers/active-attendance-provider" // [NEW]
import { GlobalAttendanceRestorer } from "@/features/attendance/components/GlobalAttendanceRestorer"
import { Sidebar, SidebarContent } from "@/components/dashboard/Sidebar"

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

    const isAccessFisio = viewedSlug?.toLowerCase().includes('access')
    const isImpersonating = isMasterRole && viewedSlug && !isAccessFisio

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
    const dateParam = searchParams.get('date')
    const date = dateParam ? new Date(dateParam + 'T12:00:00') : new Date()

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', newDate.toISOString().split('T')[0])
        router.push(`${pathname}?${params.toString()}`)
    }

    // [NEW] Automatically dismiss navigation toasts when the page changes
    useEffect(() => {
        toast.dismiss();
    }, [pathname]);

    const handleLogout = async () => {
        // Force server-side signout to clear cookies and handle Supabase session
        // Using window.location to ensure full refresh/redirect
        window.location.href = '/auth/signout'
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
                            />
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1 flex justify-end md:justify-start items-center gap-4">
                        <CommandMenu />

                        {/* GLOBAL PROACTIVE TIMER PILL */}
                        {activeAttendanceId && !pathname.includes(`/attendance/${activeAttendanceId}`) && (
                            <Link
                                href={slug ? `/dashboard/${slug}/attendance/${activeAttendanceId}` : `/dashboard/attendance/${activeAttendanceId}`}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-200 shadow-md transition-all animate-in fade-in slide-in-from-top-2"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status === 'in_progress' ? 'bg-amber-400' : 'bg-blue-400'} opacity-40`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                </span>
                                <span className="truncate max-w-[150px]">
                                    {status === 'in_progress' ? 'ATENDENDO' : 'AGUARDANDO'}: {patientName?.toUpperCase() || 'PACIENTE'}
                                </span>
                                <span className="font-mono bg-amber-950/10 px-2 py-0.5 rounded ml-1">{elapsed}</span>
                                <ChevronRight className="w-4 h-4 text-amber-600" />
                            </Link>
                        )}
                    </div>

                    {/* TOP MENUS - Right Side */}
                    <div className="flex items-center gap-2">
                        {/* Removidos os dropdowns de Financeiro e Configurações - agora estão no menu do usuário */}
                    </div>

                    {/* LGPD Log Button - Restricted to Master/Logs View */}
                    {/* {hasPermission('system.view_logs') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsLogOpen(true)}
                            title="Registro de Atividades (LGPD)"
                        >
                            <ScrollText className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    )} */}

                    {/* NOTIFICATION BELL */}
                    <NotificationBell />

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
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                                </div>
                                {currentUser && <span className="mt-1 block text-xs font-normal text-muted-foreground badge">{currentUser.role}</span>}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* MASTER ONLY - Admin Panel */}
                            {currentUser?.role === 'Master' && (
                                <>
                                    <Link href="/admin">
                                        <DropdownMenuItem className="cursor-pointer font-bold bg-zinc-50">
                                            Painel Master (Admin)
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                </>
                            )}

                            {/* FINANCEIRO - Apenas para Master e Administrador */}
                            {(currentUser?.role === 'Master' || currentUser?.role === 'Administrador') && (
                                <>
                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                        Financeiro
                                    </DropdownMenuLabel>
                                    <Link href={`${dashboardPrefix}/financial`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Visão Geral Financeira...")}
                                        >
                                            <LineChart className="h-4 w-4" />
                                            Visão Geral
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/financial/dre`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            DRE (Gerencial)
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/prices`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <Tag className="h-4 w-4" />
                                            Tabela de Preços
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/products`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <ShoppingCart className="h-4 w-4" />
                                            Produtos
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/services`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <Stethoscope className="h-4 w-4" />
                                            Serviços
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                </>
                            )}

                            {/* CONFIGURAÇÕES DA CLÍNICA - Apenas para Master e Administrador */}
                            {(currentUser?.role === 'Master' || currentUser?.role === 'Administrador') && (
                                <>
                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                        Configurações da Clínica
                                    </DropdownMenuLabel>
                                    <Link href={`${dashboardPrefix}/professionals`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Profissionais...")}
                                        >
                                            <BriefcaseMedical className="h-4 w-4" />
                                            Gestão de Profissionais
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/forms`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Formulários...")}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Gestão de Formulários
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/questionnaires`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Questionários...")}
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            Gestão de Questionários
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/locations`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Locais...")}
                                        >
                                            <MapPin className="h-4 w-4" />
                                            Gestão de Locais
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/settings/communication`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo WhatsApp...")}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Comunicação (WhatsApp)
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/settings?tab=reports`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Modelos de Documentos...")}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Documentos e Atestados
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/settings`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Configurações...")}
                                        >
                                            <Settings className="h-4 w-4" />
                                            Configurações do Sistema
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/integrations`}>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => toast.loading("Abrindo Assistente de Migração...")}
                                        >
                                            <Briefcase className="h-4 w-4" />
                                            Assistente de Migração
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                </>
                            )}

                            {/* PERFIL PESSOAL - Para todos */}
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                Meu Perfil
                            </DropdownMenuLabel>
                            <Link href={`${dashboardPrefix}/profile/me`}>
                                <DropdownMenuItem className="cursor-pointer">
                                    Configurações de Perfil
                                </DropdownMenuItem>
                            </Link>
                            <Link href={`${dashboardPrefix}/support`}>
                                <DropdownMenuItem className="cursor-pointer">Suporte</DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => setIsLogoutDialogOpen(true)}>
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Logout Confirmation Dialog */}
                    <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Sair do Sistema</DialogTitle>
                                <DialogDescription>
                                    Tem certeza que deseja sair?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>Cancelar</Button>
                                <Button variant="destructive" onClick={handleLogout}>Sair</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>

                <LogViewer open={isLogOpen} onOpenChange={setIsLogOpen} />
            </div >

        </div >
    )
}
