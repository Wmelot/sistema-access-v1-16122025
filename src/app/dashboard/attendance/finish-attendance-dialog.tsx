"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, DollarSign, FileText, Calendar as CalendarIcon, Printer, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { createInvoice } from "@/app/dashboard/patients/actions" // Re-use logic
import { createAppointment } from "@/app/dashboard/schedule/actions"
import { CurrencyInput } from "@/components/ui/currency-input"
import { getAvailableSlots } from "@/app/dashboard/schedule/actions"
import { getReportTemplates } from "@/app/dashboard/settings/reports/actions"
import { ReportViewer } from "@/components/reports/ReportViewer" // [NEW]

interface FinishAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: any
    patient: any
    recordId?: string
    onConfirm: () => void
    paymentMethods?: any[]
    professionals?: any[]
}

export function FinishAttendanceDialog({ open, onOpenChange, appointment, patient, recordId, onConfirm, paymentMethods = [], professionals = [] }: FinishAttendanceDialogProps) {
    const [step, setStep] = useState<"finance" | "report" | "schedule">("finance")

    // Report State
    const [templates, setTemplates] = useState<any[]>([])
    const [viewingTemplate, setViewingTemplate] = useState<any>(null)

    // Fetch Templates on Mount
    useEffect(() => {
        getReportTemplates().then(setTemplates)
    }, [])

    const handleReportSelect = (template: any) => {
        setViewingTemplate(template)
    }

    // Finance State
    const [price, setPrice] = useState<number>(appointment.price || 0)
    const [paymentMethod, setPaymentMethod] = useState<string>("pix")
    const [isPaid, setIsPaid] = useState(false)
    const [isSavingFinance, setIsSavingFinance] = useState(false)
    const [installments, setInstallments] = useState(1)

    // Schedule State
    const [returnDate, setReturnDate] = useState<Date | undefined>(undefined)
    const [returnTime, setReturnTime] = useState("")
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(appointment.professional_id)
    const [referralReason, setReferralReason] = useState("") // [NEW]
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)

    // Reset on Open
    useEffect(() => {
        if (open) {
            setStep("finance")
            setPrice(appointment.price || 0)
            setReturnDate(undefined)
            setAvailableSlots([])
            setReturnTime("")
            setSelectedProfessionalId(appointment.professional_id)
        }
    }, [open, appointment])

    // Fetch Slots when Date or Professional Changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!returnDate || !selectedProfessionalId) return
            setIsLoadingSlots(true)
            try {
                const dateStr = format(returnDate, 'yyyy-MM-dd')
                const slots = await getAvailableSlots(selectedProfessionalId, dateStr)
                setAvailableSlots(slots)
            } catch (e) {
                console.error(e)
                toast.error("Erro ao buscar horários")
            } finally {
                setIsLoadingSlots(false)
            }
        }
        fetchSlots()
    }, [returnDate, selectedProfessionalId])


    // Check if Method is Credit Card
    const isCreditCard = useMemo(() => {
        const method = paymentMethods.find(m => m.id === paymentMethod) || paymentMethods.find(m => m.slug === paymentMethod)
        // Fallback checks if slug not available or ID mismatch
        if (!method) return paymentMethod === 'credit_card'
        return method.name.toLowerCase().includes('crédito') || method.slug === 'credit_card'
    }, [paymentMethod, paymentMethods])

    // --- Actions ---

    const handleSaveFinance = async () => {
        setIsSavingFinance(true)
        try {
            if (isPaid) {
                // Generate Invoice/Transaction
                const res = await createInvoice(
                    patient.id,
                    [appointment.id],
                    Number(price),
                    paymentMethod,
                    new Date().toISOString(),
                    installments
                )
                if (res.error) {
                    toast.error(res.error)
                    return
                }
                toast.success("Pagamento registrado!")
            }
            setStep("report")
        } catch (e) {
            toast.error("Erro ao salvar financeiro")
        } finally {
            setIsSavingFinance(false)
        }
    }

    const handleScheduleReturn = async () => {
        if (!returnDate || !returnTime) {
            toast.error("Selecione data e horário para o retorno")
            return
        }

        setIsScheduling(true)
        try {
            // Construct Date + Time
            const dateStr = format(returnDate, 'yyyy-MM-dd')
            const startDateTime = new Date(`${dateStr}T${returnTime}:00`)
            const endDateTime = new Date(startDateTime.getTime() + 45 * 60000) // Default 45min

            // Construct FormData for Server Action
            const formData = new FormData()
            formData.append('patient_id', patient.id)
            formData.append('professional_id', selectedProfessionalId) // [MODIFIED] Use selected
            if (appointment.location_id) formData.append('location_id', appointment.location_id)
            if (appointment.service_id) formData.append('service_id', appointment.service_id)

            formData.append('date', dateStr)
            formData.append('time', returnTime)

            // [NEW] Referral Reason
            if (selectedProfessionalId !== appointment.professional_id && referralReason) {
                formData.append('referral_reason', referralReason)
            }

            formData.append('start_time', startDateTime.toISOString())
            formData.append('end_time', endDateTime.toISOString())
            formData.append('notes', "Retorno agendado na finalização")
            formData.append('type', 'appointment')
            // Default recurring false
            formData.append('is_recurring', 'false')

            const res = await createAppointment(formData)

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Retorno agendado!")
                onConfirm() // Finalize everything
                onOpenChange(false)
            }
        } catch (e) {
            toast.error("Erro ao agendar retorno")
        } finally {
            setIsScheduling(false)
        }
    }

    const handleSkipSchedule = () => {
        onConfirm()
        onOpenChange(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {/* [MODIFIED] Max Width Increased as requested */}
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Finalizar Atendimento</DialogTitle>
                        <DialogDescription>
                            Complete as etapas para encerrar a sessão.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Steps Indicator */}
                        <div className="flex items-center justify-between mb-8 px-8 relative">
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10" />

                            <div className={`flex flex-col items-center gap-2 bg-white px-2 ${step === 'finance' ? 'text-primary' : (step === 'report' || step === 'schedule' ? 'text-green-600' : 'text-slate-400')}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'finance' ? 'border-primary bg-primary/10' : (step === 'report' || step === 'schedule' ? 'border-green-600 bg-green-100 text-green-600' : 'border-slate-200')}`}>
                                    {step === 'report' || step === 'schedule' ? <CheckCircle className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                </div>
                                <span className="text-xs font-semibold">Financeiro</span>
                            </div>

                            <div className={`flex flex-col items-center gap-2 bg-white px-2 ${step === 'report' ? 'text-primary' : (step === 'schedule' ? 'text-green-600' : 'text-slate-400')}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'report' ? 'border-primary bg-primary/10' : (step === 'schedule' ? 'border-green-600 bg-green-100 text-green-600' : 'border-slate-200')}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-semibold">Relatório</span>
                            </div>

                            <div className={`flex flex-col items-center gap-2 bg-white px-2 ${step === 'schedule' ? 'text-primary' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'schedule' ? 'border-primary bg-primary/10' : 'border-slate-200'}`}>
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-semibold">Retorno</span>
                            </div>
                        </div>

                        {/* Step 1: Finance */}
                        {step === 'finance' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Valor da Sessão</Label>
                                        <CurrencyInput
                                            value={price}
                                            onValueChange={(v) => setPrice(Number(v))}
                                            className="w-32 text-right font-bold text-lg bg-white"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Status do Pagamento</Label>
                                        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                                            <button
                                                onClick={() => setIsPaid(true)}
                                                className={`text-sm font-medium py-2 rounded-md transition-all ${isPaid
                                                    ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-500 hover:text-slate-700"}`}
                                            >
                                                Receber Agora
                                            </button>
                                            <button
                                                onClick={() => setIsPaid(false)}
                                                className={`text-sm font-medium py-2 rounded-md transition-all ${!isPaid
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-500 hover:text-slate-700"}`}
                                            >
                                                Deixar em Aberto
                                            </button>
                                        </div>
                                    </div>

                                    {isPaid && (
                                        <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <Label>Forma de Pagamento</Label>
                                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {paymentMethods.length > 0 ? (
                                                            paymentMethods.map(pm => (
                                                                <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <SelectItem value="pix">Pix</SelectItem>
                                                                <SelectItem value="money">Dinheiro</SelectItem>
                                                                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {isCreditCard && (
                                                <div className="space-y-2 animate-in fade-in">
                                                    <Label>Parcelas</Label>
                                                    <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                                                                <SelectItem key={i} value={String(i)}>{i}x</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Button onClick={handleSaveFinance} disabled={isSavingFinance} className="w-full">
                                    {isSavingFinance ? "Salvando..." : "Confirmar e Avançar"}
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Report */}
                        {step === 'report' && (
                            <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center py-2">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                    <h3 className="text-lg font-bold text-slate-800">Atendimento Registrado!</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                                    {templates.map(template => (
                                        <div
                                            key={template.id}
                                            className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer flex flex-col gap-2 transition-colors text-left"
                                            onClick={() => handleReportSelect(template)}
                                        >
                                            <div className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {template.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground uppercase">
                                                {template.type === 'standard' ? 'Relatório' :
                                                    template.type === 'certificate' ? 'Atestado' : 'Outro'}
                                            </div>
                                        </div>
                                    ))}
                                    {templates.length === 0 && (
                                        <div className="col-span-2 text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                                            Nenhum modelo de relatório encontrado.
                                            <br />
                                            <span className="text-xs">Configure em Configurações &gt; Relatórios.</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setStep('schedule')}>
                                        Pular / Próximo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Schedule */}
                        {step === 'schedule' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="border rounded-md p-2 bg-white shadow-sm flex-1 flex justify-center">
                                        <Calendar
                                            mode="single"
                                            selected={returnDate}
                                            onSelect={setReturnDate}
                                            locale={ptBR}
                                            disabled={(date) => date < new Date()}
                                            className="rounded-md border-0"
                                        />
                                    </div>
                                    <div className="space-y-6 flex-1 pt-2">
                                        <div className="space-y-2">
                                            <Label>Horário do Retorno</Label>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <Select value={returnTime} onValueChange={setReturnTime} disabled={!returnDate || isLoadingSlots}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={isLoadingSlots ? "Buscando..." : "Selecione horário"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableSlots.length > 0 ? (
                                                            availableSlots.map(time => (
                                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-xs text-center text-muted-foreground">
                                                                {returnDate ? "Sem horários livres" : "Selecione a data"}
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Profissional</Label>
                                            <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {professionals.length > 0 ? (
                                                        professionals.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value={appointment.professional_id}>
                                                            {appointment.profiles?.full_name || 'Profissional Atual'}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>


                                        {/* [NEW] Referral Reason */}
                                        {selectedProfessionalId !== appointment.professional_id && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <Label>Motivo do Encaminhamento</Label>
                                                <Textarea
                                                    value={referralReason}
                                                    onChange={(e) => setReferralReason(e.target.value)}
                                                    placeholder="Descreva o motivo do encaminhamento para o colega..."
                                                    className="h-20"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    O profissional receberá uma notificação com esta mensagem.
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-4 flex flex-col gap-2">
                                            <Button onClick={handleScheduleReturn} disabled={isScheduling || !returnDate || !returnTime} className="w-full">
                                                {isScheduling ? "Agendando..." : "Confirmar Agendamento"}
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={() => setStep('report')} className="flex-1">
                                                    Voltar
                                                </Button>
                                                <Button variant="ghost" onClick={handleSkipSchedule} className="flex-1">
                                                    Pular
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent >
            </Dialog >

            {/* REPORT VIEWER MODAL */}
            {
                viewingTemplate && (
                    <ReportViewer
                        template={viewingTemplate}
                        data={{
                            patient,
                            appointment,
                            professional_name: professionals.find(p => p.id === appointment.professional_id)?.name || 'Profissional',
                            record: {
                                cid: '',
                                form_data: {}
                            }
                        }}
                        onClose={() => setViewingTemplate(null)}
                    />
                )}
        </>
    )
}


