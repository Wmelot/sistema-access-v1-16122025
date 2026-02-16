"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { PercentageInput } from "@/components/ui/percentage-input" // [NEW]
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, cn } from "@/lib/utils"
import { Loader2, CheckCircle2, AlertCircle, FileText, ChevronRight, Calculator, ArrowUpDown, ArrowUp, ArrowDown, Printer, History } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
import { getCommissionsOverview, getProfessionalStatement, markCommissionsAsPaid, getMonthlyConfigs, saveMonthlyConfigs } from "./actions"
import { getProfessionals } from "../professionals/actions"

import { useParams } from "next/navigation"

export function PayrollTab() {
    const params = useParams()
    const slug = params.slug as string
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
    const [year, setYear] = useState<number>(new Date().getFullYear())
    const [overview, setOverview] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [allProfessionals, setAllProfessionals] = useState<any[]>([])
    const [monthlyExpenses, setMonthlyExpenses] = useState(0) // [NEW]

    // Detail Dialog State
    const [selectedPro, setSelectedPro] = useState<any>(null)
    const [statement, setStatement] = useState<any[]>([])
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [processingPayment, setProcessingPayment] = useState(false)

    const [selectedProFilter, setSelectedProFilter] = useState("all")
    const [taxRate, setTaxRate] = useState<number>(0) // Monthly Tax Rate
    const [otherDeductions, setOtherDeductions] = useState<number>(0)
    const [savingConfigs, setSavingConfigs] = useState(false)

    useEffect(() => {
        loadData()
    }, [month, year])

    const loadData = async () => {
        setLoading(true)
        const { getCommissionsOverview, getMonthlyExpenses } = await import("./actions") // Lazy import to avoid cycle if any
        const [overviewData, prosData, expensesTotal, configs] = await Promise.all([
            getCommissionsOverview(month, year),
            getProfessionals(slug),
            getMonthlyExpenses(month, year), // [NEW]
            getMonthlyConfigs(month, year)
        ])
        setOverview(overviewData || [])
        setAllProfessionals(prosData || [])
        setMonthlyExpenses(expensesTotal || 0)

        if (configs) {
            setTaxRate(Number(configs.tax_rate) || 0)
            setOtherDeductions(Number(configs.other_deductions) || 0)
        } else {
            setTaxRate(0)
            setOtherDeductions(0)
        }

        setLoading(false)
    }

    const handleSaveGlobalConfigs = async () => {
        setSavingConfigs(true)
        const res = await saveMonthlyConfigs(month, year, { tax_rate: taxRate, other_deductions: otherDeductions })
        setSavingConfigs(false)
        if (res.error) toast.error(res.error)
        else toast.success("Configurações do mês salvas!")
    }

    // Filter Logic
    const filteredOverview = overview.filter(item => {
        if (selectedProFilter === "all") return true
        return item.professional.id === selectedProFilter
    })



    const openDetails = async (proItem: any) => {
        setSelectedPro(proItem)
        setIsDialogOpen(true)
        setLoadingDetails(true)
        const data = await getProfessionalStatement(proItem.professional.id, month, year)
        setStatement(data || [])
        setLoadingDetails(false)
    }

    const handlePayAllPending = async () => {
        if (!selectedPro) return
        const pendingIds = statement.filter(i => i.status === 'pending').map(i => i.id)

        if (pendingIds.length === 0) {
            toast.info("Não há valores pendentes para pagar.")
            return
        }

        const result = await MySwal.fire({
            title: 'Confirmar Pagamento?',
            text: `Deseja registrar o pagamento de ${pendingIds.length} itens para este profissional?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, confirmar pagamento',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return

        setProcessingPayment(true)
        const res = await markCommissionsAsPaid(pendingIds)
        setProcessingPayment(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Pagamento registrado!")
            // Refresh
            const updatedStatement = await getProfessionalStatement(selectedPro.professional.id, month, year)
            setStatement(updatedStatement || [])
            loadData()
        }
    }

    const totalPending = filteredOverview.reduce((acc, curr) => acc + curr.totalPending, 0)
    const totalPaid = filteredOverview.reduce((acc, curr) => acc + curr.totalPaid, 0)

    const pendingStatementItems = statement.filter(i => i.status === 'pending')
    const pendingStatementTotal = pendingStatementItems.reduce((acc, curr) => acc + Number(curr.amount), 0)
    const pendingGrossTotal = pendingStatementItems.reduce((acc, curr) => acc + Number(curr.appointment?.price || 0), 0)

    // Sorting for Statement
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

    const sortedStatement = [...statement].sort((a, b) => {
        if (!sortConfig) return 0

        let aValue: any = ''
        let bValue: any = ''

        const apptA = a.appointment
        const apptB = b.appointment

        switch (sortConfig.key) {
            case 'date':
                aValue = new Date(apptA.date).getTime()
                bValue = new Date(apptB.date).getTime()
                break
            case 'patient':
                aValue = apptA.patient?.name || ''
                bValue = apptB.patient?.name || ''
                break
            case 'service':
                aValue = apptA.service?.name || ''
                bValue = apptB.service?.name || ''
                break
            case 'gross':
                aValue = Number(apptA.price || 0)
                bValue = Number(apptB.price || 0)
                break
            case 'fee':
                aValue = Number(apptA.feeAmount || 0)
                bValue = Number(apptB.feeAmount || 0)
                break
            case 'net_base':
                aValue = Number(apptA.netPrice || 0)
                bValue = Number(apptB.netPrice || 0)
                break
            case 'commission':
                aValue = Number(a.amount || 0)
                bValue = Number(b.amount || 0)
                break
            case 'status':
                aValue = a.status
                bValue = b.status
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
        <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mês</Label>
                    <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger className="bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="bottom" position="popper">
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                    {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ano</Label>
                    <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-white" />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filtrar Profissional</Label>
                    <div className="flex gap-2">
                        <Select value={selectedProFilter} onValueChange={setSelectedProFilter}>
                            <SelectTrigger className="bg-white flex-1">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper">
                                <SelectItem value="all">Todos</SelectItem>
                                {allProfessionals.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" title="Ver Histórico Global" onClick={() => MySwal.fire({
                            title: 'Histórico de Pagamentos',
                            text: 'As comissões marcadas como "Pago" ficam registradas permanentemente no banco de dados e podem ser consultadas filtrando o mês/ano desejado ou através do relatório contábil.',
                            icon: 'info'
                        })}>
                            <History className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendente (Mês)</CardTitle>
                        <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pago (Mês)</CardTitle>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-slate-500">Despesas (Por Sócio / 3)</CardTitle>
                        <div className="text-2xl font-bold text-slate-700" title={`Total: ${formatCurrency(monthlyExpenses)}`}>
                            {formatCurrency(monthlyExpenses / 3)}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Total do mês: {formatCurrency(monthlyExpenses)}</p>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-50 border-slate-200 shadow-sm">
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Imposto Mensal (%)</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="py-2 space-y-3">
                        <PercentageInput
                            value={taxRate}
                            onValueChange={setTaxRate}
                            placeholder="0%"
                            className="bg-white"
                        />
                        <Button
                            size="sm"
                            className="w-full h-8 text-[11px] gap-2"
                            onClick={handleSaveGlobalConfigs}
                            disabled={savingConfigs}
                        >
                            {savingConfigs ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Salvar p/ este Mês
                        </Button>
                        <p className="text-[10px] text-muted-foreground">Este valor será sugerido no extrato de todos os profissionais para o mês de {month}/{year}.</p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Folha de Pagamento</CardTitle>
                    <CardDescription>Comissões geradas por atendimentos concluídos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : overview.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
                            <p>Nenhuma comissão registrada para este período.</p>
                            <p className="text-sm max-w-md text-balance">
                                Para gerar pagamentos, verifique se os profissionais possuem <strong>regras de comissão</strong> configuradas e se há atendimentos marcados como <strong>Concluído</strong>.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Profissional</TableHead>
                                    <TableHead>Atendimentos</TableHead>
                                    <TableHead>Pendente</TableHead>
                                    <TableHead>Pago</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOverview.map((item) => (
                                    <TableRow key={item.professional.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(item)}>
                                        <TableCell className="font-medium flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={item.professional.photo_url} />
                                                <AvatarFallback>{item.professional.full_name[0]}</AvatarFallback>
                                            </Avatar>
                                            {item.professional.full_name}
                                        </TableCell>
                                        <TableCell>{item.items}</TableCell>
                                        <TableCell className="text-yellow-600 font-semibold">{formatCurrency(item.totalPending)}</TableCell>
                                        <TableCell className="text-green-600">{formatCurrency(item.totalPaid)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                Ver Detalhes <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-y-auto w-full">
                    <DialogHeader>
                        <DialogTitle>Extrato: {selectedPro?.professional.full_name}</DialogTitle>
                        <DialogDescription>
                            Período: {month}/{year}
                        </DialogDescription>
                    </DialogHeader>

                    {loadingDetails ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-4 p-6 bg-muted/30 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

                                    <div className="space-y-2">
                                        <Label className="text-base">Valor Bruto (Produção)</Label>
                                        <div className="text-2xl font-semibold">{formatCurrency(pendingGrossTotal)}</div>
                                        <div className="text-xs text-muted-foreground">Comissão: {formatCurrency(pendingStatementTotal)}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Alíquota (%)</Label>
                                        <PercentageInput
                                            value={taxRate}
                                            onValueChange={setTaxRate}
                                            className="bg-white text-lg h-12 w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Outros Descontos</Label>
                                        <CurrencyInput
                                            value={otherDeductions}
                                            onValueChange={(val) => setOtherDeductions(val || 0)}
                                            className="bg-white text-lg h-12 w-full"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Valor do Imposto</Label>
                                        <div className="text-2xl font-semibold text-red-500 truncate">
                                            - {formatCurrency(pendingGrossTotal * (taxRate / 100))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Valor Líquido</Label>
                                        <div className="text-3xl font-bold text-green-600 truncate">
                                            {formatCurrency(pendingStatementTotal - (pendingGrossTotal * (taxRate / 100)) - otherDeductions)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={handlePayAllPending}
                                        disabled={pendingStatementTotal <= 0 || processingPayment}
                                        className="gap-2 h-12 px-6 text-base"
                                    >
                                        {processingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                        Confirmar Pagamento
                                    </Button>
                                </div>
                            </div>

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
                                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('service')}>
                                            <div className="flex items-center gap-1">
                                                Serviço
                                                {sortConfig?.key === 'service' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                                {sortConfig?.key !== 'service' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('gross')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Valor Bruto
                                                {sortConfig?.key === 'gross' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                                {sortConfig?.key !== 'gross' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('fee')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Taxa (Maq.)
                                                {sortConfig?.key === 'fee' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                                {sortConfig?.key !== 'fee' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('net_base')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Liq. Base
                                                {sortConfig?.key === 'net_base' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                                {sortConfig?.key !== 'net_base' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center">Regra</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('commission')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Comissão
                                                {sortConfig?.key === 'commission' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                                {sortConfig?.key !== 'commission' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('status')}>
                                            <div className="flex items-center gap-1">
                                                Status
                                                {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                                {sortConfig?.key !== 'status' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedStatement.map(item => {
                                        const appt = item.appointment
                                        const isPaid = item.status === 'paid'
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>{new Date(appt.date).toLocaleDateString()}</TableCell>
                                                <TableCell className={cn("flex items-center gap-2", appt.isDeleted && "text-red-500 font-bold")}>
                                                    {appt.isDeleted && <AlertCircle className="h-3 w-3" title={`Justificativa: ${appt.justification}`} />}
                                                    {appt.patient?.name}
                                                </TableCell>
                                                <TableCell>{appt.service?.name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(appt.price)}</TableCell>
                                                <TableCell className="text-right text-red-500 text-xs font-medium">
                                                    {appt.feeAmount > 0 ? (
                                                        <span title={`${appt.paymentMethodName || 'Taxa'}`}>
                                                            -{formatCurrency(appt.feeAmount)}
                                                        </span>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(appt.netPrice)}
                                                </TableCell>
                                                <TableCell className="text-center text-xs text-muted-foreground">
                                                    {appt.ruleApplied}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                                                <TableCell>
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Pago em {new Date(item.paid_at).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Pendente
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
