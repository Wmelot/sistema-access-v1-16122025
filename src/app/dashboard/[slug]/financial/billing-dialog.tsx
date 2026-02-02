"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, UserPlus, AlertCircle, QrCode, CreditCard } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { getUnbilledPatients, createBillingCampaign } from "@/app/dashboard/[slug]/marketing/actions"
import { getClinicSettings } from "@/app/dashboard/[slug]/settings/actions"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BillingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    slug: string
}

export function BillingDialog({ open, onOpenChange, slug }: BillingDialogProps) {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [patients, setPatients] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [customMessage, setCustomMessage] = useState("")
    const [clinicSettings, setClinicSettings] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'asaas'>('pix')

    const defaultTemplate = (settings: any) => `Olá {{nome}},

Segue o resumo dos atendimentos realizados este mês:

{{detalhamento}}

📊 *Total de sessões:* {{total_sessoes}}
💰 *Valor total:* R$ {{total}}

💳 *Pagamento:*
{{pix_key}}

Qualquer dúvida, estou à disposição!

Atenciosamente,
${settings?.name || 'Access Fisioterapia'}`

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open])

    async function fetchData() {
        setFetching(true)
        try {
            const [data, settings] = await Promise.all([
                getUnbilledPatients(),
                getClinicSettings()
            ])
            setPatients(data)
            setSelectedIds(data.map(p => p.id))
            setClinicSettings(settings)
            setCustomMessage(defaultTemplate(settings))
        } catch (error) {
            toast.error("Erro ao carregar pacientes para fechamento.")
        } finally {
            setFetching(false)
        }
    }

    const togglePatient = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    async function handleSend() {
        if (selectedIds.length === 0) {
            toast.error("Selecione pelo menos um paciente.")
            return
        }

        setLoading(true)
        try {
            const result = await createBillingCampaign(selectedIds, customMessage, paymentMethod)

            if (result.success) {
                toast.success("Campanha de cobrança iniciada via WhatsApp!")
                onOpenChange(false)
            } else {
                toast.error(`Erro ao enviar: ${result.error}`)
            }
        } catch (error: any) {
            toast.error(`Erro crítico: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Realizar Fechamento Mensal
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Revise os atendimentos e envie o resumo de cobrança via WhatsApp.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Buscando atendimentos...</p>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-900">Tudo em dia!</p>
                            <p className="text-sm text-muted-foreground px-12">Nenhum atendimento pendente.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden grid md:grid-cols-2 gap-0">
                        {/* Left Column: List */}
                        <div className="flex flex-col border-r bg-slate-50/50">
                            <div className="p-3 border-b bg-white flex justify-between items-center shadow-sm z-10">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{patients.length} pacientes</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setSelectedIds(selectedIds.length === patients.length ? [] : patients.map(p => p.id))}
                                >
                                    {selectedIds.length === patients.length ? "Nenhum" : "Todos"}
                                </Button>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-3 space-y-2">
                                    {patients.map((patient) => (
                                        <div
                                            key={patient.id}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3 ${selectedIds.includes(patient.id) ? "bg-white border-primary/50 shadow-md ring-1 ring-primary/5" : "bg-white/50 border-slate-200"
                                                }`}
                                            onClick={() => togglePatient(patient.id)}
                                        >
                                            <Checkbox
                                                id={`patient-${patient.id}`}
                                                checked={selectedIds.includes(patient.id)}
                                                onCheckedChange={() => togglePatient(patient.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm font-bold text-slate-900">{patient.name}</span>
                                                    <span className="text-sm font-bold text-green-700 bg-green-50 px-1.5 rounded">R$ {patient.total_amount.toFixed(2)}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {patient.total_sessions} atendimentos pendentes
                                                </p>
                                                <div className="pt-1 flex flex-wrap gap-1">
                                                    {patient.details.map((d: any, i: number) => (
                                                        <span key={i} className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-500 border border-slate-200">
                                                            {d.service.substring(0, 15)}...
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="flex flex-col bg-white h-full overflow-hidden">
                            <ScrollArea className="flex-1 h-full">
                                {/* Added h-full and removed outer flex column reliance if any, to ensure scroll triggers */}
                                <div className="p-4 flex flex-col gap-6">

                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Mensagem</Label>
                                        <Textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            className="min-h-[200px] font-mono text-xs p-3 bg-slate-50 border-slate-200 focus:bg-white resize-y"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Variáveis: <strong>{"{{nome}}"}</strong>, <strong>{"{{total}}"}</strong>, <strong>{"{{pix_key}}"}</strong>
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Pagamento via</Label>
                                        <RadioGroup
                                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                                            value={paymentMethod}
                                            onValueChange={(v: any) => setPaymentMethod(v)}
                                        >
                                            <Label
                                                htmlFor="pix"
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-slate-100'}`}
                                            >
                                                <RadioGroupItem value="pix" id="pix" className="sr-only" />
                                                <QrCode className={`h-6 w-6 mb-2 ${paymentMethod === 'pix' ? 'text-primary' : 'text-slate-400'}`} />
                                                <span className="text-xs font-bold">PIX Direto</span>
                                            </Label>

                                            <Label
                                                htmlFor="asaas"
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-blue-50 ${paymentMethod === 'asaas' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
                                            >
                                                <RadioGroupItem value="asaas" id="asaas" className="sr-only" />
                                                <CreditCard className={`h-6 w-6 mb-2 ${paymentMethod === 'asaas' ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <span className="text-xs font-bold text-blue-700">Asaas / Boleto</span>
                                            </Label>
                                        </RadioGroup>
                                    </div>

                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}

                <DialogFooter className="p-4 border-t bg-slate-50">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading || fetching || patients.length === 0}
                        className="gap-2 px-6 shadow-xl"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {loading ? "Enviando..." : `Enviar para ${selectedIds.length}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
