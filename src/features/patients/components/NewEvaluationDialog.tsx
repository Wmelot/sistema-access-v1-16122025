'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'
import { startNewAttendance } from '@/app/dashboard/[slug]/patients/actions/start-attendance'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

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
    const { activeAttendanceId } = useActiveAttendance()
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string
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
                const fallback: any[] = fallbackData || []
                const filtered = fallback.filter((t: any) => !SCORED_QUESTIONNAIRE_TITLES.includes(t.title))
                setTemplates(filtered)
            } else {
                toast.error('Erro ao carregar modelos')
                console.error(error)
            }
        } else {
            // Filter out scored questionnaires
            const items: any[] = data || []
            const filtered = items.filter(t => !SCORED_QUESTIONNAIRE_TITLES.includes(t.title))
            setTemplates(filtered)
        }
    }

    const handleStart = async () => {
        if (!selectedTemplate) return

        setLoading(true)

        try {
            const res = await startNewAttendance(patientId, slug, {
                templateId: selectedTemplate,
                recordType: type
            })

            if (res.error === 'ALREADY_IN_ATTENDANCE') {
                setLoading(false)
                const confirm = await MySwal.fire({
                    title: 'Atenção!',
                    html: `Você já está atendendo <b>${res.patientName}</b>.<br/>Deseja encerrar o anterior e iniciar este?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, iniciar este',
                    cancelButtonText: 'Manter anterior',
                    confirmButtonColor: '#ff9800',
                })

                if (confirm.isConfirmed) {
                    setLoading(true)
                    const { finishAttendance } = await import("@/actions/attendance")
                    await finishAttendance(res.activeId!, { appointment_id: res.activeId!, content: {} }, slug as string)

                    const retry = await startNewAttendance(patientId, slug, {
                        templateId: selectedTemplate,
                        recordType: type
                    })
                    if (retry.success) {
                        toast.success('Iniciando atendimento...')
                        setOpen(false)
                        router.push(`/dashboard/${slug}/attendance/${retry.appointmentId}?mode=${type}`)
                    } else {
                        toast.error(retry.msg || 'Erro ao iniciar.')
                    }
                }
                setLoading(false)
                return
            }

            if (res.success && res.appointmentId) {
                toast.success('Iniciando atendimento...')
                setOpen(false)
                router.push(`/dashboard/${slug}/attendance/${res.appointmentId}?mode=${type}`)
            } else {
                toast.error(res.msg || 'Erro ao iniciar atendimento')
                setLoading(false)
            }

        } catch (error) {
            console.error(error)
            toast.error('Erro inesperado.')
            setLoading(false)
        }
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    if (!mounted) {
        // Return trigger only (uncontrolled) or null?
        return !noTrigger ? (children ? <>{children}</> : <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />{type === 'evolution' ? 'Nova Evolução' : 'Nova Avaliação'}</Button>) : null
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
