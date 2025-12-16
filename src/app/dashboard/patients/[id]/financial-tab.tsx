"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createInvoice } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { InvoiceDetailsDialog } from "../components/invoice-details-dialog"

interface Appointment {
    id: string
    start_time: string
    price: number
    status: string
    services: { name: string } | { name: string }[] | null
    profiles: { full_name: string } | { full_name: string }[] | null
}

interface Invoice {
    id: string
    total: number
    status: string
    payment_method: string
    payment_date: string
    created_at: string
}

interface FinancialTabProps {
    patientId: string
    unbilledAppointments: any[] // Relaxing strictness here to avoid excessive casting issues
    invoices: any[]
    fees: any[] // Dynamic fees from DB
}

export function FinancialTab({ patientId, unbilledAppointments, invoices, fees }: FinancialTabProps) {
    const [selectedApps, setSelectedApps] = useState<string[]>([])
    const [paymentMethod, setPaymentMethod] = useState("pix")
    const [installments, setInstallments] = useState("1")
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)

    // Helper to extract name safely
    const getServiceName = (app: any) => {
        if (Array.isArray(app.services)) return app.services[0]?.name
        return app.services?.name
    }

    const getProfileName = (app: any) => {
        if (Array.isArray(app.profiles)) return app.profiles[0]?.full_name
        return app.profiles?.full_name
    }

    // Calculate Total & Fees
    const totalSelected = unbilledAppointments
        .filter(app => selectedApps.includes(app.id))
        .reduce((sum, app) => sum + (app.price || 0), 0)

    const [activeFeeRate, setActiveFeeRate] = useState<number>(0)

    // Determine Default Rate based on selection from DB
    const getFeeFromDB = () => {
        if (paymentMethod === 'pix') {
            const fee = fees.find(f => f.method === 'pix')
            return fee?.fee_percent || 0
        }
        if (paymentMethod === 'debit_card') {
            const fee = fees.find(f => f.method === 'debit_card')
            return fee?.fee_percent || 0
        }
        if (paymentMethod === 'credit_card') {
            const inst = parseInt(installments)
            const fee = fees.find(f => f.method === 'credit_card' && f.installments === inst)
            return fee?.fee_percent || 0
        }
        return 0
    }

    // Update active rate when selection changes
    useEffect(() => {
        setActiveFeeRate(getFeeFromDB())
    }, [paymentMethod, installments, fees])

    const feeAmount = totalSelected * (activeFeeRate / 100)
    const netValue = totalSelected - feeAmount

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedApps(unbilledAppointments.map(app => app.id))
        } else {
            setSelectedApps([])
        }
    }

    const handleGenerateInvoice = async () => {
        if (selectedApps.length === 0) {
            toast.error("Selecione pelo menos um agendamento.")
            return
        }

        setLoading(true)

        const result = await createInvoice(
            patientId,
            selectedApps,
            totalSelected,
            paymentMethod, // Pass the key (credit_card, pix, etc)
            paymentDate,
            Number(installments),
            activeFeeRate
        )

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Fatura gerada com sucesso!")
            setSelectedApps([])
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {/* --- SEÇÃO: Contas a Pagar / Pendentes --- */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Contas a Pagar (Agendamentos Pendentes)</CardTitle>
                        <CardDescription>
                            Selecione os atendimentos realizados para gerar a cobrança (Baixa).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={unbilledAppointments.length > 0 && selectedApps.length === unbilledAppointments.length}
                                            onCheckedChange={(c) => handleSelectAll(!!c)}
                                        />
                                    </TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Profissional</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unbilledAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                            Nenhum agendamento pendente.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    unbilledAppointments.map(app => (
                                        <TableRow key={app.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedApps.includes(app.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) setSelectedApps([...selectedApps, app.id])
                                                        else setSelectedApps(selectedApps.filter(id => id !== app.id))
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(app.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell>{getServiceName(app) || '-'}</TableCell>
                                            <TableCell>{getProfileName(app) || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.price || 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* --- ACTIONS FOOTER --- */}
                        {unbilledAppointments.length > 0 && (
                            <div className="mt-4 p-4 bg-muted/20 rounded-lg border space-y-4">
                                <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                                    <div className="flex gap-4 items-end flex-wrap">
                                        <div className="space-y-2 w-[180px]">
                                            <Label>Forma de Pagamento</Label>
                                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pix">Pix</SelectItem>
                                                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                    <SelectItem value="cash">Dinheiro</SelectItem>
                                                    <SelectItem value="transfer">Transferência</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {paymentMethod === 'credit_card' && (
                                            <div className="space-y-2 w-[140px]">
                                                <Label>Parcelas</Label>
                                                <Select value={installments} onValueChange={setInstallments}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                                            <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <div className="space-y-2 w-[100px]">
                                            <Label>Taxa (%)</Label>
                                            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                                                {activeFeeRate.toFixed(2)}%
                                            </div>
                                        </div>

                                        <div className="space-y-2 w-[150px]">
                                            <Label>Data Pagamento</Label>
                                            <Input
                                                type="date"
                                                value={paymentDate}
                                                onChange={(e) => setPaymentDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-right space-y-1 min-w-[200px]">
                                        <div className="text-sm text-muted-foreground">Total Bruto</div>
                                        <div className="text-lg font-semibold text-foreground">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelected)}
                                        </div>

                                        {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card' || activeFeeRate > 0) && (
                                            <>
                                                <div className="text-xs text-red-500 mt-1">
                                                    - Taxa ({activeFeeRate.toFixed(2)}%): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(feeAmount)}
                                                </div>
                                                <div className="border-t my-2 pt-1">
                                                    <div className="text-sm text-muted-foreground">Valor Líquido</div>
                                                    <div className="text-xl font-bold text-green-600">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netValue)}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="pt-2">
                                            <Button
                                                onClick={handleGenerateInvoice}
                                                disabled={loading || totalSelected === 0}
                                                className="w-full"
                                            >
                                                {loading ? 'Gerando...' : 'Confirmar Baixa'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- SEÇÃO: Histórico de Faturas --- */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Histórico Financeiro</CardTitle>
                        <CardDescription>
                            Faturas geradas e pagamentos recebidos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                            Nenhum histórico encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map(inv => (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                {format(new Date(inv.payment_date || inv.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {inv.payment_method === 'credit_card' ? 'Cartão Crédito' : inv.payment_method}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-xs">
                                                    {inv.status === 'paid' ? 'Pago' : inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.total)}
                                            </TableCell>
                                            <TableCell>
                                                <InvoiceDetailsDialog invoice={inv} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
