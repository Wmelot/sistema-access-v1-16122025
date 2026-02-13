"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, Footprints, FileText, Activity, ClipboardList, DollarSign, Paperclip } from "lucide-react"
import { MobileTabSelect } from "../components/MobileTabSelect"

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

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", value)
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
            {/* Mobile Dropdown Navigation */}
            <MobileTabSelect currentValue={activeTab} />

            <div className="hidden md:block w-full py-2">
                <TabsList className="h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <TabsTrigger
                        value="overview"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <LayoutDashboard className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Visão Geral
                    </TabsTrigger>

                    <TabsTrigger
                        value="agenda"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <CalendarDays className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Agenda
                    </TabsTrigger>

                    <TabsTrigger
                        value="insoles"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <Footprints className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Palmilhas
                    </TabsTrigger>

                    <TabsTrigger
                        value="evolutions"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <FileText className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Evoluções
                    </TabsTrigger>

                    <TabsTrigger
                        value="assessments"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <Activity className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Avaliações
                    </TabsTrigger>

                    <TabsTrigger
                        value="questionnaires"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <ClipboardList className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Questionários
                    </TabsTrigger>

                    <TabsTrigger
                        value="reports"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <FileText className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Documentos
                    </TabsTrigger>

                    <TabsTrigger
                        value="financial"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <DollarSign className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Financeiro
                    </TabsTrigger>

                    <TabsTrigger
                        value="attachments"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                    >
                        <Paperclip className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Anexos
                    </TabsTrigger>
                </TabsList>
            </div>
            {children}
        </Tabs>
    )
}
