import { useState, useEffect } from 'react'
import { Calendar, Clock, FileText, Send, Loader2, Sparkles, Smartphone } from 'lucide-react'
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
import { getTemplates } from '@/app/dashboard/[slug]/settings/communication/actions'
import { useRouter } from 'next/navigation'
import { DateInput } from '@/components/ui/date-input'
import { TimeInput } from '@/components/ui/time-input'
import { cn } from '@/lib/utils'

interface ScheduleFollowupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    templateId: string
    templateTitle: string
    originalAssessmentId?: string
    slug?: string
}

export function ScheduleFollowupDialog({
    open,
    onOpenChange,
    patientId,
    templateId,
    templateTitle,
    originalAssessmentId,
    slug
}: ScheduleFollowupDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [immediateLoading, setImmediateLoading] = useState(false)
    const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [scheduledTime, setScheduledTime] = useState('09:00')
    const [customMessage, setCustomMessage] = useState('')

    // Template Selection State
    const [messageTemplates, setMessageTemplates] = useState<any[]>([])
    const [selectedMessageTemplateId, setSelectedMessageTemplateId] = useState<string>('')

    useEffect(() => {
        if (open) {
            getTemplates(slug).then(data => {
                setMessageTemplates(data || [])
            })
        }
    }, [open, slug])

    const handleTemplateSelect = (templateId: string) => {
        const template = messageTemplates.find(t => t.id === templateId)
        if (template) {
            setSelectedMessageTemplateId(templateId)
            setCustomMessage(template.content)
        }
    }

    const handleSave = async (isImmediate = false) => {
        if (!isImmediate && !scheduledDate) {
            toast.error('Selecione uma data para o envio')
            return
        }

        if (isImmediate) setImmediateLoading(true)
        else setLoading(true)

        try {
            // If immediate, use now
            const scheduledFor = isImmediate
                ? new Date().toISOString()
                : `${scheduledDate}T${scheduledTime}:00`

            const result = await scheduleFollowup({
                patientId,
                templateId,
                originalAssessmentId,
                scheduledFor,
                customMessage: customMessage || undefined,
                slug
            })

            if (result.success) {
                toast.success(isImmediate ? 'Mensagem enviada com sucesso!' : 'Follow-up agendado com sucesso!')
                onOpenChange(false)
                router.refresh()

                // Reset form
                setScheduledDate(new Date().toISOString().split('T')[0])
                setScheduledTime('09:00')
                setCustomMessage('')
                setSelectedMessageTemplateId('')
            } else {
                toast.error(result.error || 'Erro ao processar solicitação')
            }
        } catch (error) {
            console.error('Error with follow-up:', error)
            toast.error('Erro inesperado ao salvar')
        } finally {
            setImmediateLoading(false)
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 border-none overflow-hidden rounded-[32px] shadow-2xl">
                <div className="bg-gradient-to-br from-indigo-50/50 to-white p-6 sm:p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 italic">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Follow-up Digital</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    Enviar questionário <strong>{templateTitle}</strong>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Agendamento */}
                        <div className="bg-white/60 backdrop-blur-sm p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quando enviar?</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 ml-1">Data de Envio</Label>
                                    <DateInput
                                        value={scheduledDate}
                                        onChange={setScheduledDate}
                                        className="h-12 rounded-xl bg-white border-slate-200"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 ml-1">Hora de Envio</Label>
                                    <TimeInput
                                        value={scheduledTime}
                                        onChange={setScheduledTime}
                                        className="h-12 rounded-xl bg-white border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mensagem */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 ml-1">Modelo de Mensagem</Label>
                                <Select value={selectedMessageTemplateId} onValueChange={handleTemplateSelect}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 shadow-sm">
                                        <SelectValue placeholder="Selecione um modelo de WhatsApp..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                        {messageTemplates.map((t) => (
                                            <SelectItem key={t.id} value={t.id} className="rounded-lg py-3">
                                                {t.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 ml-1">Texto do WhatsApp (Opcional)</Label>
                                <Textarea
                                    placeholder="Ex: Olá! Gostaríamos que você preenchesse novamente este questionário..."
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    rows={4}
                                    className="rounded-2xl bg-white border-slate-200 shadow-sm resize-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {scheduledDate && (
                            <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100/50 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                                <p className="text-[11px] font-medium text-indigo-700 leading-tight">
                                    Agendado para <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('pt-BR')}</strong> às <strong>{scheduledTime}</strong>. Link expira em 30 dias.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading || immediateLoading}
                            className="bg-slate-100 translate-all h-12 rounded-xl text-slate-600 font-bold flex-1"
                        >
                            Cancelar
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => handleSave(true)}
                            disabled={loading || immediateLoading}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 h-12 rounded-xl font-bold px-6 border border-emerald-100 flex-1 gap-2"
                        >
                            {immediateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            ENVIAR AGORA
                        </Button>

                        <Button
                            onClick={() => handleSave(false)}
                            disabled={loading || immediateLoading || !scheduledDate}
                            className="bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold px-6 shadow-xl shadow-slate-200 flex-1 gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                            AGENDAR ENVIO
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
