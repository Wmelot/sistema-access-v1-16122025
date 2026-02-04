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

            <div className="hidden md:inline-flex w-full overflow-x-auto pb-2">
                <TabsList className="bg-muted p-1 rounded-md inline-flex">
                    <TabsTrigger value="overview" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="agenda" className="gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Agenda
                    </TabsTrigger>
                    <TabsTrigger value="insoles" className="gap-2">
                        <Footprints className="h-4 w-4" />
                        Palmilhas
                    </TabsTrigger>
                    <TabsTrigger value="evolutions" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Evoluções
                    </TabsTrigger>
                    <TabsTrigger value="assessments" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Avaliações Físicas
                    </TabsTrigger>
                    <TabsTrigger value="questionnaires" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Questionários
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="attachments" className="gap-2">
                        <Paperclip className="h-4 w-4" />
                        Anexos
                    </TabsTrigger>
                </TabsList>
            </div>

            {children}
        </Tabs>
    )
}
