import { useState, useEffect } from 'react'
import { Calendar, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { scheduleFollowup } from '../actions/followup'
import { getTemplates } from '@/app/dashboard/settings/communication/actions'
import { useRouter } from 'next/navigation'

interface ScheduleFollowupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    templateId: string
    templateTitle: string
    originalAssessmentId?: string
}

export function ScheduleFollowupDialog({
    open,
    onOpenChange,
    patientId,
    templateId,
    templateTitle,
    originalAssessmentId,
}: ScheduleFollowupDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [scheduledDate, setScheduledDate] = useState('')
    const [scheduledTime, setScheduledTime] = useState('09:00')
    const [customMessage, setCustomMessage] = useState('')

    // Template Selection State
    const [messageTemplates, setMessageTemplates] = useState<any[]>([])
    const [selectedMessageTemplateId, setSelectedMessageTemplateId] = useState<string>('')

    useEffect(() => {
        if (open) {
            getTemplates().then(data => {
                setMessageTemplates(data || [])
            })
        }
    }, [open])

    const handleTemplateSelect = (templateId: string) => {
        const template = messageTemplates.find(t => t.id === templateId)
        if (template) {
            setSelectedMessageTemplateId(templateId)
            setCustomMessage(template.content)
        }
    }

    const handleSchedule = async () => {
        if (!scheduledDate) {
            toast.error('Selecione uma data para o envio')
            return
        }

        setLoading(true)
        try {
            const scheduledFor = `${scheduledDate}T${scheduledTime}:00`

            const result = await scheduleFollowup({
                patientId,
                templateId,
                originalAssessmentId,
                scheduledFor,
                customMessage: customMessage || undefined,
            })

            if (result.success) {
                toast.success('Follow-up agendado com sucesso!')
                onOpenChange(false)
                router.refresh()

                // Reset form
                setScheduledDate('')
                setScheduledTime('09:00')
                setCustomMessage('')
                setSelectedMessageTemplateId('')
            } else {
                toast.error(result.error || 'Erro ao agendar follow-up')
            }
        } catch (error) {
            console.error('Error scheduling follow-up:', error)
            toast.error('Erro inesperado ao agendar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Agendar Follow-up</DialogTitle>
                    <DialogDescription>
                        Agende o reenvio do questionário <strong>{templateTitle}</strong> para o paciente preencher novamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Data de Envio</Label>
                            <Input
                                id="date"
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="time">Hora de Envio</Label>
                            <Input
                                id="time"
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Modelo de Mensagem (WhatsApp)</Label>
                        <Select value={selectedMessageTemplateId} onValueChange={handleTemplateSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {messageTemplates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="message">Mensagem Personalizada</Label>
                        <Textarea
                            id="message"
                            placeholder="Ex: Olá! Gostaríamos que você preenchesse novamente este questionário..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            Você pode editar o texto acima após selecionar um modelo.
                        </p>
                    </div>

                    {scheduledDate && (
                        <div className="rounded-lg bg-muted p-3 text-sm flex gap-3 items-start">
                            <Clock className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-medium text-slate-900 leading-none">Agendamento de Envio:</p>
                                <p className="text-muted-foreground">
                                    Será enviado em <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('pt-BR')}</strong> às <strong>{scheduledTime}</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSchedule} disabled={loading || !scheduledDate}>
                        {loading ? 'Agendando...' : 'Agendar Envio'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
