'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, ClipboardList, Loader2, Search, MessageSquare, CheckSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getGlobalContentForPlans } from "../actions"
import { toast } from "sonner"

interface PlanGranularAccessProps {
    allowedForms: string[]
    allowedProtocols: string[]
    allowedMessages: string[]
    onChange: (type: 'forms' | 'protocols' | 'messages', newValues: string[]) => void
}

export function PlanGranularAccessManager({ allowedForms, allowedProtocols, allowedMessages, onChange }: PlanGranularAccessProps) {
    const [globalContent, setGlobalContent] = useState<{ forms: any[], protocols: any[], messages: any[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const [formSearch, setFormSearch] = useState('')
    const [questionnaireSearch, setQuestionnaireSearch] = useState('')
    const [protocolSearch, setProtocolSearch] = useState('')
    const [messageSearch, setMessageSearch] = useState('')

    useEffect(() => {
        async function fetchContent() {
            try {
                const data = await getGlobalContentForPlans()
                setGlobalContent(data)
            } catch (e) {
                toast.error("Erro ao carregar conteúdo global.")
            } finally {
                setLoading(false)
            }
        }
        fetchContent()
    }, [])

    if (loading || !globalContent) {
        return (
            <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mb-2" />
                    <p className="text-sm text-zinc-500">Carregando acervo global...</p>
                </CardContent>
            </Card>
        )
    }

    const handleToggle = (type: 'forms' | 'protocols' | 'messages', id: string, checked: boolean) => {
        let currentArray = type === 'forms' ? allowedForms : type === 'protocols' ? allowedProtocols : allowedMessages;
        let newArray = checked ? [...currentArray, id] : currentArray.filter(item => item !== id);
        onChange(type, newArray);
    }

    // Consolidated categorization logic for forms
    const categorizedForms = globalContent.forms.map(f => {
        const title = f.title?.toLowerCase() || ''
        const isStandardScale = ['aofas', 'prwe', 'dash', 'quickdash', 'koos', 'hoos', 'odi', 'ndi', 'oswestry', 'roland-morris', 'roland morris', 'womac', 'lefs', 'spadi', 'tampa', 'quebec', 'mcgill', 'mnsi', 'iciq', 'udi', 'faam', 'faos', 'i-hot', 'ihot', 'start back', 'stark'].some(t => title.includes(t));
        const isStandardFollowup = title.includes('acompanhamento') || title.includes('manutenção') || f.type === 'followup';
        const isQuestionnaire = isStandardScale || (f.is_locked && (f.type === 'questionnaire' || isStandardFollowup));

        let category: 'form' | 'questionnaire' = 'form';
        if (isQuestionnaire) category = 'questionnaire';
        return { ...f, category }
    });

    const questionnaireList = categorizedForms.filter(f => f.category === 'questionnaire')
    const customFormList = categorizedForms.filter(f => f.category === 'form')

    const filteredForms = customFormList.filter(f => f.title.toLowerCase().includes(formSearch.toLowerCase()))
    const filteredQuestionnaires = questionnaireList.filter(f => f.title.toLowerCase().includes(questionnaireSearch.toLowerCase()))
    const filteredProtocols = globalContent.protocols.filter(p => p.title.toLowerCase().includes(protocolSearch.toLowerCase()))
    const filteredMessages = globalContent.messages.filter(m => m.title.toLowerCase().includes(messageSearch.toLowerCase()))

    const allowedQuestionnairesCount = questionnaireList.filter(q => allowedForms.includes(q.id)).length
    const allowedCustomFormsCount = customFormList.filter(cf => allowedForms.includes(cf.id)).length

    const isAllSelected = (uiType: 'forms' | 'questionnaires' | 'protocols' | 'messages') => {
        if (uiType === 'forms') return filteredForms.length > 0 && filteredForms.every(f => allowedForms.includes(f.id));
        if (uiType === 'questionnaires') return filteredQuestionnaires.length > 0 && filteredQuestionnaires.every(f => allowedForms.includes(f.id));
        if (uiType === 'protocols') return filteredProtocols.length > 0 && filteredProtocols.every(f => allowedProtocols.includes(f.id));
        if (uiType === 'messages') return filteredMessages.length > 0 && filteredMessages.every(f => allowedMessages.includes(f.id));
        return false;
    }

    const handleSelectAll = (uiType: 'forms' | 'questionnaires' | 'protocols' | 'messages') => {
        const currentlyAllSelected = isAllSelected(uiType);
        const checked = !currentlyAllSelected;

        if (uiType === 'forms') {
            let newArray = checked
                ? [...new Set([...allowedForms, ...filteredForms.map(f => f.id)])]
                : allowedForms.filter(id => !filteredForms.find(f => f.id === id));
            onChange('forms', newArray);
        } else if (uiType === 'questionnaires') {
            let newArray = checked
                ? [...new Set([...allowedForms, ...filteredQuestionnaires.map(f => f.id)])]
                : allowedForms.filter(id => !filteredQuestionnaires.find(f => f.id === id));
            onChange('forms', newArray);
        } else if (uiType === 'protocols') {
            let newArray = checked
                ? [...new Set([...allowedProtocols, ...filteredProtocols.map(f => f.id)])]
                : allowedProtocols.filter(id => !filteredProtocols.find(f => f.id === id));
            onChange('protocols', newArray);
        } else if (uiType === 'messages') {
            let newArray = checked
                ? [...new Set([...allowedMessages, ...filteredMessages.map(f => f.id)])]
                : allowedMessages.filter(id => !filteredMessages.find(f => f.id === id));
            onChange('messages', newArray);
        }
    }

    const listClass = "hidden md:inline-flex h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm overflow-x-auto scrollbar-hide shrink-0"
    const triggerClass = "relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-md hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"

    return (
        <Card className="shadow-sm border-0 bg-transparent sm:bg-card sm:border">
            <CardHeader className="bg-zinc-50/50 border-b hidden sm:block">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-zinc-500" />
                    Acesso Granular do Plano
                </CardTitle>
                <CardDescription>Configure os formulários e mensagens integrados nativamente ao plano.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="forms" className="w-full">
                    <div className="p-4 flex justify-between items-center sm:bg-white border-b sticky top-0 z-10 gap-2 overflow-x-auto">
                        <TabsList className={listClass}>
                            <TabsTrigger value="forms" className={triggerClass}>
                                Forms ({allowedCustomFormsCount})
                            </TabsTrigger>
                            <TabsTrigger value="questionnaires" className={triggerClass}>
                                Escalas ({allowedQuestionnairesCount})
                            </TabsTrigger>
                            <TabsTrigger value="protocols" className={triggerClass}>
                                Protocolos ({allowedProtocols.length})
                            </TabsTrigger>
                            <TabsTrigger value="messages" className={triggerClass}>
                                Modelos WhatsApp ({allowedMessages.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="forms" className="p-4 m-0">
                        <div className="flex flex-col gap-3 mb-4">
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
                                variant="outline" type="button" size="sm"
                                onClick={() => handleSelectAll('forms')}
                                disabled={filteredForms.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" /> {isAllSelected('forms') ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </Button>
                        </div>
                        <ScrollArea className="h-[250px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredForms.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`plan-form-${item.id}`}
                                            checked={allowedForms.includes(item.id)}
                                            onCheckedChange={(c) => handleToggle('forms', item.id, !!c)}
                                        />
                                        <label htmlFor={`plan-form-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-zinc-400" />
                                            {item.title}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="questionnaires" className="p-4 m-0">
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar ferramentas padronizadas..."
                                    className="pl-9"
                                    value={questionnaireSearch}
                                    onChange={(e) => setQuestionnaireSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline" type="button" size="sm"
                                onClick={() => handleSelectAll('questionnaires')}
                                disabled={filteredQuestionnaires.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" /> {isAllSelected('questionnaires') ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </Button>
                        </div>
                        <ScrollArea className="h-[250px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredQuestionnaires.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`plan-ques-${item.id}`}
                                            checked={allowedForms.includes(item.id)}
                                            onCheckedChange={(c) => handleToggle('forms', item.id, !!c)}
                                        />
                                        <label htmlFor={`plan-ques-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <ClipboardList className="h-3.5 w-3.5 text-indigo-400" />
                                            {item.title}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="protocols" className="p-4 m-0">
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar protocolos prescritos..."
                                    className="pl-9"
                                    value={protocolSearch}
                                    onChange={(e) => setProtocolSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline" type="button" size="sm"
                                onClick={() => handleSelectAll('protocols')}
                                disabled={filteredProtocols.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" /> {isAllSelected('protocols') ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </Button>
                        </div>
                        <ScrollArea className="h-[250px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredProtocols.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`plan-prot-${item.id}`}
                                            checked={allowedProtocols.includes(item.id)}
                                            onCheckedChange={(c) => handleToggle('protocols', item.id, !!c)}
                                        />
                                        <label htmlFor={`plan-prot-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <ClipboardList className="h-3.5 w-3.5 text-zinc-400" />
                                            {item.title}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="messages" className="p-4 m-0">
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar mensagens globais..."
                                    className="pl-9"
                                    value={messageSearch}
                                    onChange={(e) => setMessageSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline" type="button" size="sm"
                                onClick={() => handleSelectAll('messages')}
                                disabled={filteredMessages.length === 0}
                                className="shrink-0"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" /> {isAllSelected('messages') ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </Button>
                        </div>
                        <ScrollArea className="h-[250px] border rounded-md p-2">
                            <div className="space-y-1">
                                {filteredMessages.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 rounded-md">
                                        <Checkbox
                                            id={`plan-msg-${item.id}`}
                                            checked={allowedMessages.includes(item.id)}
                                            onCheckedChange={(c) => handleToggle('messages', item.id, !!c)}
                                        />
                                        <label htmlFor={`plan-msg-${item.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center gap-2">
                                            <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                                            {item.title} {item.channel && `(${item.channel})`}
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
