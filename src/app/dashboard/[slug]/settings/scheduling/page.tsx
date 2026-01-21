
import { Metadata } from "next"
import { getProfilesSettings, getSchedulingRules, getFormRequisites } from "./actions"
import { RulesManager } from "./components/RulesManager"
import { OptimizationSettings } from "./components/OptimizationSettings"
import { Separator } from "@/components/ui/separator"
import { CalendarClock, LayoutDashboard } from "lucide-react"

export const metadata: Metadata = {
    title: "Axiom | Agendamento Inteligente",
}

export default async function SmartSchedulingPage() {
    const rules = await getSchedulingRules()
    const profiles = await getProfilesSettings()
    const requisites = await getFormRequisites()

    return (
        <div className="space-y-8 animate-in fade-in active:fade-out duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
                    <CalendarClock className="h-8 w-8 text-primary" />
                    Agendamento Inteligente
                </h2>
                <p className="text-muted-foreground">
                    Configure como o sistema aloca salas e otimiza a ocupação da agenda automaticamente.
                </p>
            </div>

            <Separator />

            {/* Section 1: Room Allocation Rules */}
            <div className="grid gap-4">
                <div className="flex items-center gap-2 mb-2">
                    <LayoutDashboard className="h-5 w-5 text-gray-500" />
                    <h3 className="text-xl font-semibold">Regras de Alocação de Sala</h3>
                </div>
                <RulesManager
                    rules={rules as any}
                    professionals={requisites.professionals}
                    locations={requisites.locations}
                />
            </div>

            <Separator />

            {/* Section 2: Smart Logic */}
            <div className="grid gap-4">
                <div className="flex items-center gap-2 mb-2">
                    <CalendarClock className="h-5 w-5 text-gray-500" />
                    <h3 className="text-xl font-semibold">Otimização de Ocupação</h3>
                </div>
                <OptimizationSettings profiles={profiles as any} />
            </div>
        </div>
    )
}
