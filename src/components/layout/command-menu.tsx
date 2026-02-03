"use client"

import * as React from "react"
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
    Loader2
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
                // Use capture phase and stopPropagation to prevent Safari/others from hijacking Cmd+F
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
                // Use API route instead of Server Action for Client Component stability
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
    }, [query])

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
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Busque por pacientes, ações ou menus (ex: 'Marcia', 'Financeiro')..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            "Nenhum resultado encontrado."
                        )}
                    </CommandEmpty>

                    {/* DEFAULT VIEW (No Query) */}
                    {query.length === 0 && (
                        <>
                            <CommandGroup heading="Navegação">
                                <CommandItem onSelect={() => runCommand(() => router.push(dashboardPrefix))}>
                                    <Home className="mr-2 h-4 w-4" />
                                    <span>Tela Inicial</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/schedule`))}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Agenda</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/patients`))}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Pacientes</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/financial`))}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Financeiro</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/reports`))}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Relatórios</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/settings`))}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configurações</span>
                                </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Ações Rápidas">
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/schedule?openDialog=true`))}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Novo Agendamento</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push(`${dashboardPrefix}/patients?new=true`))}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Novo Paciente</span>
                                </CommandItem>
                            </CommandGroup>
                        </>
                    )}

                    {/* SEARCH RESULTS (Categorized) */}
                    {query.length > 0 && (
                        <>
                            {/* Actions / Menus */}
                            {results.filter(r => r.type === 'action').length > 0 && (
                                <CommandGroup heading="Ações e Menus">
                                    {results.filter(r => r.type === 'action').map((item) => (
                                        <CommandItem key={item.id} onSelect={() => runCommand(() => router.push(item.url))}>
                                            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span>{item.title}</span>
                                                {item.subtitle && <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Patients (Records) */}
                            {results.filter(r => r.type === 'patient').length > 0 && (
                                <CommandGroup heading="Prontuários">
                                    {results.filter(r => r.type === 'patient').map((item) => (
                                        <CommandItem key={item.id} onSelect={() => runCommand(() => router.push(item.url))}>
                                            <User className="mr-2 h-4 w-4 text-blue-500" />
                                            <div className="flex flex-col">
                                                <span>{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Schedule Shortcuts */}
                            {results.filter(r => r.type === 'schedule').length > 0 && (
                                <CommandGroup heading="Agendamento Rápido">
                                    {results.filter(r => r.type === 'schedule').map((item) => (
                                        <CommandItem key={item.id} onSelect={() => runCommand(() => router.push(item.url))}>
                                            <Calendar className="mr-2 h-4 w-4 text-green-500" />
                                            <div className="flex flex-col">
                                                <span>{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Financial Shortcuts */}
                            {results.filter(r => r.type === 'financial').length > 0 && (
                                <CommandGroup heading="Financeiro">
                                    {results.filter(r => r.type === 'financial').map((item) => (
                                        <CommandItem key={item.id} onSelect={() => runCommand(() => router.push(item.url))}>
                                            <CreditCard className="mr-2 h-4 w-4 text-orange-500" />
                                            <div className="flex flex-col">
                                                <span>{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
