"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useDebounce } from "use-debounce"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Save, CheckCircle, Clock, ChevronRight, ChevronLeft, PanelRightClose, PanelRightOpen, FileText, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

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
import { QuestionnairesTab } from "@/app/dashboard/patients/components/QuestionnairesTab" // [UPDATED]
import { FormRenderer } from "@/components/forms/FormRenderer"
import { useSidebar } from "@/hooks/use-sidebar"
import { FinishAttendanceDialog } from "./finish-attendance-dialog"
import { ViewRecordDialog } from "./view-record-dialog"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import { PhysicalAssessmentForm } from "@/components/assessments/physical-assessment-form"
import { VoiceRecorder } from "@/components/ui/voice-recorder"
import { BiomechanicsForm } from "@/components/assessments/biomechanics-form"

interface AttendanceClientProps {
    appointment: any
    patient: any
    templates: any[]
    preferences: any[]
    existingRecord: any
    history: any[]
    assessments: any[]
    paymentMethods?: any[]
    professionals?: any[] // [NEW]
}

function calculateAge(dateOfBirth: string) {
    if (!dateOfBirth) return ''
    const birthDate = new Date(dateOfBirth)
    const difference = Date.now() - birthDate.getTime()
    const ageDate = new Date(difference)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
}

function formatPhone(phone: string) {
    if (!phone) return ''
    const cleaned = ('' + phone).replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3]
    }
    const matchLandline = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/)
    if (matchLandline) {
        return '(' + matchLandline[1] + ') ' + matchLandline[2] + '-' + matchLandline[3]
    }
    return phone
}

function Stopwatch({ startTime }: { startTime?: string }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        const calculateDiff = () => {
            const now = new Date();
            // Handle "HH:MM:SS" by combining with today's date if needed
            let start = new Date(startTime);

            // If invalid date (likely just time string), construct with today
            if (isNaN(start.getTime())) {
                const [h, m, s] = startTime.split(':').map(Number);
                start = new Date();
                start.setHours(h, m, s || 0, 0);
            }

            const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
            return diff > 0 ? diff : 0;
        }

        setElapsed(calculateDiff());

        const interval = setInterval(() => {
            setElapsed(calculateDiff());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return <span className="font-mono text-sm font-medium">{formatTime(elapsed)}</span>;
}

export function AttendanceClient({
    appointment,
    patient,
    templates,
    preferences,
    existingRecord,
    history,
    assessments,
    paymentMethods = [],
    professionals = [] // [NEW]
}: AttendanceClientProps) {
    const router = useRouter()
    const { setActiveAttendanceId, setStartTime, setPatientName } = useActiveAttendance() // [NEW]

    // Determine default template
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode') as 'assessment' | 'evolution' | null
    const defaultTab = mode === 'assessment' ? 'evolution' : 'evolution' // Default is separate from Mode logic? 
    // Wait, use case:
    // If Mode=Assessment -> Tab=Evolution (where form is) but Template Filter = Assessment
    // If Mode=Evolution -> Tab=Evolution (where form is) but Template Filter = Evolution
    // The "assessments" tab is for LISTING past assessments. The "evolution" tab is for PERFORMING the action (form).
    // So both modes use the 'evolution' tab to fill the form.

    // Filter Templates
    // Exclude scored questionnaires (WOMAC, LEFS, etc.) from form selection
    // These should only appear in the "Histórico de Questionários" tab
    const SCORED_QUESTIONNAIRE_TITLES = [
        'STarT Back Screening Tool (SBST-Brasil)',
        'Roland-Morris (RMDQ-Brasil)',
        'Índice de Incapacidade Oswestry (ODI 2.0 - Brasil)',
        'Escala Tampa de Cinesiofobia (TSK-17)',
        'McGill de Dor (SF-MPQ - Brasil)',
        'QuickDASH (Membro Superior)',
        'LEFS (Membro Inferior)',
        'Escala de Quebec (QBPDS-Brasil)',
        'Índice de Incapacidade Cervical (NDI-Brasil)',
        'PSFS - Escala Funcional Específica do Paciente',
        'SPADI - Índice de Dor e Incapacidade do Ombro',
        'PRWE - Avaliação do Punho pelo Paciente',
        'iHOT-33 (International Hip Outcome Tool)',
        'WOMAC (Osteoartrite)',
        'HOOS (Hip Disability and OA Outcome Score)',
        'Escala Lysholm (Joelho)',
        'KOOS (Joelho)',
        'FAOS (Tornozelo e Pé)',
        'FAAM (Tornozelo e Pé)',
        'AOFAS (Tornozelo/Retropé)',
        'IKDC Subjetivo (Joelho)'
    ]

    const filteredTemplates = templates.filter(t => {
        // [UPDATED] Show ALL templates in unified mode
        // If strict filtering is needed later, we can add it back.
        // For now, we want Evolution + Assessments + Custom in the dropdown.
        // EXCEPT scored questionnaires (handled in the other tab).
        return !SCORED_QUESTIONNAIRE_TITLES.includes(t.title)
    })

    // System Templates
    const PHYSICAL_ASSESSMENT_ID = 'f33bb240-c1be-4201-adf2-e5a59229d056' // Restored ID
    const physicalAssessmentTemplate = {
        id: PHYSICAL_ASSESSMENT_ID,
        title: 'Avaliação Física Avançada',
        type: 'assessment',
        isSystem: true
    }

    const [activeTab, setActiveTab] = useState('evolution') // Always start on form tab

    const getInitialTemplateId = () => {
        if (existingRecord?.template_id) return existingRecord.template_id
        const fav = preferences.find(p => p.is_favorite)
        // Ensure favorite matches mode
        if (fav) {
            const tmpl = templates.find(t => t.id === fav.template_id)
            if (tmpl && (mode === 'assessment' ? tmpl.type === 'assessment' : tmpl.type !== 'assessment')) {
                return fav.template_id
            }
        }
        if (filteredTemplates.length > 0) return filteredTemplates[0].id
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
    const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false) // [NEW]

    // [FIX] Ref to track currentRecord without breaking useCallback stability
    const currentRecordRef = useRef(currentRecord)
    useEffect(() => {
        currentRecordRef.current = currentRecord
    }, [currentRecord])

    // [FIX] Stable Save Handler to prevent Infinite Loop in PhysicalAssessmentForm
    const handlePhysicalAssessmentSave = useCallback((data: any) => {
        // 1. Update Local State via Functional Update (Safe)
        setCurrentRecord((prev: any) => ({ ...prev, content: data }))

        // 2. Persist using Ref to get latest ID without dependency loop
        const recordId = currentRecordRef.current?.id

        saveAttendanceRecord({
            appointment_id: appointment.id,
            patient_id: patient.id,
            template_id: selectedTemplateId || PHYSICAL_ASSESSMENT_ID, // PHYSICAL_ASSESSMENT_ID is in scope? Yes, defined above.
            content: data,
            record_id: recordId,
            record_type: 'assessment' // Force type
        }).then(res => {
            // Update ID if created new
            if (res.success && res.data && !recordId) {
                setCurrentRecord((prev: any) => ({ ...prev, id: res.data.id }))
                toast.success("Avaliação salva!")
            } else if (res.success) {
                // Determine if it was manual save? We don't know here. 
                // But auto-save showing toasts continuously is annoying.
                // Ideally, we pass a flag 'isManual' to the handler?
                // Or just show toast for now as per user request (User clicked "Salvar" and saw no action).
                // Actually, since this handler fires on every keystroke (via PhysicalForm internal effect), showing toast here will spam the user.

                // CRITICAL FIX: The handler executes on EVERY keystroke due to Form's auto-save effect.
                // We MUST distinguish auto-save vs manual save.
                // `PhysicalAssessmentForm` calls `onSave` automatically.
                // `PhysicalAssessmentForm` ALSO has a manual button calling `onSave`.

                // We cannot distinguish them easily unless we change the signature of onSave.
                // Let's modify PhysicalAssessmentForm to accept (data, isManual) or similar.

                // For now, I will NOT show toast on every save.
                // I will add a `toast.success` ONLY if I can verify it's manual.

                // Better approach: `PhysicalAssessmentForm` should handle the toast for manual button?
                // Yes. The button is IN `PhysicalAssessmentForm`.
                // I will revert this thought and modify `PhysicalAssessmentForm` instead.
            } else {
                toast.error("Erro ao salvar avaliação")
            }
        })
    }, [appointment.id, patient.id, selectedTemplateId]) // minimal dependencies


    // Auto-start attendance and ensure record exists
    useEffect(() => {
        const init = async () => {
            // 1. Start Attendance Status (Only if strictly attendance mode?)
            // If Assessment, do we change status to "Em Atendimento"? Probably yes, user is engaging.
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
                        record_id: null,
                        record_type: mode || 'evolution' // [NEW] Pass type
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
            // [NEW] Set Active Context
            setActiveAttendanceId(appointment.id)
            setPatientName(patient.name)
            setPatientName(patient.name)
            // Logic for Timer: Use existing record creation OR appointment start (if in progress)
            let start = null

            if (existingRecord?.created_at) {
                start = existingRecord.created_at
            } else if (currentRecord?.created_at) {
                start = currentRecord.created_at
            } else if (appointment.status === 'in_progress' || appointment.status === 'realizado') {
                // Fallback to appointment updated_at if no record but status indicates it started
                // Note: updated_at changes on finish too, but better than 00:00.
                // Ideally we'd have a 'started_at' field. For now, updated_at is the best proxy if status just changed to in_progress.
                start = appointment.updated_at
            }

            setStartTime(start)
        }
        init()
    }, [appointment.id, appointment.status, currentRecord, selectedTemplateId, isCreatingRecord, patient.id, mode])

    // Handle Template Change
    const handleTemplateChange = async (newTemplateId: string) => {
        const newTemplate = templates.find(t => t.id === newTemplateId)
        // Default to 'evolution' if not found, or use template's type
        const newRecordType = newTemplate?.type === 'physical_assessment' ? 'assessment' : (newTemplate?.type || 'evolution')

        // 1. Check if current record has meaningful content
        const hasContent = currentRecord && currentRecord.content && Object.keys(currentRecord.content).length > 0;

        try {
            if (hasContent) {
                // CASE A: Current form is filled -> Save to History (Link to current appointment remains, but we create a NEW active one)
                // The previous record is already auto-saved to DB.
                // We just need to stop tracking it as "currentRecord" and create a fresh one.

                toast.success("Registro anterior salvo no histórico.")

                setIsCreatingRecord(true)
                // Create NEW record for the NEW template
                const res = await saveAttendanceRecord({
                    appointment_id: appointment.id,
                    patient_id: patient.id,
                    template_id: newTemplateId,
                    content: {}, // Start empty
                    record_id: null, // Create new
                    record_type: newRecordType
                })

                if (res.success && res.data) {
                    setCurrentRecord(res.data)
                    setSelectedTemplateId(newTemplateId)
                } else {
                    toast.error("Erro ao criar novo formulário")
                }
            } else {
                // CASE B: Current form is empty -> Overwrite/Morph it
                // We update the EXISTING record to the new template
                setSelectedTemplateId(newTemplateId)
                if (currentRecord) {
                    await saveAttendanceRecord({
                        appointment_id: appointment.id,
                        patient_id: patient.id,
                        template_id: newTemplateId,
                        content: {}, // Reset content since it was "empty" (or garbage from previous)
                        record_id: currentRecord.id, // Update existing
                        record_type: newRecordType
                    })
                    // Update local state
                    setCurrentRecord({ ...currentRecord, template_id: newTemplateId, content: {} })
                }
            }
        } catch (error) {
            console.error("Template switch error:", error)
            toast.error("Erro ao trocar de formulário")
        } finally {
            setIsCreatingRecord(false)
        }
    }

    const handleFinish = async () => {
        // [MODIFIED] Open Dialog instead of direct finish
        setIsFinishDialogOpen(true)
    }

    const selectedTemplate = selectedTemplateId === PHYSICAL_ASSESSMENT_ID
        ? physicalAssessmentTemplate
        : templates.find(t => t.id === selectedTemplateId)

    const [viewRecord, setViewRecord] = useState<any>(null) // [NEW]

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* ... Header ... */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={patient.image_url} />
                        <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-lg font-bold leading-none">{patient.name}</h1>
                        <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                                {patient.phone ? formatPhone(patient.phone) : 'Sem telefone'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                                {patient.date_of_birth ? `${calculateAge(patient.date_of_birth)} anos` : 'Idade N/A'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                                {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy') : 'Nascimento N/A'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                                {patient.gender ? (patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Feminino' : patient.gender) : 'Sexo N/A'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="uppercase text-xs font-semibold bg-muted px-1.5 py-0.5 rounded">
                                {appointment.services?.name || "Consulta"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/patients/${patient.id}`}>
                            Voltar ao Perfil
                        </Link>
                    </Button>
                    {/* Timer Component */}
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <Stopwatch startTime={currentRecord?.created_at} />
                    </div>

                    <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white">
                        {mode === 'assessment' ? 'Finalizar Avaliação' : 'Finalizar Atendimento'}
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
            </div >

            <div className="flex-1 flex overflow-hidden gap-6">
                {/* Main Content Area (Tabs) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <TabsList>
                                <TabsTrigger value="evolution" className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Evolução / Formulários
                                </TabsTrigger>
                                <TabsTrigger value="assessments" className="gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    Questionários (Scores)
                                </TabsTrigger>
                            </TabsList>

                            {/* Global Tools Area */}
                            <div className="flex items-center gap-2">
                                {/* Voice Recorder - Available Globally */}
                                <VoiceRecorder
                                    onTranscriptionComplete={(text) => {
                                        navigator.clipboard.writeText(text)
                                        toast.success("Texto copiado! Cole no campo desejado (Ctrl+V).")
                                    }}
                                />
                                {/* TODO: Connect AI Report Button Globally if possible, currently it lives inside PhysicalAssessmentForm */}

                                {/* Template Selector - Visible on Evolution Tab */}
                                {activeTab === 'evolution' && (
                                    <div className="flex items-center gap-2 ml-2">
                                        <Label className="whitespace-nowrap text-muted-foreground hidden sm:block">
                                            Formulário:
                                        </Label>
                                        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                            <SelectTrigger className="w-[250px] bg-white h-9">
                                                <SelectValue placeholder="Selecione um formulário" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* System Templates First */}
                                                <SelectItem value={PHYSICAL_ASSESSMENT_ID}>Avaliação Física Avançada</SelectItem>
                                                <Separator className="my-1" />
                                                {/* User Templates */}
                                                {filteredTemplates.filter(t => t.id !== PHYSICAL_ASSESSMENT_ID).map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <TabsContent value="evolution" className="flex-1 overflow-hidden mt-0">
                            <Card className="flex flex-col h-full border-0 shadow-none bg-slate-50/50 w-full pt-4">
                                <ScrollArea className="flex-1 -mr-4 pr-4">
                                    <CardContent className="px-1 pb-20">
                                        {(selectedTemplateId === PHYSICAL_ASSESSMENT_ID || selectedTemplate?.title === 'Avaliação Física Avançada') ? (
                                            <PhysicalAssessmentForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                            />
                                        ) : (
                                            selectedTemplateId === 'dd59588b-962c-4026-bef5-8f20e954f6aa' || // NEW Palmilha 2.0 ID
                                            selectedTemplate?.title?.includes('Palmilha Biomecânica 2.0')
                                        ) ? (
                                            <BiomechanicsForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                            />
                                        ) : (selectedTemplate && currentRecord) ? (
                                            <div className="space-y-4">
                                                <FormRenderer
                                                    key={selectedTemplateId} // [FIX] Force remount on template change
                                                    recordId={currentRecord.id}
                                                    template={selectedTemplate}
                                                    initialContent={currentRecord.content || {}}
                                                    status="draft"
                                                    patientId={patient.id}
                                                    templateId={selectedTemplateId}
                                                    hideHeader={true}
                                                    hideTitle={true}
                                                    onChange={(newContent) => {
                                                        setCurrentRecord((prev: any) => ({ ...prev, content: newContent }))
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 text-muted-foreground">
                                                {isCreatingRecord ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Clock className="h-4 w-4 animate-spin" />
                                                        Prepare-se...
                                                    </div>
                                                ) : (
                                                    "Selecione um modelo acima para começar."
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
                                    {/* Unified QuestionnairesTab with Insoles enabled (Attendance view sees all) */}
                                    <QuestionnairesTab
                                        patientId={patient.id}
                                        assessments={assessments}
                                        onViewRecord={setViewRecord}
                                        showInsoles={true}
                                    />
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
                                    <Card
                                        key={rec.id}
                                        className="bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-transparent hover:border-slate-200"
                                        onClick={() => setViewRecord(rec)} // [NEW] Open Dialog
                                    >
                                        <CardHeader className="p-3 pb-1">
                                            <CardTitle className="text-sm">{format(new Date(rec.created_at), "dd/MM/yyyy HH:mm")}</CardTitle>
                                            <CardDescription className="text-xs">{rec.form_templates?.title || 'Sem modelo'}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-2 text-xs text-muted-foreground line-clamp-4">
                                            {/* Simple visualization of content */}
                                            {typeof rec.content === 'object' ? Object.values(rec.content).join(', ') : '...'}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>

            <FinishAttendanceDialog
                open={isFinishDialogOpen}
                onOpenChange={setIsFinishDialogOpen}
                appointment={appointment}
                patient={patient}
                recordId={currentRecord?.id}
                paymentMethods={paymentMethods}
                professionals={professionals}
                onConfirm={async () => {
                    const finalData = {
                        appointment_id: appointment.id,
                        patient_id: patient.id,
                        template_id: selectedTemplateId,
                        content: currentRecord?.content || {},
                        record_id: currentRecord?.id,
                        record_type: mode || 'evolution'
                    }

                    await finishAttendance(appointment.id, finalData)
                    setActiveAttendanceId(null) // [NEW] Clear active
                    toast.success("Atendimento encerrado com sucesso!")
                    router.push('/dashboard/schedule')
                }}
            />

            <ViewRecordDialog
                open={!!viewRecord}
                onOpenChange={(v) => !v && setViewRecord(null)}
                record={viewRecord}
                templates={templates}
                patient={patient}
            />

        </div >
    )
}
