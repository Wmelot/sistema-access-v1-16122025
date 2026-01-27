"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useParams, useSearchParams } from "next/navigation"

interface CommunicationNavigationProps {
    defaultTab: string
}

export function CommunicationNavigation({ defaultTab }: CommunicationNavigationProps) {
    const router = useRouter()
    const { slug } = useParams()
    const searchParams = useSearchParams()

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        router.push(`/dashboard/${slug}/settings/communication?${params.toString()}`)
    }

    const tabs = [
        { value: 'templates', label: 'Modelos de Mensagem' },
        { value: 'history', label: 'Histórico de Disparos' },
        { value: 'whatsapp_config', label: 'Configuração WhatsApp' },
    ]

    const currentTabLabel = tabs.find(t => t.value === defaultTab)?.label || 'Selecionar Aba'

    return (
        <div className="w-full mb-6">
            {/* Mobile Select (Hidden on Desktop) */}
            <div className="md:hidden">
                <Select value={defaultTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full bg-white border-slate-200 h-12 text-lg font-semibold shadow-sm rounded-xl">
                        <SelectValue placeholder={currentTabLabel} />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" sideOffset={8} className="z-[100]">
                        {tabs.map((tab) => (
                            <SelectItem key={tab.value} value={tab.value} className="py-3 text-base">
                                {tab.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop TabsList (Hidden on Mobile) */}
            <div className="hidden md:flex items-center">
                <TabsList className="bg-slate-100/50 p-1 rounded-lg">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className="px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
        </div>
    )
}
