"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { QuantumLoader } from "@/components/ui/quantum-loader"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { LayoutDashboard, CalendarDays, Footprints, FileText, Activity, ClipboardList, DollarSign, Paperclip } from "lucide-react"

// Map of icons for tabs
const ICONS: Record<string, any> = {
    overview: LayoutDashboard,
    agenda: CalendarDays,
    insoles: Footprints,
    evolutions: FileText,
    assessments: Activity,
    questionnaires: ClipboardList,
    reports: FileText,
    financial: DollarSign,
    attachments: Paperclip
}

const LABELS: Record<string, string> = {
    overview: "Visão Geral",
    agenda: "Agenda",
    insoles: "Palmilhas",
    evolutions: "Evoluções",
    assessments: "Avaliações Físicas",
    questionnaires: "Questionários",
    reports: "Documentos",
    financial: "Financeiro",
    attachments: "Anexos"
}

export function MobileTabSelect({ currentValue }: { currentValue: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const handleValueChange = (value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("tab", value)
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    // Ensure current value is valid
    const validValue = LABELS[currentValue] ? currentValue : "overview"

    return (
        <div className="md:hidden w-full mb-4">
            <Select value={validValue} onValueChange={handleValueChange}>
                <SelectTrigger className="w-full bg-muted/50 h-11">
                    <SelectValue>
                        <div className="flex items-center gap-3">
                            {isPending ? (
                                <QuantumLoader size="14" color="currentColor" className="gap-0" messages={[]} />
                            ) : (
                                ICONS[validValue] && (() => {
                                    const Icon = ICONS[validValue]
                                    return <Icon className="h-4 w-4 opacity-70" />
                                })()
                            )}
                            <span className="font-semibold">{LABELS[validValue]}</span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(LABELS).map(([key, label]) => {
                        const Icon = ICONS[key] || LayoutDashboard
                        return (
                            <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </div>
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
    )
}
