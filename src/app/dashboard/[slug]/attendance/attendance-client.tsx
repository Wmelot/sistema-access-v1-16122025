"use client";

import { useState, useEffect, useCallback, useRef } from "react"
import { useDebounce } from "use-debounce"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Save, CheckCircle, Clock, ChevronRight, ChevronLeft, PanelRightClose, PanelRightOpen, FileText, ClipboardList, ChevronDown } from "lucide-react"
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

import { saveAttendanceRecord, finishAttendance, startAttendance } from "@/actions/attendance"
import { QuestionnairesTab } from "@/app/dashboard/[slug]/patients/components/QuestionnairesTab" // [UPDATED]
import { FormRenderer } from "@/components/forms/FormRenderer"
import { useSidebar } from "@/hooks/use-sidebar"
import { FinishAttendanceDialog } from "./finish-attendance-dialog"
import { ViewRecordDialog } from "@/components/records/ViewRecordDialog"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import { AdvancedPhysicalForm } from "@/features/pbe/components/AdvancedPhysicalForm"
import { VoiceRecorder } from "@/components/ui/voice-recorder"
import { BiomechanicsForm } from "@/features/pbe/components/biomechanics-form"
import SmartPBEForm from "@/features/pbe/components/SmartPBEForm"
import { FocusModeEvolution } from "@/features/attendance/components/FocusModeEvolution"
import { WomensHealthForm } from "@/features/womens-health/components/WomensHealthForm" // [NEW]
import { ScanFace } from "lucide-react"
import BiomechanicsInsoleForm from "@/features/pbe/components/BiomechanicsInsoleForm"
import DiabeticFootForm from "@/features/pbe/components/DiabeticFootForm"
import { ConceptPBEForm } from "@/features/pbe/components/ConceptPBEForm"
import Swal from 'sweetalert2'


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
    try {
        const birthDate = new Date(dateOfBirth)
        if (isNaN(birthDate.getTime())) return ''
        const difference = Date.now() - birthDate.getTime()
        const ageDate = new Date(difference)
        return Math.abs(ageDate.getUTCFullYear() - 1970)
    } catch (e) {
        return ''
    }
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

            // [FIX] Absolute safety: if start is in the future or null, treat as Now
            if (isNaN(start.getTime()) || start > now) {
                start = now;
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
    const params = useParams()
    const slug = params?.slug as string
    const { setActiveAttendanceId, setStartTime, setPatientName } = useActiveAttendance() // [NEW]

    // Local History State for immediate updates
    const [localHistory, setLocalHistory] = useState(history)

    // Sync local history if prop changes (e.g. revalidation)
    useEffect(() => {
        setLocalHistory(history)
    }, [history])

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
        // [RESTORED] Exclude scored questionnaires as they belong in their own tab
        return !SCORED_QUESTIONNAIRE_TITLES.includes(t.title)
    })

    // System Templates
    const PHYSICAL_ASSESSMENT_ID = 'f33bb240-c1be-4201-adf2-e5a59229d056' // Restored ID
    const SMART_ASSESSMENT_ID = 'd4c4a6c0-7b2a-4b6e-9c2b-8e1d7f6a5b4c'
    const WOMENS_HEALTH_ID = 'womens_health_system' // [NEW] System ID for Womens Health

    const physicalAssessmentTemplate = {
        id: PHYSICAL_ASSESSMENT_ID,
        title: 'Avaliação Física Avançada',
        type: 'assessment',
        isSystem: true
    }

    const [activeTab, setActiveTab] = useState('evolution') // Always start on form tab

    const getInitialTemplateId = () => {
        if (existingRecord?.template_id) return existingRecord.template_id

        // [NEW] Prioritize Smart Assessment (PBE) for assessment mode
        if (mode === 'assessment') {
            const pbeTemplate = templates.find(t => t.id === SMART_ASSESSMENT_ID || t.title?.includes('PBE'))
            if (pbeTemplate) return pbeTemplate.id
            // Even if not in fetched list, use hardcoded ID if it's the target
            return SMART_ASSESSMENT_ID
        }

        const fav = preferences.find(p => p.is_favorite)
        // Ensure favorite matches mode
        if (fav) {
            const tmpl = templates.find(t => t.id === fav.template_id)
            if (tmpl && tmpl.type !== 'assessment') {
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
    const [isFocusMode, setIsFocusMode] = useState(false) // [NEW] Focus Mode State

    // DEBUG: Trace Form Rendering
    useEffect(() => {
        console.log('AttendanceClient State:', {
            activeTab,
            selectedTemplateId,
            WOMENS_HEALTH_ID: 'womens_health_system',
            match: selectedTemplateId === 'womens_health_system'
        })
    }, [activeTab, selectedTemplateId])

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

        return saveAttendanceRecord({
            appointment_id: appointment.id,
            patient_id: patient.id,
            template_id: selectedTemplateId || PHYSICAL_ASSESSMENT_ID, // PHYSICAL_ASSESSMENT_ID is in scope? Yes, defined above.
            content: data,
            record_id: recordId,
            record_type: 'assessment' // Force type
        }).then(res => {
            // Update ID if created new
            if (res.success && res.data && !recordId) {
                setCurrentRecord((prev: any) => ({ ...prev, id: res.data?.id }))
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
    }, [appointment.id, patient.id, selectedTemplateId])

    // [FIX] Stable handler for BiomechanicsForm real-time sync
    const handleBiomechanicsChange = useCallback((newData: any) => {
        setCurrentRecord((prev: any) => ({ ...prev, content: newData }))
    }, [])


    // Auto-start attendance and ensure record exists
    useEffect(() => {
        const init = async () => {
            // 1. Start Attendance Status
            if (appointment.status !== 'in_progress' && appointment.status !== 'attended') {
                const res = await startAttendance(appointment.id, slug) as any

                // [FIX] Handle Already Active Attendance
                if (res?.error === 'ALREADY_IN_ATTENDANCE') {
                    const confirm = await Swal.fire({
                        title: 'Atenção!',
                        text: `Você já está atendendo ${res.patientName}. Deseja encerrar o anterior e iniciar este?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sim, iniciar este',
                        cancelButtonText: 'Voltar ao anterior',
                        confirmButtonColor: '#ef4444',
                        cancelButtonColor: '#3b82f6',
                        allowOutsideClick: false
                    })

                    if (confirm.isConfirmed) {
                        // Force Finish Previous? Or just Force Start This (server will separate)?
                        // Ideally we should finish active one. But user asked for "Force".
                        // Our Action `startAttendance` BLOCKS if active exists.
                        // We need a "Force" flag in startAttendance or finish the old one first.
                        // Ideally: Redirect to the OLD one? Or Finish OLD one.

                        // User wants: "impossible to start if another active".
                        // So we should NOT allow "Sim, iniciar este" easily unless we close the other.
                        // Let's implement logic: 'Sim' -> Finish Old -> Start This.

                        // But I don't have a direct "Finish Other" action here easily without ID.
                        // Wait, res.activeId IS returned.

                        // Actually, let's keep it simple as per user request: "Trava".
                        // If blocked, he CANNOT start. He must go to the other.
                        // So the Alert should say "Go to Active". 

                        // User said: "aparecer uma merda de um sweet alert perguntando se queria memso iniciar um novo atendimento visto que tem outro em andamento."
                        // Implies CHOICE.

                        // Implementation:
                        // 1. Finish Old (res.activeId)
                        // 2. Start This

                        await finishAttendance(res.activeId, {
                            appointment_id: res.activeId,
                            content: {}, // Empty end
                        } as any)

                        // Now Start This
                        await startAttendance(appointment.id, slug)
                        toast.success("Atendimento anterior encerrado e novo iniciado.")

                    } else {
                        // Redirect to Active
                        router.push(`/dashboard/${slug}/attendance/${res.activeId}`)
                        return // Stop execution
                    }
                }
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
                            setSelectedTemplateId(res.data?.template_id || filteredTemplates[0]?.id || '')
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

            // Logic for Timer: Use currentRecord creation time to avoid "scheduled vs actual" time gap
            let start = currentRecord?.created_at || appointment.updated_at || null

            if (!start && (appointment.status === 'in_progress' || appointment.status === 'attended')) {
                start = new Date().toISOString()
            }

            setStartTime(start)
        }
        init()
    }, [appointment.id, appointment.status, currentRecord, selectedTemplateId, isCreatingRecord, patient.id, mode])

    // Handle Template Change
    const handleTemplateChange = async (newTemplateId: string) => {
        const newTemplate = templates.find(t => t.id === newTemplateId)
        // Default to 'evolution' if not found, or use template's type
        let newRecordType = newTemplate?.type === 'physical_assessment' ? 'assessment' : (newTemplate?.type || 'evolution')

        if (newTemplateId === SMART_ASSESSMENT_ID || newTemplateId === WOMENS_HEALTH_ID || newTemplate?.title?.includes('Palmilha')) {
            newRecordType = 'assessment'
        }

        // 1. Check if current record has meaningful content
        const hasContent = currentRecord && currentRecord.content && Object.keys(currentRecord.content).length > 0;

        try {
            if (hasContent) {
                // CASE A: Current form is filled -> Save to History (Link to current appointment remains, but we create a NEW active one)
                // The previous record is already auto-saved to DB.
                // We just need to stop tracking it as "currentRecord" and create a fresh one.

                toast.success("Registro anterior salvo no histórico.")

                // Update Local History
                setLocalHistory((prev: any[]) => [currentRecord, ...prev])

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

    // Helper for handleUpdate from Focus Mode
    const handleFocusUpdate = (path: string, value: any) => {
        // We reuse the logic from FormRenderer but applied to currentRecord.content
        setCurrentRecord((prev: any) => {
            const newData = { ...prev }
            if (!newData.content) newData.content = {}

            // Deep set helper
            const keys = path.split('.')
            let current = newData.content
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i]
                if (!current[key]) current[key] = {}
                current = current[key]
            }
            current[keys[keys.length - 1]] = value

            return newData
        })
    }

    // Prevent Hydration Errors (Client Only Render)
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* ... Header ... */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={patient?.image_url} />
                        <AvatarFallback>{patient?.name?.substring(0, 2).toUpperCase() || 'P'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-lg font-bold leading-none">{patient?.name || 'Paciente'}</h1>
                        <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                                {patient?.phone ? formatPhone(patient.phone) : 'Sem telefone'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                                {(patient?.date_of_birth || patient?.birthdate) ? `${calculateAge(patient.date_of_birth || patient.birthdate)} anos` : 'Idade N/A'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                                {(patient?.date_of_birth || patient?.birthdate) ? (isNaN(new Date(patient.date_of_birth || patient.birthdate).getTime()) ? 'Data Inválida' : format(new Date(patient.date_of_birth || patient.birthdate), 'dd/MM/yyyy')) : 'Nascimento N/A'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                                {patient?.gender ? (patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Feminino' : patient.gender) : 'Sexo N/A'}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="uppercase text-xs font-semibold bg-muted px-1.5 py-0.5 rounded">
                                {appointment?.services?.name || "Consulta"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        Voltar
                    </Button>
                    {/* Timer Component - Priority to appointment start_time */}
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <Stopwatch startTime={currentRecord?.created_at || appointment.updated_at || appointment.start_time} />
                    </div>

                    <Button
                        variant={isFocusMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsFocusMode(true)}
                        className="gap-2 border-primary/20 text-indigo-600 hover:bg-primary/5 hidden md:flex"
                        title="Modo Foco (Tela Cheia)"
                    >
                        <ScanFace className="w-4 h-4" />
                        Modo Foco
                    </Button>

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
                        <div className="flex items-center gap-4">
                            <TabsList className="bg-slate-100 p-1">
                                <TabsTrigger value="evolution" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <FileText className="h-4 w-4" />
                                    Evolução / Formulários
                                </TabsTrigger>
                                <TabsTrigger value="assessments" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <ClipboardList className="h-4 w-4" />
                                    Questionários (Scores)
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex items-center gap-2">
                            <VoiceRecorder
                                onTranscriptionComplete={(text) => {
                                    navigator.clipboard.writeText(text)
                                    toast.success("Texto copiado! Cole no campo desejado (Ctrl+V).")
                                }}
                            />
                        </div>

                        <TabsContent value="evolution" className="flex-1 overflow-hidden mt-0">
                            {/* Card Header Design (FOTO 2/3) */}
                            <div className="bg-white border rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => router.back()}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                            Formulário Atual
                                        </span>
                                        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                            <SelectTrigger className="h-auto p-0 border-none shadow-none bg-transparent flex items-center gap-1 focus:ring-0">
                                                <span className="text-xl font-black text-slate-900 tracking-tight text-left">
                                                    {selectedTemplateId === PHYSICAL_ASSESSMENT_ID ? 'Avaliação Física Avançada' :
                                                        selectedTemplateId === SMART_ASSESSMENT_ID ? 'Avaliação PBE (Inteligente)' :
                                                            selectedTemplateId === 'pbe_concept_system' ? 'Formulário Conceito PBE Inicial' :
                                                                selectedTemplateId === WOMENS_HEALTH_ID || selectedTemplateId === 'womens_health_system' ? 'Saúde da Mulher & Pélvica' :
                                                                    selectedTemplateId === 'diabetic_foot_system' ? 'Avaliação de Pé Diabético' :
                                                                        selectedTemplate?.title || 'Selecionar Formulário'}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                                            </SelectTrigger>
                                            <SelectContent className="w-[350px]">
                                                <div className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliações Especializadas</div>
                                                <SelectItem value={PHYSICAL_ASSESSMENT_ID} className="py-2.5">Avaliação Física Avançada</SelectItem>
                                                <SelectItem value={SMART_ASSESSMENT_ID} className="py-2.5">Avaliação PBE (Inteligente)</SelectItem>
                                                <SelectItem value="pbe_concept_system" className="py-2.5 text-slate-400">Formulário Conceito PBE Inicial</SelectItem>
                                                <SelectItem value={WOMENS_HEALTH_ID} className="py-2.5">Saúde da Mulher & Pélvica</SelectItem>
                                                <SelectItem value="diabetic_foot_system" className="py-2.5">Avaliação de Pé Diabético</SelectItem>

                                                {/* Specialized Section for Palmilhas */}
                                                {filteredTemplates.some(t => t.title?.includes('Palmilha')) && (
                                                    <>
                                                        <Separator className="my-1" />
                                                        <div className="px-2 py-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Modelos de Palmilha</div>
                                                        {filteredTemplates
                                                            .filter(t => t.title?.includes('Palmilha'))
                                                            .map(t => (
                                                                <SelectItem key={t.id} value={t.id} className="py-2.5 text-indigo-900">
                                                                    {t.title}
                                                                </SelectItem>
                                                            ))}
                                                    </>
                                                )}

                                                <Separator className="my-1" />
                                                <div className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Outros Modelos</div>
                                                {/* Combine all templates not in the system list and not Palmilha */}
                                                {filteredTemplates
                                                    .filter(t => ![PHYSICAL_ASSESSMENT_ID, SMART_ASSESSMENT_ID, WOMENS_HEALTH_ID, 'womens_health_system'].includes(t.id))
                                                    .filter(t => !t.title?.includes('Palmilha'))
                                                    .map(t => (
                                                        <SelectItem key={t.id} value={t.id} className="font-medium py-2.5">
                                                            {t.title}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Salvamento Automático</span>
                                </div>
                            </div>

                            <Card className="flex flex-col h-full border-0 shadow-none bg-slate-50/50 w-full pt-0">
                                <ScrollArea className="flex-1 -mr-4 pr-4">
                                    <CardContent className="px-1 pb-20">
                                        {(selectedTemplateId === PHYSICAL_ASSESSMENT_ID || selectedTemplate?.title === 'Avaliação Física Avançada') ? (
                                            <AdvancedPhysicalForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                hideHeader
                                                hideButtons
                                            />
                                        ) : (selectedTemplateId === SMART_ASSESSMENT_ID) ? (
                                            <SmartPBEForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                hideHeader
                                                hideButtons
                                            />
                                        ) : (selectedTemplateId === 'pbe_concept_system') ? (
                                            <ConceptPBEForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                hideHeader
                                                hideButtons
                                            />
                                        ) : (selectedTemplateId === 'womens_health_system') ? (
                                            <WomensHealthForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                hideHeader
                                                hideButtons
                                            />
                                        ) : (selectedTemplateId === 'diabetic_foot_system') ? (
                                            <DiabeticFootForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                hideHeader
                                                hideButtons
                                            />
                                        ) : (
                                            selectedTemplate?.title?.includes('Palmilha')
                                        ) ? (
                                            <BiomechanicsInsoleForm
                                                patientId={patient.id}
                                                initialData={currentRecord?.content}
                                                onSave={handlePhysicalAssessmentSave}
                                                patient={patient}
                                                professional={appointment?.profiles}
                                                hideHeader
                                                hideButtons
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
                                {localHistory.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum histórico disponível.</p>
                                )}
                                {localHistory.map(rec => (
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

                    const res = await finishAttendance(appointment.id, finalData)
                    if (res?.success) {
                        setActiveAttendanceId(null)
                        toast.success("Atendimento encerrado com sucesso!")
                        router.push(`/dashboard/${slug}/schedule`)
                    } else {
                        toast.error("Erro ao encerrar atendimento no servidor.")
                    }
                }}
            />

            <ViewRecordDialog
                open={!!viewRecord}
                onOpenChange={(v) => !v && setViewRecord(null)}
                record={viewRecord}
                templates={templates}
                patient={patient}
            />

            {/* [NEW] Focus Mode Overlay */}
            <FocusModeEvolution
                isOpen={isFocusMode}
                onClose={() => setIsFocusMode(false)}
                data={currentRecord?.content}
                onUpdate={handleFocusUpdate}
                templateType={selectedTemplateId === PHYSICAL_ASSESSMENT_ID || selectedTemplate?.title === 'Avaliação Física Avançada' || selectedTemplateId === SMART_ASSESSMENT_ID ? 'smart' : 'default'}
            />

        </div >
    )
}
