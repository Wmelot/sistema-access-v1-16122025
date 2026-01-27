"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getClinicSharedExpenses, getProfessionalPayments, getPaymentFees } from "./actions" // [NEW] // [NEW]
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
import { CalendarIcon, Download, DollarSign, Wallet, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
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
                    .eq('role_id', (await supabase.from('profiles').select('role_id').eq('id', user.id as string).single()).data?.role_id as any)

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
            if (!user) {
                // If user is not logged in, we should not proceed with fetching data.
                // The component's main render will handle displaying a login message.
                // For this function, we just stop execution.
                setLoading(false);
                return;
            }

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
                        name
                    )
                `)
                .eq('professional_id', user.id)
                .gte('start_time', startStr)
                .lt('start_time', endStr)
                .in('status', ['completed', 'paid'])
                .order('start_time', { ascending: false })

            if (error) throw error

            // Fetch All Fees for calculation
            const feesList = await getPaymentFees()

            // Enrich Appointments with Fee Data
            const enrichedData = (data || []).map(app => {
                const price = Number(app.price || 0)
                const methodName = app.payment_methods?.name?.toLowerCase() || ''
                let methodSlug = ''
                if (methodName.includes('pix')) methodSlug = 'pix'
                else if (methodName.includes('crédito') || methodName.includes('credito')) methodSlug = 'credit_card'
                else if (methodName.includes('débito') || methodName.includes('debito')) methodSlug = 'debit_card'
                else if (methodName.includes('dinheiro')) methodSlug = 'cash'

                let appFee = 0
                let feeDesc = '-'
                if (methodSlug) {
                    const feeRule = feesList.find((f: any) => f.method === methodSlug)
                    if (feeRule) {
                        const pct = Number(feeRule.fee_percent || 0)
                        const fixed = Number(feeRule.fee_fixed || 0)
                        appFee = (price * pct / 100) + fixed
                        feeDesc = `${app.payment_methods?.name}`
                        if (pct > 0) feeDesc += ` (${pct}%)`
                        if (fixed > 0) feeDesc += ` + R$ ${fixed}`
                    }
                }
                return { ...app, appFee, feeDesc }
            })

            setAppointments(enrichedData)

            // Fetch Shared Expenses if Partner
            let shared = 0
            if (permissions.includes('financial.share_expenses')) {
                const expenses = await getClinicSharedExpenses(parseInt(month), parseInt(year))
                shared = expenses || 0
            }

            // Fetch Received Payments
            const payments = await getProfessionalPayments(user.id as string, parseInt(month), parseInt(year))
            const receivedTotal = payments?.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0) || 0

            calculateTotals(enrichedData, shared, receivedTotal)

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
            const appFee = Number(app.appFee || 0)
            gross += price
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

    // Sorting Logic
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

    const sortedAppointments = [...appointments].sort((a, b) => {
        if (!sortConfig) return 0

        let aValue: any = ''
        let bValue: any = ''

        switch (sortConfig.key) {
            case 'date':
                aValue = new Date(a.start_time).getTime()
                bValue = new Date(b.start_time).getTime()
                break
            case 'patient':
                aValue = a.patients?.name || ''
                bValue = b.patients?.name || ''
                break
            case 'method':
                aValue = a.payment_methods?.name || ''
                bValue = b.payment_methods?.name || ''
                break
            case 'gross':
                aValue = Number(a.price || 0)
                bValue = Number(b.price || 0)
                break
            case 'net':
                // Net needs calculation here or map first. Efficiency? 
                // Let's do simple recalc for sort
                const getNet = (item: any) => {
                    const p = Number(item.price || 0)
                    const m = item.payment_methods
                    let f = 0
                    if (m) f = (p * (Number(m.fee_percent) || 0) / 100) + (Number(m.fee_fixed) || 0)
                    return p - f
                }
                aValue = getNet(a)
                bValue = getNet(b)
                break
            default:
                return 0
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    return (
        <div className="space-y-4">
            {/* Header / Filter */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="flex-1 md:w-[180px]">
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
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => window.print()} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Relatório PDF
                    </Button>
                    <Button onClick={() => toast.info("Solicitação de fechamento enviada para o financeiro.")} className="flex-1">
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
            <div className="rounded-md border bg-white overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('date')}>
                                    <div className="flex items-center gap-1">
                                        Data
                                        {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                        {sortConfig?.key !== 'date' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('patient')}>
                                    <div className="flex items-center gap-1">
                                        Paciente
                                        {sortConfig?.key === 'patient' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                        {sortConfig?.key !== 'patient' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('method')}>
                                    <div className="flex items-center gap-1">
                                        Forma Pagto
                                        {sortConfig?.key === 'method' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                        {sortConfig?.key !== 'method' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('gross')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Valor Bruto
                                        {sortConfig?.key === 'gross' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                        {sortConfig?.key !== 'gross' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Taxa</TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('net')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Líquido
                                        {sortConfig?.key === 'net' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                        {sortConfig?.key !== 'net' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAppointments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum atendimento finalizado neste período.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedAppointments.map(app => {
                                    const price = Number(app.price || 0)
                                    const appFee = Number(app.appFee || 0)
                                    const feeDesc = app.feeDesc || '-'
                                    const net = price - appFee

                                    return (
                                        <TableRow key={app.id}>
                                            <TableCell className="whitespace-nowrap">{format(new Date(app.start_time), 'dd/MM/yyyy HH:mm')}</TableCell>
                                            <TableCell className="font-medium text-slate-800">{app.patients?.name || 'Sem Nome'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{feeDesc}</TableCell>
                                            <TableCell className="text-right whitespace-nowrap">{formatCurrency(price)}</TableCell>
                                            <TableCell className="text-right text-red-600 text-xs whitespace-nowrap">
                                                {appFee > 0 ? `- ${formatCurrency(appFee)}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-green-700 whitespace-nowrap">
                                                {formatCurrency(net)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {sortedAppointments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50/50">
                            Nenhum atendimento este mês.
                        </div>
                    ) : (
                        sortedAppointments.map(app => {
                            const price = Number(app.price || 0)
                            const appFee = Number(app.appFee || 0)
                            const net = price - appFee
                            return (
                                <div key={app.id} className="p-4 space-y-3 bg-white active:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                {format(new Date(app.start_time), 'dd/MM/yyyy • HH:mm')}
                                            </div>
                                            <div className="font-bold text-slate-900">{app.patients?.name || 'Sem Nome'}</div>
                                            <div className="text-[11px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded inline-block w-auto">
                                                {app.feeDesc || '-'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-green-700">{formatCurrency(net)}</div>
                                            <div className="text-[10px] text-slate-400 line-through">{formatCurrency(price)}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] border-t border-dashed pt-2 bg-slate-50 -mx-4 px-4 -mb-4 pb-2">
                                        <span className="text-slate-500 font-medium">Taxa Maquininha</span>
                                        <span className="text-red-600 font-bold">-{formatCurrency(appFee)}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
