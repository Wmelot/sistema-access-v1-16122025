"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
    Calendar,
    CreditCard,
    FileText,
    Home,
    LayoutDashboard,
    Settings,
    User,
    Users,
    Search,
    Plus,
    Loader2,
    Stethoscope
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { getPatients } from "@/actions/patients"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [scope, setScope] = React.useState<{ id: string, label: string, icon: any } | null>(null)
    const [results, setResults] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const router = useRouter()
    const { slug } = useParams() as { slug: string }
    const dashboardPrefix = `/dashboard/${slug || ''}`

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const key = e.key ? e.key.toLowerCase() : '';
            const isK = key === "k"
            const isF = key === "f"

            if ((isK || isF) && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                e.stopPropagation()
                setOpen((open) => !open)
            }
        }

        window.addEventListener("keydown", down, { capture: true })
        return () => window.removeEventListener("keydown", down, { capture: true })
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        setQuery("")
        setScope(null)
        command()
    }, [])

    // Patient Search (Debounced)
    React.useEffect(() => {
        if (query.length < 2) {
            setResults([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        const timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}&slug=${slug || ''}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data || [])
                }
            } catch (error) {
                console.error("Search error:", error)
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query, slug])

    // Filter results by scope if active
    const filteredResults = React.useMemo(() => {
        if (!scope) return results

        switch (scope.id) {
            case 'patients':
                return results.filter(r => r.type === 'patient')
            case 'financial':
                return results.filter(r => r.type === 'financial' || (r.type === 'action' && r.url.includes('financial')))
            case 'forms':
                return results.filter(r => r.type === 'action' && (r.url.includes('forms') || r.url.includes('questionnaire')))
            case 'agenda':
                return results.filter(r => r.type === 'appointment' || (r.type === 'action' && r.url.includes('schedule')))
            case 'users':
                return results.filter(r => r.type === 'professional' || (r.type === 'action' && r.url.includes('settings')))
            default:
                return results
        }
    }, [results, scope])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && query === "" && scope) {
            e.preventDefault()
            setScope(null)
        }
    }

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">Buscar no sistema...</span>
                <span className="inline-flex lg:hidden">Buscar...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>F
                </kbd>
            </Button>
            <CommandDialog
                open={open}
                onOpenChange={(isOpen) => {
                    setOpen(isOpen)
                    if (!isOpen) {
                        setScope(null)
                        setQuery("")
                    }
                }}
                shouldFilter={query.length === 0} // Only filter locally when no server query is active
                className="max-w-2xl overflow-visible p-1" // Added overflow-visible and small padding to avoid clipping
            >
                <div className="flex items-center border-b px-3 bg-slate-50/50 rounded-t-lg">
                    {scope && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-bold animate-in zoom-in-95 duration-200 border border-primary/20 shrink-0">
                            {React.createElement(scope.icon, { className: "h-3 w-3" })}
                            <span>{scope.label}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setScope(null); }}
                                className="hover:text-primary/70 ml-1"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <CommandInput
                        placeholder={scope ? `Buscando em ${scope.label}...` : "Busque por pacientes, ações ou menus (ex: 'Marcia', 'Financeiro')..."}
                        value={query}
                        onValueChange={setQuery}
                        onKeyDown={handleKeyDown}
                        className="border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none h-14"
                    />
                </div>
                <CommandList className="max-h-[min(450px,70vh)]">
                    <CommandEmpty>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="p-8 text-center flex flex-col items-center gap-3">
                                <Search className="h-10 w-10 text-slate-200" />
                                <p className="text-slate-400 font-medium font-inter">Nenhum resultado encontrado para "{query}"</p>
                            </div>
                        )}
                    </CommandEmpty>

                    {/* DEFAULT VIEW (No Query) */}
                    {query.length === 0 && !scope && (
                        <>
                            <CommandGroup heading="Navegação Direta">
                                <CommandItem onSelect={() => runCommand(() => router.push(dashboardPrefix))}>
                                    <Home className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Tela Inicial</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/schedule`))}>
                                    <Calendar className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Agenda</span>
                                </CommandItem>
                                <CommandItem onSelect={() => setScope({ id: 'patients', label: 'Pacientes', icon: Users })}>
                                    <Users className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Pacientes</span>
                                    <CommandShortcut>Escopo</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => setScope({ id: 'financial', label: 'Financeiro', icon: CreditCard })}>
                                    <CreditCard className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Financeiro</span>
                                    <CommandShortcut>Escopo</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => setScope({ id: 'agenda', label: 'Agenda', icon: Calendar })}>
                                    <Calendar className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Agenda</span>
                                    <CommandShortcut>Escopo</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => setScope({ id: 'users', label: 'Equipe', icon: User })}>
                                    <User className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Profissionais</span>
                                    <CommandShortcut>Escopo</CommandShortcut>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/reports`))}>
                                    <FileText className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Relatórios</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/settings`))}>
                                    <Settings className="mr-3 h-4 w-4 text-slate-400" />
                                    <span className="font-medium">Configurações</span>
                                </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Atalhos Úteis">
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/schedule?openDialog=true`))}>
                                    <Plus className="mr-3 h-4 w-4 text-emerald-500" />
                                    <span className="font-medium">Agendar Horário</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/patients/new`))}>
                                    <Plus className="mr-3 h-4 w-4 text-blue-500" />
                                    <span className="font-medium">Cadastrar Paciente</span>
                                </CommandItem>
                            </CommandGroup>
                        </>
                    )}

                    {/* SEARCH RESULTS (Categorized) */}
                    {(query.length > 0 || scope) && (
                        <div className="p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* Actions / Menus */}
                            {filteredResults.filter(r => r.type === 'action').length > 0 && (
                                <CommandGroup heading="Ações e Menus">
                                    {filteredResults.filter(r => r.type === 'action').map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`${item.title} ${item.subtitle} ${query}`} // Incluindo a query no valor para garantir o match
                                            onSelect={() => runCommand(() => router.push(item.url))}
                                        >
                                            <LayoutDashboard className="mr-3 h-4 w-4 text-slate-400" />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-slate-700">{item.title}</span>
                                                {item.subtitle && <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{item.subtitle}</span>}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Patients (Records) */}
                            {filteredResults.filter(r => r.type === 'patient').length > 0 && (
                                <CommandGroup heading="Prontuários Encontrados">
                                    {filteredResults.filter(r => r.type === 'patient').map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`${item.title} ${item.subtitle} ${query}`}
                                            onSelect={() => runCommand(() => router.push(item.url))}
                                        >
                                            <div className="mr-3 h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-800">{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{item.subtitle}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Professionals */}
                            {filteredResults.filter(r => r.type === 'professional').length > 0 && (
                                <CommandGroup heading="Profissionais">
                                    {filteredResults.filter(r => r.type === 'professional').map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`${item.title} ${item.subtitle} ${query}`}
                                            onSelect={() => runCommand(() => router.push(item.url))}
                                        >
                                            <div className="mr-3 h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                                <Stethoscope className="h-5 w-5 text-slate-600" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-800">{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{item.subtitle}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Appointments */}
                            {filteredResults.filter(r => r.type === 'appointment').length > 0 && (
                                <CommandGroup heading="Agendamentos">
                                    {filteredResults.filter(r => r.type === 'appointment').map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`${item.title} ${item.subtitle} ${query}`}
                                            onSelect={() => runCommand(() => router.push(item.url))}
                                        >
                                            <div className="mr-3 h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                                                <Calendar className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-800">{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{item.subtitle}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Financial Results */}
                            {filteredResults.filter(r => r.type === 'financial').length > 0 && (
                                <CommandGroup heading="Registros Financeiros">
                                    {filteredResults.filter(r => r.type === 'financial').map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`${item.title} ${item.subtitle} ${query}`}
                                            onSelect={() => runCommand(() => router.push(item.url))}
                                        >
                                            <div className={cn(
                                                "mr-3 h-9 w-9 rounded-full flex items-center justify-center border shrink-0",
                                                item.meta?.type === 'expense' ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
                                            )}>
                                                <CreditCard className={cn(
                                                    "h-5 w-5",
                                                    item.meta?.type === 'expense' ? "text-rose-600" : "text-emerald-600"
                                                )} />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-800">{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground font-bold tracking-tight">{item.subtitle}</span>
                                            </div>
                                            <CommandShortcut>
                                                {item.meta?.date ? new Date(item.meta.date).toLocaleDateString('pt-BR') : ''}
                                            </CommandShortcut>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </div>
                    )}
                </CommandList>
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t rounded-b-lg text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><kbd className="bg-white border px-1 rounded shadow-sm text-slate-600">⏎</kbd> selecionar</span>
                        <span className="flex items-center gap-1"><kbd className="bg-white border px-1 rounded shadow-sm text-slate-600">↑↓</kbd> navegar</span>
                    </div>
                    {scope && (
                        <span className="flex items-center gap-1 italic">
                            <kbd className="bg-white border px-1 rounded shadow-sm text-slate-600 font-sans">⌫</kbd> limpar filtro
                        </span>
                    )}
                </div>
            </CommandDialog>
        </>
    )
}
