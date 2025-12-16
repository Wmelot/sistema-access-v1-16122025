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

export default function DashboardLayoutClient({
    children,
    logoUrl,
    clinicName
}: {
    children: React.ReactNode
    logoUrl?: string
    clinicName?: string
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isLogOpen, setIsLogOpen] = useState(false)

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

    // Default to "Access Fisio" if no name provided
    const displayName = clinicName || "Access Fisio"

    return (
        <div className={cn(
            "grid min-h-screen w-full transition-all duration-300 ease-in-out",
            isCollapsed
                ? "md:grid-cols-[60px_1fr] lg:grid-cols-[60px_1fr]"
                : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
        )}>
            <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px]", isCollapsed ? "justify-center px-2" : "px-6")}>
                        <Link href="/" className="flex items-center gap-2 font-semibold overflow-hidden">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={displayName}
                                    className={cn("object-contain", isCollapsed ? "h-8 w-8" : "h-8 w-auto max-w-[150px]")}
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
                        <nav className={cn("grid items-start px-2 text-sm font-medium", isCollapsed ? "justify-center" : "lg:px-4")}>
                            <NavItem href="/dashboard" icon={Home} label="Dashboard" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/schedule" icon={CalendarIcon} label="Agenda" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/patients" icon={Users} label="Pacientes" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/financial" icon={LineChart} label="Financeiro" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/prices" icon={Tag} label="Tabelas de Preço" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/professionals" icon={Briefcase} label="Profissionais" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/services" icon={Stethoscope} label="Serviços" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/products" icon={ShoppingCart} label="Produtos" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/forms" icon={FileText} label="Formulários" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/locations" icon={MapPin} label="Locais" isCollapsed={isCollapsed} />
                            <NavItem href="/dashboard/settings" icon={Settings} label="Configurações" isCollapsed={isCollapsed} />
                        </nav>

                        {/* CONDITIONAL CALENDAR */}
                        {/* Calendar removed from global sidebar (moved to local schedule sidebar) */}
                    </div>
                </div>
            </div>
            <div className="flex flex-col min-h-screen">
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

                    {/* LGPD Log Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsLogOpen(true)}
                        title="Registro de Atividades (LGPD)"
                    >
                        <ScrollText className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Configurações</DropdownMenuItem>
                            <DropdownMenuItem>Suporte</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Sair</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>

                <LogViewer open={isLogOpen} onOpenChange={setIsLogOpen} />
            </div>
        </div>
    )
}

function NavItem({ href, icon: Icon, label, isCollapsed }: { href: string, icon: any, label: string, isCollapsed: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-muted-foreground transition-all hover:text-primary",
                isCollapsed ? "justify-center px-0" : "px-3"
            )}
            title={isCollapsed ? label : undefined}
        >
            <Icon className="h-4 w-4" />
            {!isCollapsed && label}
        </Link>
    )
}
