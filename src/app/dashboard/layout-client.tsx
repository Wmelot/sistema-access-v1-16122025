"use client"

import Link from "next/link"
import {
    Calendar as CalendarIcon,
    CircleUser,
    Home,
    LineChart,
    Menu,
    Package2,
    Search,
    ShoppingCart,
    Users,
    MapPin,
    Stethoscope,
    ChevronLeft,
    ChevronRight,
    Tag,
    ScrollText,
    Briefcase,
    Settings,
    FileText,
    Monitor,
    MonitorOff,
    Loader2, // [NEW]
    Plus     // [NEW]
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { getPatients } from "@/app/dashboard/patients/actions" // [NEW]
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
import { usePermissions } from "@/hooks/use-permissions"
import { PermissionCode } from "@/lib/rbac"
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

import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar"
import { useMediaQuery } from "@/hooks/use-media-query"

// Desktop Mode Context
const DesktopModeContext = createContext<{
    isDesktopMode: boolean,
    toggleDesktopMode: () => void
}>({
    isDesktopMode: false,
    toggleDesktopMode: () => { }
})


// ... imports

interface DashboardLayoutClientProps {
    children: React.ReactNode
    logoUrl?: string
    clinicName?: string
    currentUser?: {
        id: string,
        role: string,
        avatarUrl?: string | null,
        email?: string,
        name?: string
    } | null
}

export default function DashboardLayoutClient(props: DashboardLayoutClientProps) {
    const [isDesktopMode, setIsDesktopMode] = useState(false)
    const toggleDesktopMode = () => setIsDesktopMode(!isDesktopMode)

    return (
        <DesktopModeContext.Provider value={{ isDesktopMode, toggleDesktopMode }}>
            <SidebarProvider>
                <DashboardLayoutContent {...props} />
            </SidebarProvider>
        </DesktopModeContext.Provider>
    )
}

function DashboardLayoutContent({
    children,
    logoUrl,
    clinicName,
    currentUser }: DashboardLayoutClientProps) {
    const { isCollapsed, setIsCollapsed, toggleSidebar } = useSidebar()
    const [isLogOpen, setIsLogOpen] = useState(false)
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
    const { hasPermission } = usePermissions()
    const { isDesktopMode, toggleDesktopMode } = useContext(DesktopModeContext)

    // Mobile Detection & Redirect
    const isMobile = useMediaQuery("(max-width: 768px)")
    const router = useRouter()
    const pathname = usePathname()

    // Redirect to Schedule on Mobile Load if not already there or in legacy page
    const [hasRedirected, setHasRedirected] = useState(false)

    // Logic: If on mobile, NOT in desktop mode, and trying to access generic dashboard -> go to schedule
    // if (isMobile && !isDesktopMode && !hasRedirected && pathname === '/dashboard') {
    //     setHasRedirected(true) // prevent loop
    //     router.replace('/dashboard/schedule')
    // }

    // ... rest of component using isCollapsed from hook


    // Navigation Hooks (Already declared above)
    const searchParams = useSearchParams()

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
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Default to "Access Fisio" if no name provided
    const displayName = clinicName || "Access Fisio"

    // Logic for "Configurações" link in User Menu
    const settingsLink = currentUser?.role === 'Master'
        ? '/dashboard/settings'
        : (currentUser?.id ? `/dashboard/professionals/${currentUser.id}` : '#')

    // [NEW] Global Header Search Logic
    const [headerSearchTerm, setHeaderSearchTerm] = useState("")
    const [headerSearchResults, setHeaderSearchResults] = useState<any[]>([])
    const [isSearchingHeader, setIsSearchingHeader] = useState(false)
    const [openHeaderSearch, setOpenHeaderSearch] = useState(false)
    // [NEW] Mobile Search Expansion State
    const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false)

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (headerSearchTerm.length >= 2) {
                setIsSearchingHeader(true)
                const results = await getPatients({ query: headerSearchTerm })
                setHeaderSearchResults(results)
                setIsSearchingHeader(false)
                setOpenHeaderSearch(true)
            } else {
                setHeaderSearchResults([])
                setOpenHeaderSearch(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [headerSearchTerm])

    const handleHeaderSearchSelect = (patient: any) => {
        setOpenHeaderSearch(false)
        setMobileSearchExpanded(false) // Collapse on select
        setHeaderSearchTerm("")
        // Navigate to Schedule and trigger dialog
        // We use query params that ScheduleClient will pick up
        const params = new URLSearchParams()
        params.set('openDialog', 'true')
        params.set('patientId', patient.id)
        params.set('patientName', patient.name) // Optional helper
        // Preserve existing date if any (optional, but good UX)
        if (dateParam) params.set('date', dateParam)

        router.push(`/dashboard/schedule?${params.toString()}`)
    }

    return (
        <div className="flex bg-background min-h-screen w-full">
            <div
                className={cn(
                    "hidden border-r bg-muted/40 md:block sticky top-0 h-screen transition-all duration-300 ease-in-out shrink-0",
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
                            <NavItem href="/dashboard/reports" icon={LineChart} label="Relatórios" isCollapsed={isCollapsed} />

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
                    </div>
                </div>
            </div>
            <div className="flex flex-col min-h-screen flex-1 min-w-0 overflow-x-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
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
                        <SheetContent side="left" className="flex flex-col w-[220px]">
                            <nav className="grid gap-2 text-lg font-medium">
                                <Link
                                    href="#"
                                    className="flex items-center gap-2 text-lg font-semibold"
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
                                <SheetClose asChild>
                                    <Link
                                        href="/dashboard"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <Home className="h-5 w-5" />
                                        Tela inicial
                                    </Link>
                                </SheetClose>
                                {/* Mobile menu keeps full labels */}
                                <SheetClose asChild>
                                    <Link
                                        href="/dashboard/schedule"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <CalendarIcon className="h-5 w-5" />
                                        Agenda
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link
                                        href="/dashboard/patients"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <Users className="h-5 w-5" />
                                        Pacientes
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link
                                        href="/dashboard/reports"
                                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <LineChart className="h-5 w-5" />
                                        Relatórios
                                    </Link>
                                </SheetClose>
                                <div className="md:hidden">
                                    <ReminderWidget className="px-0 mx-[-0.65rem]" iconClassName="h-5 w-5" />
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>


                    <div className="w-full flex-1">
                        <div
                            className={cn(
                                "transition-all duration-200 ease-in-out",
                                mobileSearchExpanded
                                    ? "absolute left-0 top-0 w-full h-[60px] bg-background z-[50] flex items-center px-4 shadow-md"
                                    : "relative w-full md:w-2/3 lg:w-1/3"
                            )}
                        >
                            {/* Back Button (Only visible when expanded) */}
                            {mobileSearchExpanded && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 shrink-0 md:hidden"
                                    onClick={() => setMobileSearchExpanded(false)}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                            )}

                            <Search
                                className={cn(
                                    "absolute top-2.5 h-4 w-4 text-muted-foreground transition-all",
                                    mobileSearchExpanded ? "left-12 opacity-0 md:opacity-100 md:left-2.5" : "left-2.5"
                                )}
                            />
                            <Input
                                placeholder={mobileSearchExpanded ? "Buscar paciente..." : "Buscar pacientes (Banco Global)..."}
                                className={cn(
                                    "h-9 bg-background shadow-none transition-all",
                                    mobileSearchExpanded ? "pl-2 w-full" : "pl-8"
                                )}
                                value={headerSearchTerm}
                                onChange={(e) => {
                                    setHeaderSearchTerm(e.target.value)
                                    if (e.target.value.length > 0) setOpenHeaderSearch(true)
                                }}
                                onFocus={() => {
                                    if (isMobile) setMobileSearchExpanded(true)
                                    if (headerSearchTerm.length >= 2) setOpenHeaderSearch(true)
                                }}
                            // Removed onBlur to match requested behavior (user clicks manually or selects)
                            />
                            {isSearchingHeader && (
                                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                            )}

                            {/* Header Search Results Dropdown */}
                            {openHeaderSearch && headerSearchResults.length > 0 && (
                                <div className={cn(
                                    "absolute bg-white border rounded-md shadow-lg max-h-[300px] overflow-y-auto p-1 z-[100] animate-in fade-in zoom-in-95 duration-100",
                                    mobileSearchExpanded
                                        ? "top-[60px] left-0 right-0 w-full rounded-none border-x-0 border-t bg-background"
                                        : "top-[calc(100%+4px)] left-0 right-0"
                                )}>
                                    {headerSearchResults.map(patient => (
                                        <div
                                            key={patient.id}
                                            className="w-full px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-0 border-slate-100 flex items-center justify-between group transition-colors"
                                        >
                                            {/* Name -> Go to Profile */}
                                            <Link
                                                href={`/dashboard/patients/${patient.id}`}
                                                className="flex-1 flex flex-col cursor-pointer"
                                                onClick={() => {
                                                    setOpenHeaderSearch(false)
                                                    setMobileSearchExpanded(false)
                                                    setHeaderSearchTerm("")
                                                }}
                                            >
                                                <span className="font-medium text-slate-700">{patient.name}</span>
                                                <span className="text-xs text-muted-foreground">{patient.phone}</span>
                                            </Link>

                                            {/* Plus -> New Appointment */}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 ml-2 text-blue-600 opacity-60 hover:opacity-100 hover:bg-blue-50"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleHeaderSearchSelect(patient)
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {openHeaderSearch && headerSearchTerm.length >= 2 && headerSearchResults.length === 0 && !isSearchingHeader && (
                                <div className={cn(
                                    "absolute bg-white border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground z-50",
                                    mobileSearchExpanded
                                        ? "top-[60px] left-0 right-0 w-full rounded-none border-x-0 border-t bg-background"
                                        : "top-[calc(100%+4px)] left-0 right-0"
                                )}>
                                    Nenhum paciente encontrado.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TOP MENUS - Right Side */}
                    <div className="flex items-center gap-2">
                        {/* FINANCEIRO DROPDOWN */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2">
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
                                <Button variant="ghost" className="gap-2">
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden md:inline">Configurações</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href="/dashboard/professionals">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Gestão de Equipe
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/forms">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <FileText className="h-4 w-4" />
                                        Formulários
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/dashboard/locations">
                                    <DropdownMenuItem className="cursor-pointer gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Locais de Atendimento
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
                                        Integrações (Migração)
                                    </DropdownMenuItem>
                                </Link>

                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* LGPD Log Button - Restricted to Master/Logs View */}
                    {hasPermission('system.view_logs') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsLogOpen(true)}
                            title="Registro de Atividades (LGPD)"
                        >
                            <ScrollText className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    )}

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
                            <Link href={`/dashboard/professionals/${currentUser?.id}`}>
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
            </div >

        </div >
    )
}

function NavItem({ href, icon: Icon, label, isCollapsed }: { href: string, icon: any, label: string, isCollapsed: boolean }) {
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
