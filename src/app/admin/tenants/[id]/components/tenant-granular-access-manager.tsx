'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toggleFormAccess, toggleProtocolAccess } from "../actions"
import { toast } from "sonner"
import { FileText, ClipboardList, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface GranularAccessProps {
    tenantId: string
    forms: { all: any[], allowedIds: string[] }
    protocols: { all: any[], allowedIds: string[] }
}

export function TenantGranularAccessManager({ tenantId, forms, protocols }: GranularAccessProps) {
    const [allowedForms, setAllowedForms] = useState(forms.allowedIds)
    const [allowedProtocols, setAllowedProtocols] = useState(protocols.allowedIds)
    const [processing, setProcessing] = useState<string | null>(null)
    const [formSearch, setFormSearch] = useState('')
    const [protocolSearch, setProtocolSearch] = useState('')

    const handleFormToggle = async (id: string, checked: boolean) => {
        setProcessing(id)
        try {
            const res = await toggleFormAccess(tenantId, id, checked)
            if (res.success) {
                setAllowedForms(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
                toast.success(checked ? "Acesso concedido." : "Acesso removido.")
            }
        } catch (e) {
            toast.error("Erro ao atualizar acesso.")
        } finally {
            setProcessing(null)
        }
    }

    const handleProtocolToggle = async (id: string, checked: boolean) => {
        setProcessing(id)
        try {
            const res = await toggleProtocolAccess(tenantId, id, checked)
            if (res.success) {
                setAllowedProtocols(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
                toast.success(checked ? "Protocolo liberado." : "Protocolo removido.")
            }
        } catch (e) {
            toast.error("Erro ao atualizar acesso.")
        } finally {
            setProcessing(null)
        }
    }

    const filteredForms = forms.all.filter(f => f.title.toLowerCase().includes(formSearch.toLowerCase()))
    const filteredProtocols = protocols.all.filter(p => p.title.toLowerCase().includes(protocolSearch.toLowerCase()))

    return (
        <Card className="shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-zinc-500" />
                    Acesso Granular de Conteúdo
                </CardTitle>
                <CardDescription>Escolha quais formulários e protocolos esta clínica pode visualizar.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="forms" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12">
                        <TabsTrigger value="forms" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-6">
                            Formulários ({allowedForms.length})
                        </TabsTrigger>
                        <TabsTrigger value="protocols" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-6">
                            Protocolos ({allowedProtocols.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="forms" className="p-4 m-0">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Buscar formulários..."
                                className="pl-9"
                                value={formSearch}
                                onChange={(e) => setFormSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[300px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredForms.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`form-${item.id}`}
                                            checked={allowedForms.includes(item.id)}
                                            onCheckedChange={(c) => handleFormToggle(item.id, !!c)}
                                            disabled={!!processing}
                                        />
                                        <label htmlFor={`form-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-zinc-400" />
                                            {item.title}
                                            {processing === item.id && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="protocols" className="p-4 m-0">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Buscar protocolos..."
                                className="pl-9"
                                value={protocolSearch}
                                onChange={(e) => setProtocolSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[300px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredProtocols.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`protocol-${item.id}`}
                                            checked={allowedProtocols.includes(item.id)}
                                            onCheckedChange={(c) => handleProtocolToggle(item.id, !!c)}
                                            disabled={!!processing}
                                        />
                                        <label htmlFor={`protocol-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <ClipboardList className="h-3.5 w-3.5 text-zinc-400" />
                                            {item.title}
                                            {processing === item.id && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
