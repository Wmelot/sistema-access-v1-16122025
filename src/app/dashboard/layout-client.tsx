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
    FileText
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
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
    return (
        <SidebarProvider>
            <DashboardLayoutContent {...props} />
        </SidebarProvider>
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

    // ... rest of component using isCollapsed from hook


    // Navigation Hooks
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()

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
                            <NavItem href="/dashboard" icon={Home} label="Tela Inicial" isCollapsed={isCollapsed} />
                            {/* Rename "Pacientes" to "Pacientes" (kept) */}
                            <NavItem href="/dashboard/patients" icon={Users} label="Pacientes" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/schedule" icon={CalendarIcon} label="Agenda" isCollapsed={isCollapsed} />
                            {/* Removed Financial from Sidebar (moved to Top Menu) - Wait, user asked to check layout?
                                Actually, "Financeiro" is better in Top Menu for hybrid layout, but let's keep it here if user didn't ask to remove.
                                Existing code had it.
                            */}
                            {/* <NavItem href="/dashboard/financial" icon={LineChart} label="Financeiro" isCollapsed={isCollapsed} /> */}
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
                        <SheetContent side="left" className="flex flex-col">
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
                                <Link
                                    href="/dashboard"
                                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                >
                                    <Home className="h-5 w-5" />
                                    Dashboard
                                </Link>
                                {/* Mobile menu keeps full labels */}
                            </nav>
                        </SheetContent>
                    </Sheet>


                    <div className="w-full flex-1">
                        <form>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar pacientes..."
                                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                                />
                            </div>
                        </form>
                    </div>

                    {/* TOP MENUS - Right Side */}
                    <div className="flex items-center gap-2">
                        {/* FINANCEIRO DROPDOWN */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2">
                                    <LineChart className="h-4 w-4" />
                                    <span>Financeiro</span>
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
                                    <span>Configurações</span>
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
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={currentUser?.avatarUrl || undefined} alt={currentUser?.name || 'User'} />
                                    <AvatarFallback>{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
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
