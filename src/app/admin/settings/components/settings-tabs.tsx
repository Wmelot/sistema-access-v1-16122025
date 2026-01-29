'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, CreditCard, Cpu, ScrollText } from "lucide-react"
import { useState } from "react"

interface SettingsTabsProps {
    children: Record<string, React.ReactNode>
}

export function SettingsTabs({ children }: SettingsTabsProps) {
    const [activeTab, setActiveTab] = useState("general")

    const tabs = [
        { value: "general", label: "Geral", icon: Settings },
        { value: "plans", label: "Planos", icon: CreditCard },
        { value: "ai", label: "IA (Gemini)", icon: Cpu },
        { value: "logs", label: "Logs", icon: ScrollText },
    ]

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop Tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-4 lg:w-[600px]">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* Mobile Dropdown */}
            <div className="md:hidden w-full mb-4">
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full bg-white h-11 border-zinc-200">
                        <SelectValue placeholder="Selecione uma aba" />
                    </SelectTrigger>
                    <SelectContent>
                        {tabs.map((tab) => (
                            <SelectItem key={tab.value} value={tab.value}>
                                <div className="flex items-center gap-2 py-1">
                                    <tab.icon className="w-4 h-4 text-zinc-500" />
                                    <span className="font-medium text-zinc-900">{tab.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-6">
                <TabsContent value="general">{children.general}</TabsContent>
                <TabsContent value="plans">{children.plans}</TabsContent>
                <TabsContent value="ai">{children.ai}</TabsContent>
                <TabsContent value="logs">{children.logs}</TabsContent>
            </div>
        </Tabs>
    )
}
