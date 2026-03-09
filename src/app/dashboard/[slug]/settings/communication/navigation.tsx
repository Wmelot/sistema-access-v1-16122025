"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, History, Settings, Zap } from "lucide-react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { QuantumLoader } from "@/components/ui/quantum-loader"

interface CommunicationNavigationProps {
    defaultTab: string
}

export function CommunicationNavigation({ defaultTab }: CommunicationNavigationProps) {
    const router = useRouter()
    const { slug } = useParams()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [pendingTab, setPendingTab] = useState<string | null>(null)

    const handleTabChange = (value: string) => {
        setPendingTab(value)
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('tab', value)
            router.push(`/dashboard/${slug}/settings/communication?${params.toString()}`)
        })
    }

    const tabs = [
        { value: 'templates', label: 'Modelos de Mensagem', icon: MessageSquare },
        { value: 'campaigns', label: 'Envio em Massa', icon: Zap },
        { value: 'history', label: 'Histórico de Mensagens', icon: History },
        { value: 'whatsapp_config', label: 'Configuração WhatsApp', icon: Settings },
    ]

    const currentTabLabel = tabs.find(t => t.value === defaultTab)?.label || 'Selecionar Aba'

    return (
        <div className="w-full mb-6">
            {/* Mobile Select (Hidden on Desktop) */}
            <div className="md:hidden">
                <Select value={defaultTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full bg-white border-slate-200 h-12 text-lg font-semibold shadow-sm rounded-xl">
                        <SelectValue>
                            <div className="flex items-center gap-3">
                                {isPending ? (
                                    <QuantumLoader size="14" color="currentColor" className="gap-0" messages={[]} />
                                ) : (
                                    (() => {
                                        const Icon = tabs.find(t => t.value === defaultTab)?.icon || MessageSquare
                                        return <Icon className="h-4 w-4 opacity-70" />
                                    })()
                                )}
                                <span className="font-semibold">{currentTabLabel}</span>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" sideOffset={8} className="z-[100]">
                        {tabs.map((tab) => (
                            <SelectItem key={tab.value} value={tab.value} className="py-3 text-base">
                                <div className="flex items-center gap-2">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop TabsList (Hidden on Mobile) */}
            <div className="hidden md:flex items-center">
                <TabsList className="h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg inline-flex gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                     data-[state=active]:text-primary data-[state=active]:shadow-md
                                     hover:text-primary group text-[10px] font-bold uppercase tracking-tight"
                        >
                            {isPending && pendingTab === tab.value ? (
                                <div className="flex items-center justify-center w-3 h-3">
                                    <QuantumLoader size="14" color="currentColor" className="gap-0" messages={[]} />
                                </div>
                            ) : (
                                <tab.icon className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                            )}
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
        </div>
    )
}
