"use client";

import { useState, useEffect, useCallback, useRef } from "react"
import { useDebounce } from "use-debounce"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Save, CheckCircle, Clock, ChevronRight, ChevronLeft, PanelRightClose, PanelRightOpen, FileText, ClipboardList, ChevronDown, Mic, History as HistoryIcon, Trash2, Pencil, Check, X, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { saveAttendanceRecord, finishAttendance, startAttendance, deleteAttendanceRecord } from "@/actions/attendance"
import { QuestionnairesTab } from "@/app/dashboard/[slug]/patients/components/QuestionnairesTab" // [UPDATED]
import { FormRenderer } from "@/components/forms/FormRenderer"
import { useSidebar } from "@/hooks/use-sidebar"
import { FinishAttendanceDialog } from "./finish-attendance-dialog"
import { ViewRecordDialog } from "@/components/records/ViewRecordDialog"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import { useGlobalLoader } from "@/components/providers/global-loader-provider"
import { AdvancedPhysicalForm } from "@/features/pbe/components/AdvancedPhysicalForm"
import { VoiceRecorder } from "@/components/ui/voice-recorder"
// BiomechanicsForm removed
import SmartPBEForm from "@/features/pbe/components/SmartPBEForm"
import { FocusModeEvolution } from "@/features/attendance/components/FocusModeEvolution"
import { WomensHealthForm } from "@/features/womens-health/components/WomensHealthForm" // [NEW]
import { ScanFace } from "lucide-react"
import BiomechanicsInsoleForm from "@/features/pbe/components/BiomechanicsInsoleForm"
import DiabeticFootForm from "@/features/pbe/components/DiabeticFootForm"
import { ConceptPBEForm } from "@/features/pbe/components/ConceptPBEForm"
import PalmilhaFormV3 from "@/features/palmilha-biomecanica/components/PalmilhaFormV3"
import FisioterapiaEvolutionForm from "@/features/clinical-evolution/components/FisioterapiaEvolutionForm"
import { UltimatePBEForm } from "@/features/pbe/components/UltimatePBEForm"
import AdvancedSmartAssessment from "@/features/smart-assessment/components/AdvancedSmartAssessment"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal);


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

    // Helper to check if any template is a Palmilha template
    const hasPalmilhaTemplates = filteredTemplates.some(t =>
        t.title?.toLowerCase().includes('palmilha') ||
        t.id === PALMILHA_V3_ID
    )

    // System Templates
    const PHYSICAL_ASSESSMENT_ID = 'system-physical-assessment'
    const SMART_ASSESSMENT_ID = 'd4c4a6c0-7b2a-4b6e-9c2b-8e1d7f6a5b4c'
    const WOMENS_HEALTH_ID = 'womens_health_system'
    const PALMILHA_V3_ID = 'palmilha_v3_system'
    const CLINICAL_EVOLUTION_ID = 'clinical_evolution_system'
    const ULTIMATE_PBE_ID = 'ultimate_pbe_system'
    const TREE_WIZARD_ID = 'tree_wizard_system'


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

    const { showLoading, hideLoading } = useGlobalLoader()

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(getInitialTemplateId())
    const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] = useState(false)
    const [tempTranscriptionText, setTempTranscriptionText] = useState("")
    const [isSavingTranscription, setIsSavingTranscription] = useState(false)
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

    const handleSaveTranscription = async () => {
        if (!currentRecord?.content?.voice_transcript) return

        setIsSavingTranscription(true)
        showLoading("Salvando Transcrição...")
        try {
            const transcript = currentRecord.content.voice_transcript
            const newContent = { ...currentRecord.content }

            // Apply to evolution text if in evolution mode
            if (selectedTemplateId === CLINICAL_EVOLUTION_ID) {
                const existing = newContent.evolution_text || ""
                newContent.evolution_text = existing ? existing + "\n\n" + transcript : transcript
            }

            // Clear transcript after saving it to main content
            newContent.voice_transcript = ""

            const res = await saveAttendanceRecord({
                appointment_id: appointment.id,
                patient_id: patient.id,
                template_id: selectedTemplateId || CLINICAL_EVOLUTION_ID,
                content: newContent,
                record_id: currentRecord.id,
                record_type: mode || 'evolution'
            }, slug)

            if (res.success) {
                const updatedRec = {
                    ...currentRecord,
                    content: newContent,
                    updated_at: new Date().toISOString(),
                    created_at: currentRecord.created_at || new Date().toISOString() // Ensure created_at exists
                }
                setCurrentRecord(updatedRec)
                // Update local history
                setLocalHistory((prev: any[]) => {
                    const exists = prev.find(r => r.id === currentRecord.id)
                    if (exists) {
                        return prev.map(r => r.id === currentRecord.id ? { ...r, content: newContent, updated_at: updatedRec.updated_at } : r)
                    }
                    return [updatedRec, ...prev]
                })
                toast.success("Transcrição salva com sucesso!")
            } else {
                toast.error("Erro ao salvar transcrição: " + res.msg)
            }
        } catch (error) {
            console.error("Transcription save error", error)
            toast.error("Erro ao processar salvamento")
        } finally {
            setIsSavingTranscription(false)
            hideLoading()
        }
    }

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
        }, slug).then(res => {
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
                toast.error(res.msg || "Erro ao salvar avaliação")
            }
        })
    }, [appointment.id, patient.id, selectedTemplateId, slug])

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
                    }, slug)

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
    }, [appointment.id, appointment.status, currentRecord, selectedTemplateId, isCreatingRecord, patient.id, mode, slug, router, setActiveAttendanceId, setPatientName, setStartTime])

    // Handle Template Change
    const handleTemplateChange = async (newTemplateId: string) => {
        const newTemplate = templates.find(t => t.id === newTemplateId)
        // Default to 'evolution' if not found, or use template's type
        let newRecordType = newTemplate?.type === 'physical_assessment' ? 'assessment' : (newTemplate?.type || 'evolution')



        if (newTemplateId === SMART_ASSESSMENT_ID || newTemplateId === WOMENS_HEALTH_ID || newTemplateId === PALMILHA_V3_ID || newTemplate?.title?.includes('Palmilha')) {
            newRecordType = 'assessment'
        }

        if (newTemplateId === CLINICAL_EVOLUTION_ID) {
            newRecordType = 'evolution'
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
                }, slug)

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
                    }, slug)
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
    const handleFocusSave = async (path: string, value: any, label: string) => {
        try {
            const res = await saveAttendanceRecord({
                appointment_id: appointment.id,
                patient_id: patient.id,
                template_id: selectedTemplateId,
                content: currentRecord?.content,
                record_id: currentRecord?.id || undefined, // [FIX] Evita mandar string vazia no UUID
                record_type: mode || 'evolution'
            }, slug)

            if (res.success && res.data) {
                toast.success(`${label} salvo!`)

                // [NEW] Update currentRecord with the saved version (important for record_id)
                setCurrentRecord(res.data)

                // [NEW] Update history immediately
                setLocalHistory(prev => {
                    const exists = prev.find(h => h.id === res.data.id)
                    if (exists) return prev.map(h => h.id === res.data.id ? res.data : h)
                    return [res.data, ...prev]
                })

                return true
            } else {
                toast.error(`Erro ao salvar: ${res.msg}`)
                return false
            }
        } catch (error) {
            console.error("Focus Save Error:", error)
            toast.error("Erro ao salvar no servidor")
            return false
        }
    }

    const handleDeleteRecord = async (recordId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const result = await MySwal.fire({
            title: 'Excluir Registro?',
            text: "Esta ação não pode ser desfeita e será registrada no log de auditoria.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const res = await deleteAttendanceRecord(recordId, slug)
                if (res.success) {
                    toast.success("Registro excluído com sucesso")
                    setLocalHistory(prev => prev.filter(r => r.id !== recordId))
                } else {
                    toast.error("Erro ao excluir: " + res.msg)
                }
            } catch (error) {
                console.error("Delete Error:", error)
                toast.error("Erro ao excluir registro")
            }
        }
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
            {/* Header: Patient Info Card (Redesigned for Mobile) */}
            <div className="flex flex-col gap-4 border-b pb-4 mb-4 shrink-0">
                <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={patient?.image_url} />
                            <AvatarFallback>{patient?.name?.substring(0, 2).toUpperCase() || 'P'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex flex-col">
                                <Link
                                    href={`/dashboard/${slug}/patients/${patient.id}`}
                                    className="hover:text-indigo-600 transition-colors group flex items-center gap-2"
                                >
                                    <h1 className="text-lg font-bold leading-none">{patient?.name || 'Paciente'}</h1>
                                    <HistoryIcon className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                                </Link>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs">
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

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 px-2 sm:px-3 shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Voltar</span>
                        </Button>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 shrink-0">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <Stopwatch startTime={currentRecord?.created_at || appointment.updated_at || appointment.start_time} />
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsFocusMode(true)}
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:scale-105 shrink-0"
                        >
                            <Mic className="w-4 h-4" />
                            Modo Voz & Foco
                        </Button>
                        <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white shrink-0">
                            {mode === 'assessment' ? 'Finalizar Avaliação' : 'Finalizar Atendimento'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-2 shrink-0">
                            {isSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Ultra-Compact Mobile Header (FOTO 2 Style) */}
                <div className="sm:hidden -mx-4 -mt-4 mb-1 sticky top-0 z-40 bg-white border-b px-2 py-2.5 flex items-center justify-between gap-1 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 shrink-0" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-[13px] font-bold text-slate-900 truncate leading-tight">{patient?.name || 'Paciente'}</h1>
                            <span className="text-[10px] text-slate-500 leading-none truncate">
                                {patient?.phone ? formatPhone(patient.phone) : 'Sem tel.'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Timer + Finalizar Capsule (FOTO 1) */}
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full pl-2 pr-1 py-1 gap-2">
                            <div className="flex items-center gap-1 text-slate-600">
                                <Clock className="h-3 w-3" />
                                <Stopwatch startTime={currentRecord?.created_at || appointment.updated_at || appointment.start_time} />
                            </div>
                            <Button
                                size="sm"
                                onClick={handleFinish}
                                className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white rounded-full text-[10px] font-black uppercase tracking-tight"
                            >
                                FINALIZAR
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden gap-6">
                {/* Main Content Area (Tabs) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-4 mb-1 sm:mb-4">
                            {/* Mobile Tabs - Removed for Space as per user request */}
                            <div className="sm:hidden" />

                            <TabsList className="hidden sm:flex bg-slate-100 p-1">
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


                        <TabsContent value="evolution" className="flex-1 overflow-hidden mt-0">
                            {/* Card Header Design (FOTO 1/2 Style Integration) */}
                            <div className="bg-white border rounded-xl p-2.5 sm:p-3 mb-1.5 sm:mb-3 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg hidden sm:flex items-center justify-center text-indigo-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="h-8 w-8 bg-indigo-50 border border-indigo-100 rounded-lg flex sm:hidden items-center justify-center text-indigo-600 shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                            Formulário
                                        </span>
                                        <Select value={selectedTemplateId || undefined} onValueChange={handleTemplateChange}>
                                            <SelectTrigger
                                                className="h-8 sm:h-9 py-1 px-3 w-full max-w-[200px] sm:max-w-[280px] bg-white border-slate-200 shadow-none rounded-lg text-xs sm:text-sm font-bold"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <SelectValue placeholder="Selecionar" className="truncate" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent
                                                className="w-[90vw] sm:w-[350px] z-[9999]"
                                                align="start"
                                            >
                                                {/* Select Items... */}
                                                <SelectGroup>
                                                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Avaliações Especializadas</div>
                                                    <SelectItem value={TREE_WIZARD_ID} className="py-3 cursor-pointer font-bold text-indigo-600 focus:bg-indigo-50">✨ PBE 3.0: Tree Wizard (IA)</SelectItem>
                                                    <SelectItem value={ULTIMATE_PBE_ID} className="py-3 cursor-pointer font-bold text-violet-600 focus:bg-violet-50">✨ Ultimate PBE (Fusão)</SelectItem>
                                                    <SelectItem value={PHYSICAL_ASSESSMENT_ID} className="py-3 cursor-pointer font-medium">Avaliação Física Avançada</SelectItem>
                                                    <SelectItem value={SMART_ASSESSMENT_ID} className="py-3 cursor-pointer font-medium">Avaliação PBE (Inteligente)</SelectItem>
                                                    <SelectItem value="pbe_concept_system" className="py-3 text-slate-500 cursor-pointer font-medium">Formulário Conceito PBE Inicial</SelectItem>
                                                    <SelectItem value={WOMENS_HEALTH_ID} className="py-3 cursor-pointer font-medium">Saúde da Mulher & Pélvica</SelectItem>
                                                    <SelectItem value="diabetic_foot_system" className="py-3 cursor-pointer font-medium">Avaliação de Pé Diabético</SelectItem>
                                                </SelectGroup>

                                                {/* Specialized Section for Palmilhas */}
                                                {hasPalmilhaTemplates && (
                                                    <SelectGroup>
                                                        <Separator className="my-1" />
                                                        <div className="px-2 py-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Modelos de Palmilha</div>
                                                        <SelectItem value={PALMILHA_V3_ID} className="py-2.5 text-violet-700 font-bold bg-violet-50/50 cursor-pointer">Palmilha Biomecânica V3 (NOVO)</SelectItem>
                                                        {filteredTemplates
                                                            .filter(t => t.title?.toLowerCase().includes('palmilha'))
                                                            .map(t => (
                                                                <SelectItem key={t.id} value={t.id} className="py-2.5 text-indigo-900 cursor-pointer">
                                                                    {t.title}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectGroup>
                                                )}

                                                <SelectGroup>
                                                    <Separator className="my-1" />
                                                    <div className="px-2 py-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Evolução Inteligente</div>
                                                    <SelectItem value={CLINICAL_EVOLUTION_ID} className="py-2.5 text-indigo-700 font-bold bg-indigo-50/50 cursor-pointer">Evolução Clínica & IA (NOVO)</SelectItem>
                                                </SelectGroup>

                                                <SelectGroup>
                                                    <Separator className="my-1" />
                                                    <div className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Outros Modelos</div>
                                                    {filteredTemplates
                                                        .filter(t => ![PHYSICAL_ASSESSMENT_ID, SMART_ASSESSMENT_ID, WOMENS_HEALTH_ID, 'womens_health_system'].includes(t.id))
                                                        .filter(t => !t.title?.includes('Palmilha'))
                                                        .map(t => (
                                                            <SelectItem key={t.id} value={t.id} className="font-medium py-2.5 cursor-pointer">
                                                                {t.title}
                                                            </SelectItem>
                                                        ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 shrink-0">
                                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
                                </div>
                            </div>

                            <Card className="flex flex-col h-full border-0 shadow-none bg-slate-50/50 w-full pt-0">
                                <ScrollArea className="flex-1 -mr-4 pr-4">
                                    <CardContent className="px-1 pb-20">
                                        {/* [NEW] Micro-Card for Transcription */}
                                        {currentRecord?.content?.voice_transcript && (
                                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="bg-white border-2 border-indigo-100 rounded-xl p-3 shadow-sm flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                                                            <Mic className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate">
                                                                Transcrição: {patient?.name?.split(' ')[0]}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">
                                                                {format(new Date(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                            </p>
                                                            <p className="text-[10px] text-indigo-600 font-medium truncate italic mt-0.5 opacity-70">
                                                                "{currentRecord.content.voice_transcript.substring(0, 40)}..."
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                            onClick={() => {
                                                                setCurrentRecord((prev: any) => ({
                                                                    ...prev,
                                                                    content: { ...prev.content, voice_transcript: "" }
                                                                }))
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                            onClick={() => {
                                                                setTempTranscriptionText(currentRecord.content.voice_transcript)
                                                                setIsTranscriptionModalOpen(true)
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>

                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            disabled={isSavingTranscription}
                                                            className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-3 font-bold"
                                                            onClick={handleSaveTranscription}
                                                        >
                                                            {isSavingTranscription ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                            {isSavingTranscription ? "Salvando..." : "Salvar"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Modal de Edição de Transcrição */}
                                        <Dialog open={isTranscriptionModalOpen} onOpenChange={setIsTranscriptionModalOpen}>
                                            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                                                <DialogHeader className="p-6 bg-indigo-600 text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white/20 rounded-lg">
                                                            <Mic className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <DialogTitle className="text-xl font-bold">Editar Transcrição</DialogTitle>
                                                            <DialogDescription className="text-indigo-100">
                                                                Revise o texto capturado antes de salvar no prontuário.
                                                            </DialogDescription>
                                                        </div>
                                                    </div>
                                                </DialogHeader>

                                                <div className="p-6">
                                                    <textarea
                                                        className="w-full h-[400px] p-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-200 focus:ring-0 text-slate-700 text-lg leading-relaxed resize-none"
                                                        value={tempTranscriptionText}
                                                        onChange={(e) => setTempTranscriptionText(e.target.value)}
                                                        placeholder="Digite ou edite o texto aqui..."
                                                    />
                                                </div>

                                                <DialogFooter className="p-6 bg-slate-50 border-t flex justify-between items-center">
                                                    <div className="text-[11px] text-slate-400 font-medium italic">
                                                        Editável nas primeiras 24h após a gravação.
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <Button variant="outline" onClick={() => setIsTranscriptionModalOpen(false)}>
                                                            Descartar Edição
                                                        </Button>
                                                        <Button
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 font-bold"
                                                            onClick={() => {
                                                                setCurrentRecord((prev: any) => ({
                                                                    ...prev,
                                                                    content: { ...prev.content, voice_transcript: tempTranscriptionText }
                                                                }))
                                                                setIsTranscriptionModalOpen(false)
                                                                toast.success("Edição aplicada!")
                                                            }}
                                                        >
                                                            Aplicar Alterações
                                                        </Button>
                                                    </div>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        {(selectedTemplateId === PHYSICAL_ASSESSMENT_ID || selectedTemplate?.title === 'Avaliação Física Avançada') ? (
                                            <AdvancedPhysicalForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                hideHeader
                                                hideButtons
                                            />
                                        ) : (selectedTemplateId === TREE_WIZARD_ID) ? (
                                            <AdvancedSmartAssessment
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                            />
                                        ) : (selectedTemplateId === ULTIMATE_PBE_ID) ? (
                                            <UltimatePBEForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                patient={patient}
                                                professional={appointment?.profiles}
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
                                            />
                                        ) : (selectedTemplateId === CLINICAL_EVOLUTION_ID) ? (
                                            <FisioterapiaEvolutionForm
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                attendanceId={appointment.id}
                                                onSave={handlePhysicalAssessmentSave}
                                            />
                                        ) : (selectedTemplateId === PALMILHA_V3_ID) ? (

                                            <PalmilhaFormV3
                                                initialData={currentRecord?.content}
                                                patientId={patient.id}
                                                onSave={handlePhysicalAssessmentSave}
                                                patient={patient}
                                                organization={{}}
                                                professional={professionals?.[0]}
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
                                                    initialContent={currentRecord.content || {}
                                                    }
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
                                        className="bg-white hover:bg-slate-50 transition-all duration-300 border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md cursor-pointer group relative overflow-hidden"
                                        onClick={() => setViewRecord(rec)}
                                    >
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={(e) => handleDeleteRecord(rec.id, e)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <CardHeader className="p-3 pb-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-tighter bg-indigo-50 text-indigo-700 border-indigo-100">
                                                    {rec.content?._record_type || (rec.template_id ? 'Avaliação' : 'Evolução')}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 font-medium pr-6">
                                                    {rec.created_at ? format(new Date(rec.created_at), "HH:mm") : '--:--'}
                                                </span>
                                            </div>
                                            <CardTitle className="text-[11px] font-bold text-slate-700">
                                                {rec.created_at ? format(new Date(rec.created_at), "dd/MM/yyyy") : 'Data N/D'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-1 text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">
                                            {(rec.content && typeof rec.content === 'object') ? (
                                                rec.content._record_type === 'Trilha Inteligente IA' ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-indigo-600">QP: {rec.content.qp}</span>
                                                        <span className="line-clamp-1">HMA: {rec.content.hma}</span>
                                                    </div>
                                                ) : (
                                                    rec.content.evolution_text ||
                                                    rec.content.voice_transcript ||
                                                    rec.content.observations ||
                                                    (typeof rec.content.plan === 'string' ? rec.content.plan : null) ||
                                                    rec.content.qp ||
                                                    'Registro clínico realizado'
                                                )
                                            ) : '...'}
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
                    showLoading("Finalizando Atendimento...")
                    try {
                        // Ensure the current record is saved before finishing attendance
                        await saveAttendanceRecord({
                            appointment_id: appointment.id,
                            patient_id: patient.id,
                            template_id: selectedTemplateId,
                            content: currentRecord?.content || {},
                            record_id: currentRecord?.id,
                            record_type: mode || 'evolution'
                        }, slug)

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
                    } finally {
                        hideLoading()
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

            <FocusModeEvolution
                isOpen={isFocusMode}
                onClose={() => setIsFocusMode(false)}
                data={currentRecord?.content}
                onUpdate={handleFocusUpdate}
                onSave={handleFocusSave}
                templateType={selectedTemplateId === PHYSICAL_ASSESSMENT_ID || selectedTemplate?.title === 'Avaliação Física Avançada' || selectedTemplateId === SMART_ASSESSMENT_ID ? 'smart' : 'default'}
            />

        </div>
    )
}
