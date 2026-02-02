"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, DollarSign, CreditCard } from "lucide-react"
import { updateAppointmentStatus } from "@/actions/appointments"
import { useParams } from "next/navigation"

interface ReceivePaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: any
    onSuccess: () => void
}

export function ReceivePaymentDialog({ open, onOpenChange, appointment, onSuccess }: ReceivePaymentDialogProps) {
    const params = useParams()
    const slug = params.slug
    const [loading, setLoading] = useState(false)
    const [methods, setMethods] = useState<any[]>([])
    const [brands, setBrands] = useState<any[]>([])
    const [fees, setFees] = useState<any[]>([])
    const [acquirers, setAcquirers] = useState<any[]>([])

    const [selectedMethod, setSelectedMethod] = useState<string>("")
    const [selectedBrand, setSelectedBrand] = useState<string>("")
    const [installments, setInstallments] = useState<number>(1)
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [selectedAcquirer, setSelectedAcquirer] = useState<string>("")

    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchOptions()
            if (appointment) {
                // Default method logic
                const methodName = appointment.payment_methods?.name?.toLowerCase() || ''
                if (methodName.includes('pix')) setSelectedMethod('9d9bbd08-4d05-4669-afd4-37210420b546')
                else if (methodName.includes('credito')) setSelectedMethod('5534c52e-630c-4455-9292-83d159ee29c8')
                else if (methodName.includes('debito')) setSelectedMethod('6752ba83-7942-4383-a1a7-1b747b750dc5')
                else setSelectedMethod('2f31e744-047c-40a7-9a5d-fc499fd5582d') // Dinheiro
            }
        }
    }, [open, appointment])

    async function fetchOptions() {
        const [{ data: m }, { data: b }, { data: f }, { data: a }] = await Promise.all([
            supabase.from('payment_methods').select('id, name').order('name'),
            supabase.from('card_brands').select('id, name').order('name'),
            supabase.from('payment_method_fees').select('*, acquirer:payment_acquirers(id, name)'),
            supabase.from('payment_acquirers').select('id, name').eq('active', true)
        ])
        setMethods(m || [])
        setBrands(b || [])
        setFees(f || [])
        setAcquirers(a || [])
    }

    const methodType = methods.find(m => m.id === selectedMethod)?.name?.toLowerCase()
    const isCard = methodType?.includes('cartão')
    const isCredit = methodType?.includes('crédito')

    // Recommendation Logic
    const recommendations = isCard ? acquirers.map(acq => {
        const methodKey = isCredit ? 'credit_card' : 'debit_card'
        // Find matching fee
        const fee = fees.find(f =>
            f.acquirer_id === acq.id &&
            f.method === methodKey &&
            f.installments === (isCredit ? installments : 1) &&
            (f.card_brand_id === selectedBrand || !f.card_brand_id)
        )

        const feePercent = fee?.fee_percent || 0
        const feeFixed = fee?.fee_fixed || 0

        const netValue = (appointment.price * (1 - (feePercent / 100))) - feeFixed

        return {
            id: acq.id,
            name: acq.name,
            fee: feePercent,
            fixed: feeFixed,
            net: netValue,
            hasFee: !!fee
        }
    })
        .filter(r => r.hasFee || methodType?.includes('pix') || methodType?.includes('dinheiro'))
        .sort((a, b) => b.net - a.net) : []

    const bestAcquirer = recommendations[0]

    // [AUTO-SELECT] Update selected acquirer when payment params change
    useEffect(() => {
        if (bestAcquirer) {
            setSelectedAcquirer(bestAcquirer.id)
        }
    }, [selectedMethod, selectedBrand, installments, bestAcquirer?.id])

    async function handleConfirm() {
        if (!selectedMethod) {
            toast.error("Selecione a forma de pagamento")
            return
        }

        setLoading(true)
        try {
            const res = await updateAppointmentStatus(appointment.id, 'paid', {
                method: selectedMethod,
                cardBrandId: isCard ? selectedBrand : undefined,
                installments: isCard ? installments : 1,
                acquirerId: isCard ? selectedAcquirer : undefined,
                feePercent: isCard ? recommendations.find(r => r.id === selectedAcquirer)?.fee : undefined,
                feeFixed: isCard ? recommendations.find(r => r.id === selectedAcquirer)?.fixed : undefined,
                date: paymentDate
            }, slug as string)

            if (res.error) {
                toast.error(res.error)
            } else {
                // If acquirer was selected, we might want to record it in the invoice too
                // For now, updateAppointmentStatus doesn't take acquirerId, but it handles sync
                toast.success("Pagamento registrado com sucesso!")
                onSuccess()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error("Erro ao processar: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!appointment) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        Registrar Recebimento
                    </DialogTitle>
                    <DialogDescription>
                        Confirme os detalhes do pagamento para {appointment.patients?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border">
                        <span className="text-xs text-slate-500 uppercase font-bold">Valor a Receber</span>
                        <span className="text-xl font-bold text-emerald-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price)}
                        </span>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="method">Forma de Pagamento</Label>
                        <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                            <SelectTrigger id="method">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {methods.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isCard && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="brand">Bandeira do Cartão</Label>
                                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                                    <SelectTrigger id="brand">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isCredit && (
                                <div className="grid gap-2">
                                    <Label htmlFor="installments">Parcelas</Label>
                                    <Input
                                        id="installments"
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={installments}
                                        onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="acquirer">Maquininha (Receber por...)</Label>
                                <Select value={selectedAcquirer} onValueChange={setSelectedAcquirer}>
                                    <SelectTrigger id="acquirer">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {acquirers.map(acq => (
                                            <SelectItem key={acq.id} value={acq.id}>
                                                {acq.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {bestAcquirer && selectedAcquirer && (
                                    <div className={`flex flex-col gap-1 p-2.5 rounded-xl border transition-all mt-1 ${selectedAcquirer === bestAcquirer.id ? 'bg-emerald-50 border-emerald-200 outline outline-2 outline-emerald-500/20' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${selectedAcquirer === bestAcquirer.id ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                {selectedAcquirer === bestAcquirer.id ? (
                                                    <>
                                                        <span className="animate-pulse">✨</span>
                                                        Melhor Opção Escolhida
                                                    </>
                                                ) : (
                                                    <>
                                                        💡 Sugestão: {bestAcquirer.name}
                                                    </>
                                                )}
                                            </span>
                                            <div className="text-right">
                                                <div className={`font-mono font-bold ${selectedAcquirer === bestAcquirer.id ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                    Taxa: {recommendations.find(r => r.id === selectedAcquirer)?.fee.toFixed(2)}%
                                                </div>
                                                {recommendations.find(r => r.id === selectedAcquirer)?.fixed > 0 && (
                                                    <div className="text-[9px] text-slate-400">
                                                        + R$ {recommendations.find(r => r.id === selectedAcquirer)?.fixed.toFixed(2)} fixo
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pt-1 border-t border-black/5 mt-1">
                                            <span className="text-slate-500 font-medium">Você recebe (Líquido):</span>
                                            <span className={`font-bold ${selectedAcquirer === bestAcquirer.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recommendations.find(r => r.id === selectedAcquirer)?.net || 0)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="date">Data do Recebimento</Label>
                        <Input
                            id="date"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirmar Recebimento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
