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

💳 *PIX para pagamento:*
${settings?.pix_key || 'Não configurado'}

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
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-primary" />
                        Realizar Fechamento Mensal
                    </DialogTitle>
                    <DialogDescription>
                        Revise os atendimentos pendentes e envie o resumo de cobrança via WhatsApp.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Buscando atendimentos não faturados...</p>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-900">Tudo em dia!</p>
                            <p className="text-sm text-muted-foreground px-12">Nenhum atendimento no status 'Atendido' sem fatura foi encontrado para este mês.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden grid md:grid-cols-2 gap-0 border-t">
                        <div className="border-r flex flex-col bg-slate-50/30">
                            <div className="p-4 border-b bg-white flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">{patients.length} pacientes encontrados</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => setSelectedIds(selectedIds.length === patients.length ? [] : patients.map(p => p.id))}
                                >
                                    {selectedIds.length === patients.length ? "Desselecionar Todos" : "Selecionar Todos"}
                                </Button>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-3">
                                    {patients.map((patient) => (
                                        <div
                                            key={patient.id}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3 ${selectedIds.includes(patient.id) ? "bg-white border-primary/50 shadow-sm ring-1 ring-primary/10" : "bg-transparent border-slate-200 opacity-70"
                                                }`}
                                            onClick={() => togglePatient(patient.id)}
                                        >
                                            <Checkbox
                                                id={`patient-${patient.id}`}
                                                checked={selectedIds.includes(patient.id)}
                                                onCheckedChange={() => togglePatient(patient.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-bold text-slate-900">{patient.name}</span>
                                                    <span className="text-sm font-bold text-green-700">R$ {patient.total_amount.toFixed(2)}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {patient.total_sessions} {patient.total_sessions === 1 ? 'atendimento' : 'atendimentos'} pendentes
                                                </p>
                                                <div className="pt-2 flex flex-wrap gap-1">
                                                    {patient.details.map((d: any, i: number) => (
                                                        <span key={i} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                                                            {d.date}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="flex flex-col">
                            <div className="p-4 border-b">
                                <span className="text-sm font-bold text-slate-700">Modelo da Mensagem</span>
                            </div>
                            <div className="flex-1 p-4 flex flex-col gap-4">
                                <Textarea
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    className="flex-1 min-h-[300px] font-mono text-xs p-3 bg-slate-50 border-slate-200 focus:bg-white resize-none"
                                />
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                                        As variáveis <strong>{"{{nome}}"}</strong>, <strong>{"{{detalhamento}}"}</strong>, <strong>{"{{total}}"}</strong>, etc., serão substituídas automaticamente para cada paciente.
                                    </p>
                                </div>
                                <div className="space-y-3 pt-4 border-t">
                                    <Label className="text-sm font-bold text-slate-700">Forma de Recebimento</Label>
                                    <RadioGroup
                                        className="grid grid-cols-2 gap-4"
                                        value={paymentMethod}
                                        onValueChange={(v: any) => setPaymentMethod(v)}
                                    >
                                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                                            <RadioGroupItem value="pix" id="pix" />
                                            <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                                                <QrCode className="h-4 w-4 text-green-600" />
                                                <span>PIX Estático (Chave)</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                                            <RadioGroupItem value="asaas" id="asaas" />
                                            <Label htmlFor="asaas" className="flex items-center gap-2 cursor-pointer">
                                                <CreditCard className="h-4 w-4 text-blue-600" />
                                                <span>Asaas (Link/Boleto)</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        {paymentMethod === 'pix'
                                            ? "Usa a chave PIX configurada na clínica. Reconciliação manual."
                                            : "Gera links individuais. Baixa automática no sistema via Webhook."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="p-6 border-t bg-slate-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading || fetching || patients.length === 0}
                        className="gap-2 px-8 py-6 text-base font-bold shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        {loading ? "Processando..." : `Enviar p/ ${selectedIds.length} Pacientes`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
