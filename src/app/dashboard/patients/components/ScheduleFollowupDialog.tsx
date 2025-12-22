'use client'

import { useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
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
import { toast } from 'sonner'
import { scheduleFollowup } from '../actions/followup'
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

                    <div className="grid gap-2">
                        <Label htmlFor="message">Mensagem Personalizada (Opcional)</Label>
                        <Textarea
                            id="message"
                            placeholder="Ex: Olá! Gostaríamos que você preenchesse novamente este questionário para acompanharmos sua evolução."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {scheduledDate && (
                        <div className="rounded-lg bg-muted p-3 text-sm">
                            <p className="font-medium mb-1">Preview do envio:</p>
                            <p className="text-muted-foreground">
                                O paciente receberá um link via WhatsApp em{' '}
                                <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('pt-BR')}</strong>{' '}
                                às <strong>{scheduledTime}</strong> para preencher o questionário.
                            </p>
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
