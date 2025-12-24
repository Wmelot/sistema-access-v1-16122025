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
import { formatCurrency } from "@/lib/utils"
import { Loader2, CheckCircle2, AlertCircle, FileText, ChevronRight, Calculator } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { getCommissionsOverview, getProfessionalStatement, markCommissionsAsPaid } from "./actions"
import { getProfessionals } from "../professionals/actions"

export function PayrollTab() {
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
    const [year, setYear] = useState<number>(new Date().getFullYear())
    const [overview, setOverview] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [allProfessionals, setAllProfessionals] = useState<any[]>([])

    // Detail Dialog State
    const [selectedPro, setSelectedPro] = useState<any>(null)
    const [statement, setStatement] = useState<any[]>([])
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [processingPayment, setProcessingPayment] = useState(false)

    const [selectedProFilter, setSelectedProFilter] = useState("all")
    const [taxRate, setTaxRate] = useState<number>(0)
    const [otherDeductions, setOtherDeductions] = useState<number>(0)

    useEffect(() => {
        loadData()
    }, [month, year])

    const loadData = async () => {
        setLoading(true)
        const [overviewData, prosData] = await Promise.all([
            getCommissionsOverview(month, year),
            getProfessionals()
        ])
        setOverview(overviewData || [])
        setAllProfessionals(prosData || [])
        setLoading(false)
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

        if (!confirm(`Confirmar pagamento de ${pendingIds.length} itens?`)) return

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

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-2 w-[180px]">
                    <Label>Mês</Label>
                    <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                    {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 w-[120px]">
                    <Label>Ano</Label>
                    <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                </div>
                <div className="space-y-2 w-[220px]">
                    <Label>Filtrar Profissional</Label>
                    <Select value={selectedProFilter} onValueChange={setSelectedProFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {allProfessionals.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <Label className="text-base">Valor Bruto</Label>
                                        <div className="text-2xl font-semibold">{formatCurrency(pendingStatementTotal)}</div>
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
                                            - {formatCurrency(pendingStatementTotal * (taxRate / 100))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Valor Líquido</Label>
                                        <div className="text-3xl font-bold text-green-600 truncate">
                                            {formatCurrency(pendingStatementTotal - (pendingStatementTotal * (taxRate / 100)) - otherDeductions)}
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
                                        <TableHead>Data</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Valor Serviço</TableHead>
                                        <TableHead>Comissão</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {statement.map(appt => (
                                        <TableRow key={appt.id}>
                                            <TableCell>{new Date(appt.appointment.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{appt.appointment.patient?.name}</TableCell>
                                            <TableCell>{appt.appointment.service?.name}</TableCell>
                                            <TableCell>{formatCurrency(appt.appointment.price)}</TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(appt.amount)}</TableCell>
                                            <TableCell>
                                                {appt.status === 'paid' ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Pago em {new Date(appt.paid_at).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pendente
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
