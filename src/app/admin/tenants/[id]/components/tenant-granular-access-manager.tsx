'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toggleFormAccess, toggleProtocolAccess, toggleMessageTemplateAccess } from "../actions"
import { toast } from "sonner"
import { FileText, ClipboardList, Loader2, Search, MessageSquare, CheckSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface GranularAccessProps {
    tenantId: string
    forms: { all: any[], allowedIds: string[] }
    protocols: { all: any[], allowedIds: string[] }
    messageTemplates?: { all: any[], allowedIds: string[] }
}

export function TenantGranularAccessManager({ tenantId, forms, protocols, messageTemplates = { all: [], allowedIds: [] } }: GranularAccessProps) {
    const [allowedForms, setAllowedForms] = useState(forms.allowedIds)
    const [allowedProtocols, setAllowedProtocols] = useState(protocols.allowedIds)
    const [allowedMessages, setAllowedMessages] = useState(messageTemplates.allowedIds)
    const [processing, setProcessing] = useState<string | null>(null)
    const [formSearch, setFormSearch] = useState('')
    const [questionnaireSearch, setQuestionnaireSearch] = useState('')
    const [protocolSearch, setProtocolSearch] = useState('')
    const [messageSearch, setMessageSearch] = useState('')

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

    const handleMessageToggle = async (id: string, checked: boolean) => {
        setProcessing(id)
        try {
            const res = await toggleMessageTemplateAccess(tenantId, id, checked)
            if (res.success) {
                setAllowedMessages(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
                toast.success(checked ? "Modelo de mensagem ativado." : "Modelo de mensagem desativado.")
            }
        } catch (e) {
            toast.error("Erro ao atualizar acesso.")
        } finally {
            setProcessing(null)
        }
    }

    // Consolidated categorization logic
    const categorizedForms = forms.all.map(f => {
        const title = f.title?.toLowerCase() || ''

        // 1. Questionnaires (Standardized Instruments / Follow-ups)
        const isStandardScale =
            title.includes('aofas') ||
            title.includes('prwe') ||
            title.includes('dash') ||
            title.includes('quickdash') ||
            title.includes('koos') ||
            title.includes('hoos') ||
            title.includes('odi') ||
            title.includes('ndi') ||
            title.includes('oswestry') ||
            title.includes('roland-morris') ||
            title.includes('roland morris') ||
            title.includes('womac') ||
            title.includes('lefs') ||
            title.includes('spadi') ||
            title.includes('tampa') ||
            title.includes('quebec') ||
            title.includes('mcgill') ||
            title.includes('mnsi') ||
            title.includes('iciq') ||
            title.includes('udi') ||
            title.includes('faam') ||
            title.includes('faos') ||
            title.includes('i-hot') ||
            title.includes('ihot') ||
            title.includes('start back') ||
            title.includes('stark');

        const isStandardFollowup = title.includes('acompanhamento') || title.includes('manutenção') || f.type === 'followup';

        const isQuestionnaire = isStandardScale || (f.is_locked && (f.type === 'questionnaire' || isStandardFollowup));

        // 2. Clinical Tools (Stay in Formulários)
        const isClinicalTool =
            title.includes('pbe') ||
            title.includes('palmilha') ||
            title.includes('saúde da mulher') ||
            title.includes('evolução') ||
            title.includes('wizard') ||
            title.includes('consulta') ||
            title.includes('clinical') ||
            title.includes('assessment') ||
            title.includes('physical') ||
            (title.includes('avaliação') && !isStandardScale);

        // Final Category assignment:
        // Priority 1: If it's a CLINICAL Tool (PBE, Physical, etc), it's a FORM.
        // Priority 2: If it's a Standardized SCALE or Follow-up, it's a QUESTIONNAIRE.
        // Default: Forms.

        let category: 'form' | 'questionnaire' = 'form';
        if (isClinicalTool && !isStandardFollowup) {
            category = 'form';
        } else if (isQuestionnaire) {
            category = 'questionnaire';
        }

        return { ...f, category }
    });

    const questionnaireList = categorizedForms.filter(f => f.category === 'questionnaire')
    const customFormList = categorizedForms.filter(f => f.category === 'form')

    const filteredForms = customFormList.filter(f => f.title.toLowerCase().includes(formSearch.toLowerCase()))
    const filteredQuestionnaires = questionnaireList.filter(f => f.title.toLowerCase().includes(questionnaireSearch.toLowerCase()))
    const filteredProtocols = protocols.all.filter(p => p.title.toLowerCase().includes(protocolSearch.toLowerCase()))
    const filteredMessages = messageTemplates.all.filter(m => m.title.toLowerCase().includes(messageSearch.toLowerCase()))

    const allowedQuestionnairesCount = questionnaireList.filter(q => allowedForms.includes(q.id)).length
    const allowedCustomFormsCount = customFormList.filter(cf => allowedForms.includes(cf.id)).length

    const handleSelectAll = async (type: 'forms' | 'questionnaires' | 'protocols' | 'messages', checked: boolean) => {
        setProcessing(`all-${type}`)
        try {
            if (type === 'forms') {
                await Promise.all(filteredForms.map(f => toggleFormAccess(tenantId, f.id, checked)))
                if (checked) setAllowedForms(prev => [...new Set([...prev, ...filteredForms.map(f => f.id)])])
                else setAllowedForms(prev => prev.filter(id => !filteredForms.find(f => f.id === id)))
            } else if (type === 'questionnaires') {
                await Promise.all(filteredQuestionnaires.map(f => toggleFormAccess(tenantId, f.id, checked)))
                if (checked) setAllowedForms(prev => [...new Set([...prev, ...filteredQuestionnaires.map(f => f.id)])])
                else setAllowedForms(prev => prev.filter(id => !filteredQuestionnaires.find(f => f.id === id)))
            } else if (type === 'protocols') {
                await Promise.all(filteredProtocols.map(p => toggleProtocolAccess(tenantId, p.id, checked)))
                if (checked) setAllowedProtocols(prev => [...new Set([...prev, ...filteredProtocols.map(p => p.id)])])
                else setAllowedProtocols(prev => prev.filter(id => !filteredProtocols.find(p => p.id === id)))
            } else if (type === 'messages') {
                await Promise.all(filteredMessages.map(m => toggleMessageTemplateAccess(tenantId, m.id, checked)))
                if (checked) setAllowedMessages(prev => [...new Set([...prev, ...filteredMessages.map(m => m.id)])])
                else setAllowedMessages(prev => prev.filter(id => !filteredMessages.find(m => m.id === id)))
            }
            toast.success("Atualização em lote concluída.")
        } catch (e) {
            toast.error("Erro na atualização em lote.")
        } finally {
            setProcessing(null)
        }
    }

    const listClass = "hidden md:inline-flex h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm overflow-x-auto scrollbar-hide shrink-0"
    const triggerClass = "relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-md hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"

    return (
        <Card className="shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-zinc-500" />
                    Acesso Granular de Conteúdo
                </CardTitle>
                <CardDescription>Escolha quais recursos esta clínica pode visualizar e utilizar.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="forms" className="w-full">
                    <div className="p-4 pb-0 bg-white border-b sticky top-0 z-10">
                        <TabsList className={listClass}>
                            <TabsTrigger value="forms" className={triggerClass}>
                                Formulários ({allowedCustomFormsCount})
                            </TabsTrigger>
                            <TabsTrigger value="questionnaires" className={triggerClass}>
                                Questionários ({allowedQuestionnairesCount})
                            </TabsTrigger>
                            <TabsTrigger value="protocols" className={triggerClass}>
                                Protocolos ({allowedProtocols.length})
                            </TabsTrigger>
                            <TabsTrigger value="messages" className={triggerClass}>
                                Mensagens WhatsApp ({allowedMessages.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="forms" className="p-4 m-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar formulários e ferramentas clínicas..."
                                    className="pl-9"
                                    value={formSearch}
                                    onChange={(e) => setFormSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAll('forms', true)}
                                disabled={!!processing || filteredForms.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Selecionar Todos
                            </Button>
                        </div>
                        <ScrollArea className="h-[400px] border rounded-md p-2">
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
                                {filteredForms.length === 0 && <div className="text-center py-10 text-zinc-400 text-sm">Nenhum formulário encontrado.</div>}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="questionnaires" className="p-4 m-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar escalas e acompanhamentos..."
                                    className="pl-9"
                                    value={questionnaireSearch}
                                    onChange={(e) => setQuestionnaireSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAll('questionnaires', true)}
                                disabled={!!processing || filteredQuestionnaires.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Selecionar Todos
                            </Button>
                        </div>
                        <ScrollArea className="h-[400px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredQuestionnaires.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`ques-${item.id}`}
                                            checked={allowedForms.includes(item.id)}
                                            onCheckedChange={(c) => handleFormToggle(item.id, !!c)}
                                            disabled={!!processing}
                                        />
                                        <label htmlFor={`ques-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <ClipboardList className="h-3.5 w-3.5 text-indigo-400" />
                                            {item.title}
                                            {processing === item.id && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
                                        </label>
                                    </div>
                                ))}
                                {filteredQuestionnaires.length === 0 && <div className="text-center py-10 text-zinc-400 text-sm">Nenhum questionário encontrado nesta categoria.</div>}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="protocols" className="p-4 m-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar protocolos..."
                                    className="pl-9"
                                    value={protocolSearch}
                                    onChange={(e) => setProtocolSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAll('protocols', true)}
                                disabled={!!processing || filteredProtocols.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Selecionar Todos
                            </Button>
                        </div>
                        <ScrollArea className="h-[400px] border rounded-md p-2">
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

                    <TabsContent value="messages" className="p-4 m-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar modelos de mensagem..."
                                    className="pl-9"
                                    value={messageSearch}
                                    onChange={(e) => setMessageSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAll('messages', true)}
                                disabled={!!processing || filteredMessages.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Selecionar Todos
                            </Button>
                        </div>
                        <ScrollArea className="h-[400px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredMessages.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`message-${item.id}`}
                                            checked={allowedMessages.includes(item.id)}
                                            onCheckedChange={(c) => handleMessageToggle(item.id, !!c)}
                                            disabled={!!processing}
                                        />
                                        <label htmlFor={`message-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                                            {item.title} {item.channel && `(${item.channel})`}
                                            {processing === item.id && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
                                        </label>
                                    </div>
                                ))}
                                {filteredMessages.length === 0 && <div className="text-center py-10 text-zinc-400 text-sm">Nenhum modelo de mensagem encontrado.</div>}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
