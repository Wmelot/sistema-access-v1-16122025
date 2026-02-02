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
import { getAsaasConfig } from "@/app/dashboard/[slug]/settings/system/apis/actions"
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
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'asaas_all' | 'asaas_pix' | 'asaas_boleto'>('pix')
    const [asaasAvailable, setAsaasAvailable] = useState(false)

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
            const [data, settings, asaasConfig] = await Promise.all([
                getUnbilledPatients(),
                getClinicSettings(),
                getAsaasConfig(slug)
            ])
            setPatients(data)
            setSelectedIds(data.map(p => p.id))
            setClinicSettings(settings)
            setCustomMessage(defaultTemplate(settings))

            // Check if allowed by slug OR has own config
            const allowedSlugs = ['access-fisioterapia', 'axiom'];
            const isAuthorized = allowedSlugs.includes(slug) || (asaasConfig && asaasConfig.is_active);
            setAsaasAvailable(!!isAuthorized);

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
                            <p className="text-sm text-muted-foreground px-12">Nenhum atendimento pendente para este mês.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden grid md:grid-cols-2 gap-0 border-t border-slate-100">
                        {/* Left Column: List */}
                        <div className="flex flex-col border-r bg-slate-50/30 overflow-hidden">
                            <div className="p-3 border-b bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{patients.length} pacientes</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setSelectedIds(selectedIds.length === patients.length ? [] : patients.map(p => p.id))}
                                >
                                    {selectedIds.length === patients.length ? "Nenhum" : "Todos"}
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {patients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${selectedIds.includes(patient.id)
                                            ? "bg-white border-primary shadow-sm ring-1 ring-primary/10"
                                            : "bg-white/50 border-slate-200"
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
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-bold text-slate-900 truncate pr-2">{patient.name}</span>
                                                <span className="text-sm font-bold text-emerald-600 shrink-0">R$ {patient.total_amount.toFixed(2)}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {patient.total_sessions} atendimentos pendentes
                                            </p>
                                            <div className="pt-2 flex flex-wrap gap-1">
                                                {patient.details.slice(0, 2).map((d: any, i: number) => (
                                                    <span key={i} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200/50">
                                                        {d.service}...
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="flex flex-col bg-white overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Mensagem WhatsApp</Label>
                                        <span className="text-[10px] italic text-slate-400">Variáveis: {"{{nome}}"}, {"{{total}}"}</span>
                                    </div>
                                    <Textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        className="min-h-[250px] font-sans text-sm p-4 bg-slate-50 border-slate-200 focus:bg-white resize-none shadow-inner"
                                        placeholder="Olá {{nome}}, segue resumo..."
                                    />
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Forma de Recebimento</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            onClick={() => setPaymentMethod('pix')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-slate-50 ${paymentMethod === 'pix' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100'}`}
                                        >
                                            <QrCode className={`h-5 w-5 mb-1.5 ${paymentMethod === 'pix' ? 'text-primary' : 'text-slate-400'}`} />
                                            <span className="text-xs font-bold">PIX Direto</span>
                                            <span className="text-[9px] text-slate-400 font-normal text-center">Sua chave fixa</span>
                                        </div>

                                        {asaasAvailable && (
                                            <>
                                                <div
                                                    onClick={() => setPaymentMethod('asaas_all')}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-blue-50 ${paymentMethod === 'asaas_all' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-100'}`}
                                                >
                                                    <CreditCard className={`h-5 w-5 mb-1.5 ${paymentMethod === 'asaas_all' ? 'text-blue-600' : 'text-slate-400'}`} />
                                                    <span className="text-xs font-bold text-blue-700">Asaas (Todos)</span>
                                                    <span className="text-[9px] text-blue-400 font-normal text-center">PIX, Boleto, Cartão</span>
                                                </div>

                                                <div
                                                    onClick={() => setPaymentMethod('asaas_boleto')}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-indigo-50 ${paymentMethod === 'asaas_boleto' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100'}`}
                                                >
                                                    <div className="h-5 w-5 mb-1.5 flex items-center justify-center font-bold text-xs bg-indigo-100 text-indigo-600 rounded">B</div>
                                                    <span className="text-xs font-bold text-indigo-700">Asaas (Boleto)</span>
                                                    <span className="text-[9px] text-indigo-400 font-normal text-center">Fatura simples</span>
                                                </div>

                                                <div
                                                    onClick={() => setPaymentMethod('asaas_pix')}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-cyan-50 ${paymentMethod === 'asaas_pix' ? 'border-cyan-600 bg-cyan-50/50 shadow-sm' : 'border-slate-100'}`}
                                                >
                                                    <QrCode className={`h-5 w-5 mb-1.5 ${paymentMethod === 'asaas_pix' ? 'text-cyan-600' : 'text-slate-400'}`} />
                                                    <span className="text-xs font-bold text-cyan-700">Asaas (PIX)</span>
                                                    <span className="text-[9px] text-cyan-400 font-normal text-center">QR Code Dinâmico</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {!asaasAvailable && (
                                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-700 flex items-start gap-2">
                                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                            <span>Sua clínica ainda não configurou o Asaas. Vá em <strong>Gestão {'>'} Configurações {'>'} Integrações</strong> para habilitar pagamentos automáticos.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="p-4 border-t bg-slate-50/80 backdrop-blur-sm shrink-0">
                    <style jsx global>{`
                        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                    `}</style>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 font-medium">Cancelar</Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading || fetching || selectedIds.length === 0}
                        className="gap-2 px-8 min-w-[200px] shadow-lg shadow-primary/20 h-10 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {loading ? "Enviando..." : `Enviar para ${selectedIds.length}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
