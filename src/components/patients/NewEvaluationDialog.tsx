'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { logAction } from '@/lib/logger'

interface NewEvaluationDialogProps {
    patientId: string
    patientName: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode // Custom trigger
    noTrigger?: boolean // [NEW] Option to hide trigger completely
    type?: 'assessment' | 'evolution' // [NEW] Distinguish types
}

export function NewEvaluationDialog({ patientId, patientName, open: controlledOpen, onOpenChange: setControlledOpen, children, noTrigger, type = 'assessment' }: NewEvaluationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    // List of scored questionnaires to exclude
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

    const fetchTemplates = async () => {
        let query = supabase
            .from('form_templates')
            .select('id, title, type')
            .eq('is_active', true)
            .order('title')

        if (type) {
            query = query.eq('type', type)
        }

        const { data, error } = await query

        if (error) {
            if (error.code === '42703') {
                const { data: fallbackData } = await supabase
                    .from('form_templates')
                    .select('id, title')
                    .eq('is_active', true)
                // Also filter fallback data
                const filtered = (fallbackData || []).filter((t: any) => !SCORED_QUESTIONNAIRE_TITLES.includes(t.title))
                setTemplates(filtered)
            } else {
                toast.error('Erro ao carregar modelos')
                console.error(error)
            }
        } else {
            // Filter out scored questionnaires
            const filtered = (data || []).filter(t => !SCORED_QUESTIONNAIRE_TITLES.includes(t.title))
            setTemplates(filtered)
        }
    }

    const handleStart = async () => {
        if (!selectedTemplate) return

        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('Usuário não autenticado')
            setLoading(false)
            return
        }

        try {
            // 1. Find a Service (preferably "Consulta")
            let serviceId = null;
            const { data: services } = await supabase
                .from('services')
                .select('id, name')
                .ilike('name', '%Consulta%')
                .limit(1)

            if (services && services.length > 0) {
                serviceId = services[0].id
            } else {
                // Fallback: any service
                const { data: anyService } = await supabase
                    .from('services')
                    .select('id')
                    .limit(1)
                if (anyService && anyService.length > 0) serviceId = anyService[0].id
            }

            // [FIX] Fetch Default Location
            let locationId = null;
            const { data: locations } = await supabase
                .from('locations')
                .select('id')
                .limit(1)

            if (locations && locations.length > 0) {
                locationId = locations[0].id
            }

            if (!serviceId) {
                toast.error('Nenhum serviço encontrado para criar o agendamento.')
                setLoading(false)
                return
            }

            // 2. Create Appointment (Status: In Progress)
            const now = new Date()
            const endTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour duration

            const { data: appointment, error: apptError } = await supabase
                .from('appointments')
                .insert({
                    patient_id: patientId,
                    professional_id: user.id,
                    service_id: serviceId,
                    location_id: locationId, // [FIX] Added location_id
                    // date: now.toISOString().split('T')[0], // derived column or unused? schedule/actions doesn't insert it.
                    start_time: now.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'confirmed', // 'in_progress' not allowed by DB constraint
                    notes: 'Avaliação iniciada via Prontuário', // notes instead of observation
                    type: 'appointment',
                    price: 0,
                    original_price: 0,
                    is_extra: true // Treat as "Encaixe" (Immediate)
                })
                .select()
                .single()

            if (apptError) {
                console.error("Error creating appointment:", apptError)
                toast.error(`Erro ao criar agendamento: ${apptError.message || apptError.code}`)
                setLoading(false)
                return
            }

            // 3. Fetch Template Snapshot
            const { data: templateData, error: templateFetchError } = await supabase
                .from('form_templates')
                .select('fields')
                .eq('id', selectedTemplate)
                .single()

            if (templateFetchError) {
                console.warn("Could not fetch template snapshot, proceeding without snapshot.")
            }

            // 4. Create Record (Linked to Appointment)
            // This ensures the Attendance page opens with the CORRECT template already selected.
            const { error: recordError } = await supabase
                .from('patient_records')
                .insert({
                    patient_id: patientId,
                    appointment_id: appointment.id,
                    template_id: selectedTemplate,
                    professional_id: user.id,
                    status: 'draft',
                    content: {},
                    template_snapshot: templateData?.fields || {},
                    record_type: type // 'assessment' or 'evolution'
                })

            if (recordError) {
                console.error("Error creating record:", recordError)
                toast.error('Erro ao preparar prontuário.')
                // We could still redirect, but better to stop?
                // Actually, if we redirect, the attendance page MIGHT try to create a record but won't know the template.
                setLoading(false)
                return
            }

            // 5. Log & Redirect
            await logAction("CREATE_APPOINTMENT_FROM_EVALUATION", { appointment_id: appointment.id, type }, 'appointment', appointment.id)

            toast.success('Iniciando atendimento...')
            setOpen(false)

            // Redirect to Attendance Page
            // Optionally pass ?mode=assessment if needed, but the attendance page logic handles mode mainly for tabs.
            // We pass mode to ensure the correct tab is highlighted?
            router.push(`/dashboard/attendance/${appointment.id}?mode=${type}`)

        } catch (error) {
            console.error(error)
            toast.error('Erro inesperado.')
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!noTrigger && (
                <DialogTrigger asChild>
                    {children ? children : (
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {type === 'evolution' ? 'Nova Evolução' : 'Nova Avaliação'}
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{type === 'evolution' ? 'Nova Evolução' : 'Nova Avaliação'}</DialogTitle>
                    <DialogDescription>
                        Iniciando avaliação para {patientName}. Selecione o modelo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="template">Modelo de Formulário</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger id="template">
                                <SelectValue placeholder="Selecione um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleStart} disabled={!selectedTemplate || loading}>
                        {loading ? 'Criando...' : 'Iniciar Avaliação'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
