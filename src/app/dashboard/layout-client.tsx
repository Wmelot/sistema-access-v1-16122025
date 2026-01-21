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
    ChevronLeft
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
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
}

export default function DashboardLayoutClient(props: DashboardLayoutClientProps) {
    const [isDesktopMode, setIsDesktopMode] = useState(false)
    const toggleDesktopMode = () => setIsDesktopMode(!isDesktopMode)

    return (
        <DesktopModeContext.Provider value={{ isDesktopMode, toggleDesktopMode }}>
            <SidebarProvider>
                <ActiveAttendanceProvider>
                    {/* <GlobalAttendanceRestorer /> */}
                    {/* Widget flutuante removido a pedido do usuário em favor dos marcadores fixos */}
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
    trialEndsAt
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

    // Default to "Access Fisio" if no name provided
    const displayName = clinicName || "Access Fisio"

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
                                    href="/dashboard"
                                    className="flex items-center gap-2 font-semibold"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {logoUrl ? (
                                        <img src={logoUrl} alt={displayName} className="h-8 w-auto" />
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
                                        href="/dashboard"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Home className="h-5 w-5" />
                                        Tela inicial
                                    </Link>
                                    <Link
                                        href="/dashboard/schedule"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <CalendarIcon className="h-5 w-5" />
                                        Agenda
                                    </Link>
                                    <Link
                                        href="/dashboard/patients"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Users className="h-5 w-5" />
                                        Pacientes
                                    </Link>
                                    <Link
                                        href="/dashboard/financial"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <LineChart className="h-5 w-5" />
                                        Financeiro
                                    </Link>
                                    <Link
                                        href="/dashboard/marketing"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Megaphone className="h-5 w-5" />
                                        Campanhas
                                    </Link>
                                    <Link
                                        href="/dashboard/reports"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <FileText className="h-5 w-5" />
                                        Relatórios
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
                        {activeAttendanceId && !pathname.includes(`/dashboard/attendance/${activeAttendanceId}`) && (
                            <Link
                                href={`/dashboard/attendance/${activeAttendanceId}`}
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
                        {/* FINANCEIRO DROPDOWN */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2" onClick={() => console.log('Clicou Financeiro')}>
                                    <LineChart className="h-4 w-4" />
                                    <span className="hidden md:inline">Financeiro</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Financeiro</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href="/dashboard/financial">
                                    <DropdownMenuItem className="cursor-pointer">Visão Geral</DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/financial/dre">
                                    <DropdownMenuItem className="cursor-pointer">DRE (Gerencial)</DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/prices">
                                    <DropdownMenuItem className="cursor-pointer">Tabela de Preços</DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/products">
                                    <DropdownMenuItem className="cursor-pointer">Produtos</DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/services">
                                    <DropdownMenuItem className="cursor-pointer">Serviços</DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* CONFIGURAÇÕES DROPDOWN */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2" onClick={() => console.log('Clicou Configurações')}>
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden md:inline">Configurações Gerais</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Configurações Gerais</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href="/dashboard/professionals">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <BriefcaseMedical className="h-4 w-4" />
                                        Gestão de Profissionais
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/forms">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <FileText className="h-4 w-4" />
                                        Gestao de Formulários
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/questionnaires">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <ClipboardList className="h-4 w-4" />
                                        Gestão de Questionários
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/locations">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Gestão de Locais de Atendimento
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/settings/communication">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Comunicação (WhatsApp)
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/settings?tab=reports">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <FileText className="h-4 w-4" />
                                        Modelos de Relatório
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <Link href="/dashboard/settings">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <Settings className="h-4 w-4" />
                                        Configurações de Sistema
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/integrations">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Assistênte de Migração
                                    </DropdownMenuItem>
                                </Link>

                            </DropdownMenuContent>
                        </DropdownMenu>
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
                            <Button variant="ghost" className="relative h-9 w-9 rounded-md">
                                <Avatar className="h-9 w-9 rounded-md">
                                    <AvatarImage src={currentUser?.avatarUrl || undefined} alt={currentUser?.name || 'User'} />
                                    <AvatarFallback className="rounded-md">{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                                </div>
                                {currentUser && <span className="mt-1 block text-xs font-normal text-muted-foreground badge">{currentUser.role}</span>}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
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
                            <Link href="/dashboard/profile/me">
                                <DropdownMenuItem className="cursor-pointer">
                                    Configurações de Perfil
                                </DropdownMenuItem>
                            </Link>
                            {currentUser?.role === 'Master' && (
                                <Link href="/dashboard/settings">
                                    <DropdownMenuItem className="cursor-pointer">
                                        Configurações do Sistema
                                    </DropdownMenuItem>
                                </Link>
                            )}
                            <Link href="/dashboard/support">
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
