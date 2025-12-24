"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getClinicSharedExpenses, getProfessionalPayments } from "./actions" // [NEW] // [NEW]
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Download, DollarSign, Wallet } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

export function MyStatementTab() {
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)) // YYYY-MM
    const supabase = createClient()

    const [permissions, setPermissions] = useState<string[]>([])
    const [sharedExpense, setSharedExpense] = useState(0)

    // Totals
    const [totals, setTotals] = useState({
        gross: 0,
        fees: 0,
        shared: 0, // [NEW]
        received: 0, // [NEW]
        net: 0,
        count: 0
    })

    useEffect(() => {
        // Init permissions
        const checkPerms = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userPerms } = await supabase
                    .from('role_permissions')
                    .select('permissions(code)')
                    .eq('role_id', (await supabase.from('profiles').select('role_id').eq('id', user.id).single()).data?.role_id)

                const codes = userPerms?.map((p: any) => p.permissions?.code) || []
                setPermissions(codes)
            }
        }
        checkPerms()
    }, [])

    useEffect(() => {
        fetchData()
    }, [selectedMonth, permissions])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Parse Month
            const [year, month] = selectedMonth.split('-')

            // Fetch Appointments
            const startStr = `${selectedMonth}-01T00:00:00`
            const nextMonth = new Date(parseInt(year), parseInt(month), 1).toISOString().slice(0, 7)
            const endStr = `${nextMonth}-01T00:00:00`

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    start_time,
                    patients(name),
                    price,
                    original_price,
                    discount,
                    addition,
                    status,
                    payment_methods (
                        name,
                        fee_percent,
                        fee_fixed
                    )
                `)
                .eq('professional_id', user.id)
                .gte('start_time', startStr)
                .lt('start_time', endStr)
                .in('status', ['completed', 'paid'])
                .order('start_time', { ascending: false })

            if (error) throw error

            setAppointments(data || [])

            // Fetch Shared Expenses if Partner
            let shared = 0
            if (permissions.includes('financial.share_expenses')) {
                const expenses = await getClinicSharedExpenses(parseInt(month), parseInt(year))
                shared = expenses || 0
            }

            // Fetch Received Payments
            const payments = await getProfessionalPayments(user.id, parseInt(month), parseInt(year))
            const receivedTotal = payments?.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0) || 0

            calculateTotals(data || [], shared, receivedTotal)

        } catch (error: any) {
            console.error(error)
            toast.error("Erro ao carregar extrato.")
        } finally {
            setLoading(false)
        }
    }

    const calculateTotals = (data: any[], sharedVal: number, receivedVal: number) => {
        let gross = 0
        let fees = 0
        let net = 0

        data.forEach(app => {
            const price = Number(app.price || 0)
            gross += price

            // Calculate Fee
            const method = app.payment_methods
            let appFee = 0
            if (method) {
                const pct = Number(method.fee_percent || 0)
                const fixed = Number(method.fee_fixed || 0)
                appFee = (price * pct / 100) + fixed
            }
            fees += appFee
            net += (price - appFee)
        })

        // Deduct Shared
        net = net - sharedVal

        setTotals({ gross, fees, shared: sharedVal, received: receivedVal, net, count: data.length })
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }

    // Generate Month Options (Last 12 months)
    const monthOptions = []
    for (let i = 0; i < 12; i++) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const val = d.toISOString().slice(0, 7)
        const label = format(d, 'MMMM yyyy', { locale: ptBR })
        monthOptions.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }

    return (
        <div className="space-y-4">
            {/* Header / Filter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => fetchData()}>
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Relatório PDF
                    </Button>
                    <Button onClick={() => toast.info("Solicitação de fechamento enviada para o financeiro.")}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Realizar Fechamento
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produção Bruta</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totals.gross)}</div>
                        <p className="text-xs text-muted-foreground">
                            {totals.count} atendimentos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxas (Maquininha)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            - {formatCurrency(totals.fees)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Deduções de taxas de pagamento
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Líquido a Receber</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.net)}</div>
                        <p className="text-xs text-muted-foreground mr-1">
                            Valor final estimado
                        </p>
                        {totals.shared > 0 && <span className="text-[10px] text-red-500 font-semibold">(Abatido R$ {totals.shared.toFixed(2)} de custos)</span>}
                    </CardContent>
                </Card>
            </div>

            {/* Breakdowns */}
            <div className="grid gap-4 md:grid-cols-2">
                {totals.shared > 0 && (
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="py-2">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Rateio de Custos (Sócio)</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Despesas Gerais da Clínica (1/3)</span>
                                <span className="text-red-600 font-bold">- {formatCurrency(totals.shared)}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {totals.received > 0 && (
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="py-2">
                            <CardTitle className="text-xs font-semibold text-green-700 uppercase">Adiantamentos / Pagamentos</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Já Recebido (Pix/Folha)</span>
                                <span className="text-green-700 font-bold">{formatCurrency(totals.received)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 border-t border-green-200 pt-2">
                                <span className="text-sm font-bold">Saldo Restante</span>
                                <span className="text-green-900 font-bold text-lg">{formatCurrency(totals.net - totals.received)}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* List */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Forma Pagto</TableHead>
                            <TableHead className="text-right">Valor Bruto</TableHead>
                            <TableHead className="text-right">Taxa</TableHead>
                            <TableHead className="text-right">Líquido</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum atendimento finalizado neste período.
                                </TableCell>
                            </TableRow>
                        ) : (
                            appointments.map(app => {
                                // Calc row values
                                const price = Number(app.price || 0)
                                const method = app.payment_methods
                                let appFee = 0
                                let feeDesc = '-'
                                if (method) {
                                    const pct = Number(method.fee_percent || 0)
                                    const fixed = Number(method.fee_fixed || 0)
                                    appFee = (price * pct / 100) + fixed
                                    feeDesc = `${method.name}`
                                    if (pct > 0) feeDesc += ` (${pct}%)`
                                    if (fixed > 0) feeDesc += ` + R$ ${fixed}`
                                }
                                const net = price - appFee

                                return (
                                    <TableRow key={app.id}>
                                        <TableCell>{format(new Date(app.start_time), 'dd/MM/yyyy HH:mm')}</TableCell>
                                        <TableCell>{app.patients?.name || 'Sem Nome'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{feeDesc}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(price)}</TableCell>
                                        <TableCell className="text-right text-red-600 text-xs">
                                            {appFee > 0 ? `- ${formatCurrency(appFee)}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-700">
                                            {formatCurrency(net)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
