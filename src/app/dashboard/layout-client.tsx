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
import { ActiveEvaluationWidget } from "@/components/attendance/ActiveEvaluationWidget"

import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ActiveAttendanceProvider, useActiveAttendance } from "@/components/providers/active-attendance-provider" // [NEW]
import { ActiveAttendanceFloat } from "@/components/attendance/ActiveAttendanceFloat"
import { GlobalAttendanceRestorer } from "@/components/attendance/GlobalAttendanceRestorer"
import { Sidebar } from "@/components/dashboard/Sidebar"

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
    // param 'slug' is passed from server layout via props, so we don't need useParams hook here
    const viewedSlug = props.slug
    const { currentUser, userOriginSlug } = props

    const isMasterRole = currentUser?.role === 'master' || currentUser?.role === 'Master'
    // If we have a viewed slug, and it differs from our origin slug, show bar
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
                    {/* <GlobalAttendanceRestorer /> */}
                    {isImpersonating && (
                        <div className="sticky top-0 z-[101] w-full">
                            <ImpersonationBar clinicName={viewedSlug.toUpperCase()} />
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
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
    const { isDesktopMode, toggleDesktopMode } = useContext(DesktopModeContext)

    const isMobile = useMediaQuery("(max-width: 768px)")
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const searchParams = useSearchParams()
    const { activeAttendanceId, patientName, startTime } = useActiveAttendance()
    const [elapsed, setElapsed] = useState("00:00")

    useEffect(() => {
        if (!startTime || !activeAttendanceId) return

        const updateTimer = () => {
            const start = new Date(startTime)
            if (isNaN(start.getTime())) return
            const now = new Date()
            const diff = Math.floor((now.getTime() - start.getTime()) / 1000)

            const hours = Math.floor(diff / 3600)
            const minutes = Math.floor((diff % 3600) / 60)
            const seconds = diff % 60

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
                <header className="sticky top-0 z-[100] relative flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 print:hidden">
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
                        <SheetContent side="left" className="flex flex-col w-[250px] p-0">
                            <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
                                <Link
                                    href={dashboardPrefix}
                                    className="flex items-center gap-2 font-semibold"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {logoUrl ? (
                                        <>
                                            <img src={logoUrl} alt={displayName} className="h-8 w-auto rounded-md" />
                                            <span className="">{displayName}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Package2 className="h-6 w-6" />
                                            <span className="">{displayName}</span>
                                        </>
                                    )}
                                </Link>
                            </div>
                            <div className="flex-1 overflow-y-auto py-4">
                                <nav className="grid gap-2 px-2 text-sm font-medium">
                                    <Link
                                        href={dashboardPrefix}
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Home className="h-5 w-5" />
                                        Tela inicial
                                    </Link>
                                    <Link
                                        href={`${dashboardPrefix}/schedule`}
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <CalendarIcon className="h-5 w-5" />
                                        Agenda
                                    </Link>
                                    <Link
                                        href={`${dashboardPrefix}/patients`}
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Users className="h-5 w-5" />
                                        Pacientes
                                    </Link>
                                    <Link
                                        href={`${dashboardPrefix}/forms`}
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <ClipboardList className="h-5 w-5" />
                                        Formulários
                                    </Link>
                                    <Link
                                        href={`${dashboardPrefix}/settings/scheduling`}
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Settings className="h-5 w-5" />
                                        Configurar Agenda
                                    </Link>
                                    <Link
                                        href={`${dashboardPrefix}/reminders`}
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Bell className="h-5 w-5" />
                                        Lembretes
                                    </Link>

                                    <div className="md:hidden pt-4 mt-4 border-t"></div>
                                    <ReminderWidget className="px-0 mx-[-0.65rem]" iconClassName="h-5 w-5" />
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1 flex justify-end md:justify-start items-center gap-4">
                        <CommandMenu />

                        {/* GLOBAL PROACTIVE TIMER PILL */}
                        {activeAttendanceId && !pathname.includes(`/dashboard/${slug}/attendance/${activeAttendanceId}`) && (
                            <Link
                                href={`${dashboardPrefix}/attendance/${activeAttendanceId}`}
                                className="hidden lg:flex items-center gap-2 px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 rounded-full text-xs font-bold border border-yellow-500 shadow-sm transition-all animate-pulse hover:animate-none"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-700 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-800"></span>
                                </span>
                                <span className="truncate max-w-[120px]">ATENDENDO: {patientName || 'PACIENTE'}</span>
                                <span className="font-mono bg-yellow-950/10 px-1.5 rounded">{elapsed}</span>
                                <ChevronRight className="w-3 h-3" />
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
                                    <Link href={dashboardPrefix}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
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
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <BriefcaseMedical className="h-4 w-4" />
                                            Gestão de Profissionais
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/forms`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <FileText className="h-4 w-4" />
                                            Gestão de Formulários
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/questionnaires`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <ClipboardList className="h-4 w-4" />
                                            Gestão de Questionários
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/locations`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Gestão de Locais
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/settings/communication`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Comunicação (WhatsApp)
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/settings?tab=reports`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <FileText className="h-4 w-4" />
                                            Modelos de Relatório
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/settings`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
                                            <Settings className="h-4 w-4" />
                                            Configurações do Sistema
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`${dashboardPrefix}/integrations`}>
                                        <DropdownMenuItem className="cursor-pointer gap-2">
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
            </div>

        </div>
    )
}
