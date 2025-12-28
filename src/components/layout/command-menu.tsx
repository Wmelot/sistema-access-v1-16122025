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
import { useRouter } from "next/navigation"
import { getPatients } from "@/app/dashboard/patients/actions"

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
    const [patients, setPatients] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    // Patient Search (Debounced)
    React.useEffect(() => {
        if (query.length < 2) {
            setPatients([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        const timeoutId = setTimeout(async () => {
            try {
                // Use API route instead of Server Action for Client Component stability
                const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setPatients(data || [])
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
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Digite um comando ou busque um paciente..."
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

                    {/* Navigation Group (Always show unless searching patients specifically?) 
                        Actually usually creating mixed results is fine. 
                    */}
                    <CommandGroup heading="Navegação">
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                            <Home className="mr-2 h-4 w-4" />
                            <span>Tela Inicial</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/schedule'))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Agenda</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/patients'))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Pacientes</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/financial'))}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Financeiro</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/reports'))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Relatórios</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Ações Rápidas">
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/schedule?openDialog=true'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Novo Agendamento</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/patients?new=true'))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Novo Paciente</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    {/* Patient Results */}
                    {patients.length > 0 && (
                        <CommandGroup heading="Pacientes">
                            {patients.map((patient) => (
                                <CommandItem
                                    key={patient.id}
                                    onSelect={() => runCommand(() => {
                                        // Navigate to schedule with patient pre-selected
                                        const params = new URLSearchParams()
                                        params.set('openDialog', 'true')
                                        params.set('patientId', patient.id)
                                        params.set('patientName', patient.name)
                                        router.push(`/dashboard/schedule?${params.toString()}`)
                                    })}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{patient.name}</span>
                                    <span className="ml-2 text-muted-foreground text-xs">{patient.phone}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
