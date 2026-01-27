"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
        <div className="md:hidden w-full mb-4">
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
    )
}
