"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "use-debounce"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Save, CheckCircle, Clock, ChevronRight, ChevronLeft, PanelRightClose, PanelRightOpen, FileText, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { saveAttendanceRecord, finishAttendance, startAttendance } from "./actions"
import { AssessmentTab } from "@/app/dashboard/patients/assessment-tab"
import { FormRenderer } from "@/components/forms/FormRenderer"
import { useSidebar } from "@/hooks/use-sidebar"

interface AttendanceClientProps {
    appointment: any
    patient: any
    templates: any[]
    preferences: any[]
    existingRecord: any
    history: any[]
    assessments: any[]
}

export function AttendanceClient({
    appointment,
    patient,
    templates,
    preferences,
    existingRecord,
    history,
    assessments
}: AttendanceClientProps) {
    const router = useRouter()

    // Determine default template
    const getInitialTemplateId = () => {
        if (existingRecord?.template_id) return existingRecord.template_id
        const fav = preferences.find(p => p.is_favorite)
        if (fav) return fav.template_id
        if (templates.length > 0) return templates[0].id
        return ""
    }

    const { setIsCollapsed } = useSidebar()

    // Auto-collapse global sidebar on mount
    useEffect(() => {
        setIsCollapsed(true)
        return () => setIsCollapsed(false) // Restore on unmount
    }, [setIsCollapsed])

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(getInitialTemplateId())
    const [currentRecord, setCurrentRecord] = useState<any>(existingRecord)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isCreatingRecord, setIsCreatingRecord] = useState(false)

    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') === 'assessments' ? 'assessments' : 'evolution'
    const [activeTab, setActiveTab] = useState(defaultTab)

    // Auto-start attendance and ensure record exists
    useEffect(() => {
        const init = async () => {
            // 1. Start Attendance Status
            if (appointment.status !== 'Em Atendimento' && appointment.status !== 'Realizado') {
                await startAttendance(appointment.id)
            }

            // 2. Ensure Record Exists
            if (!currentRecord && selectedTemplateId && !isCreatingRecord) {
                setIsCreatingRecord(true)
                try {
                    const res = await saveAttendanceRecord({
                        appointment_id: appointment.id,
                        patient_id: patient.id,
                        template_id: selectedTemplateId,
                        content: {},
                        record_id: null
                    })

                    if (res.success && res.data) {
                        setCurrentRecord(res.data)
                        // Verify if the selected template matches
                        if (!selectedTemplateId) {
                            setSelectedTemplateId(res.data.template_id)
                        }
                    } else {
                        toast.error(res.msg || "Erro ao criar registro")
                    }
                } catch (e) {
                    console.error("Failed to create initial record", e)
                    toast.error("Erro inesperado ao iniciar")
                } finally {
                    setIsCreatingRecord(false)
                }
            }
        }
        init()
    }, [appointment.id, appointment.status, currentRecord, selectedTemplateId, isCreatingRecord, patient.id])

    // Handle Template Change
    const handleTemplateChange = async (newTemplateId: string) => {
        setSelectedTemplateId(newTemplateId)
        if (currentRecord) {
            // Update the record's template preference immediately
            await saveAttendanceRecord({
                appointment_id: appointment.id,
                patient_id: patient.id,
                template_id: newTemplateId,
                content: currentRecord.content || {},
                record_id: currentRecord.id
            })
            // Update local state to reflect change (though content stays same for now unless we want to reset)
            setCurrentRecord({ ...currentRecord, template_id: newTemplateId })
        }
    }

    const handleFinish = async () => {
        // FormRenderer autosaves, so we just finish the appointment
        toast.promise(finishAttendance(appointment.id), {
            loading: 'Finalizando...',
            success: 'Atendimento finalizado!',
            error: 'Erro ao finalizar'
        })
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={patient.image_url} />
                            <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-lg font-bold leading-none">{patient.name}</h1>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{patient.birth_date ? '?? anos' : 'Cadastro incompleto'}</span>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="uppercase text-xs">{appointment.services?.name || "Consulta"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white">
                        Finalizar Atendimento
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-2">
                                    {isSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isSidebarOpen ? "Ocultar Histórico" : "Mostrar Histórico"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden gap-6">
                {/* Main Content Area (Tabs) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <TabsList>
                                <TabsTrigger value="evolution" className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Evolução do Dia
                                </TabsTrigger>
                                <TabsTrigger value="assessments" className="gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    Questionários
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="evolution" className="flex-1 overflow-hidden mt-0">
                            <Card className="flex flex-col h-full border-0 shadow-none bg-slate-50/50">
                                <CardHeader className="pb-2 px-0 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <Label className="whitespace-nowrap">Modelo de Evolução:</Label>
                                        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                            <SelectTrigger className="w-[300px] bg-white">
                                                <SelectValue placeholder="Selecione um modelo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {templates.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <Separator className="mb-4" />
                                <ScrollArea className="flex-1 -mr-4 pr-4">
                                    <CardContent className="px-1 pb-20">
                                        {selectedTemplate && currentRecord ? (
                                            <FormRenderer
                                                recordId={currentRecord.id}
                                                template={selectedTemplate}
                                                initialContent={currentRecord.content || {}}
                                                status="draft"
                                                patientId={patient.id}
                                                templateId={selectedTemplateId}
                                                hideHeader={true}
                                                hideTitle={true}
                                            />
                                        ) : (
                                            <div className="text-center py-20 text-muted-foreground">
                                                {isCreatingRecord ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Clock className="h-4 w-4 animate-spin" />
                                                        Iniciando atendimento...
                                                    </div>
                                                ) : (
                                                    "Selecione um modelo para começar a evolução."
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </ScrollArea>
                            </Card>
                        </TabsContent>

                        <TabsContent value="assessments" className="flex-1 overflow-y-auto mt-0">
                            <Card className="h-full border-0 shadow-none bg-transparent">
                                <CardContent className="px-0">
                                    <AssessmentTab patientId={patient.id} assessments={assessments} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar: History */}
                {isSidebarOpen && (
                    <div className="w-[300px] border-l pl-6 h-full flex flex-col overflow-hidden shrink-0 transition-all duration-300">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Histórico Recente
                        </h3>
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-4">
                                {history.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum histórico disponível.</p>
                                )}
                                {history.map(rec => (
                                    <Card key={rec.id} className="bg-slate-50">
                                        <CardHeader className="p-3 pb-1">
                                            <CardTitle className="text-sm">{format(new Date(rec.created_at), "dd/MM/yyyy HH:mm")}</CardTitle>
                                            <CardDescription className="text-xs">{rec.form_templates?.title || 'Sem modelo'}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-2 text-xs text-muted-foreground line-clamp-4">
                                            {/* Simple visualization of content */}
                                            {Object.values(rec.content).join(', ')}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    )
}
