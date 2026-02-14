"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, Footprints, FileText, Activity, ClipboardList, DollarSign, Paperclip } from "lucide-react"
import { MobileTabSelect } from "../components/MobileTabSelect"
import { useState, useTransition } from "react"
import { QuantumLoader } from "@/components/ui/quantum-loader"

interface PatientTabsClientProps {
    activeTab: string
    slug: string
    patientId: string
    children: React.ReactNode
}

export function PatientTabsClient({ activeTab, slug, patientId, children }: PatientTabsClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [isPending, startTransition] = useTransition()
    const [pendingTab, setPendingTab] = useState<string | null>(null)

    const handleTabChange = (value: string) => {
        setPendingTab(value)
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("tab", value)
            router.push(`${pathname}?${params.toString()}`, { scroll: false })
        })
    }

    // Tab items definition for cleaner rendering
    const tabItems = [
        { value: "overview", label: "Visão Geral", icon: LayoutDashboard },
        { value: "agenda", label: "Agenda", icon: CalendarDays },
        { value: "insoles", label: "Palmilhas", icon: Footprints },
        { value: "evolutions", label: "Evoluções", icon: FileText },
        { value: "assessments", label: "Avaliações", icon: Activity },
        { value: "questionnaires", label: "Questionários", icon: ClipboardList },
        { value: "reports", label: "Documentos", icon: FileText },
        { value: "financial", label: "Financeiro", icon: DollarSign },
        { value: "attachments", label: "Anexos", icon: Paperclip },
    ]

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
            {/* Mobile Dropdown Navigation */}
            <MobileTabSelect currentValue={activeTab} />

            <div className="hidden md:block w-full py-2">
                <TabsList className="h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    {tabItems.map((item) => {
                        const Icon = item.icon
                        const isLoading = isPending && pendingTab === item.value

                        return (
                            <TabsTrigger
                                key={item.value}
                                value={item.value}
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center w-3 h-3">
                                        <QuantumLoader size="14" color="currentColor" className="gap-0" messages={[]} />
                                    </div>
                                ) : (
                                    <Icon className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                )}
                                {item.label}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>
            </div>
            {children}
        </Tabs>
    )
}
