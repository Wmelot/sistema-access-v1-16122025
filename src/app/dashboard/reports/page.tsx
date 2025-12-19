import { Suspense } from "react"
import { getFinancialReport, getProfessionalsList } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, CheckCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
// import { DateRangePicker } from "@/components/ui/date-range-picker" // Assuming exists or consistent Date Input
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import DateFilter from "./date-filter" // Client Component for filters
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
export const dynamic = 'force-dynamic'

export default async function ReportsPage({ searchParams }: {
    searchParams: { startDate?: string, endDate?: string, professionalId?: string, status?: string }
}) {
    // defaults: this month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const sDate = searchParams.startDate || firstDay
    const eDate = searchParams.endDate || lastDay
    const profId = searchParams.professionalId || "all"

    const [report, professionals] = await Promise.all([
        getFinancialReport({ startDate: sDate, endDate: eDate, professionalId: profId, status: searchParams.status }),
        getProfessionalsList()
    ])

    const { totals, data } = report

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
                <p className="text-muted-foreground">
                    Visão completa do faturamento, recebimentos e pendências.
                </p>
            </div>

            {/* Filter Bar */}
            <DateFilter
                startDate={sDate}
                endDate={eDate}
                professionalId={profId}
                professionals={professionals}
            />

            {/* Tabs Structure */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="debtors" className="gap-2">
                        Pendências
                        {(report.debtors?.length || 0) > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5 rounded-full text-[10px]">
                                {report.debtors?.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Faturado (Período)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totals.billed)}</div>
                                <p className="text-xs text-muted-foreground">Considerando todos os atendimentos</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-600">Total Recebido</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.received)}</div>
                                <p className="text-xs text-muted-foreground">Atendimentos concluídos com pagamento</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-600">Pendente / A Receber</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
                                <p className="text-xs text-muted-foreground">Atendimentos sem pagamento registrado</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* General Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhamento de Atendimentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Profissional</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status Visual</TableHead>
                                        <TableHead>Pagamento</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((appt: any) => (
                                        <TableRow key={appt.id}>
                                            <TableCell>{format(new Date(appt.start_time), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell className="font-medium">{appt.patients?.name}</TableCell>
                                            <TableCell>{appt.profiles?.full_name}</TableCell>
                                            <TableCell>{appt.services?.name}</TableCell>
                                            <TableCell>{formatCurrency(appt.price)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    appt.payment_status === 'paid' ? "bg-green-50 text-green-700 border-green-200" :
                                                        appt.payment_status === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                                            "bg-slate-50 text-slate-700"
                                                }>
                                                    {appt.payment_status === 'paid' ? 'Pago' :
                                                        appt.payment_status === 'pending' ? 'Pendente' : 'Agendado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{appt.payment_methods?.name || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Nenhum registro encontrado neste período.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="debtors" className="space-y-4">
                    <Card className="border-yellow-200 bg-yellow-50/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-800">
                                <AlertCircle className="h-5 w-5" />
                                Lista de Inadimplência / Pendências
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Pacientes com atendimentos finalizados ("Atendido") mas sem pagamento registrado no período selecionado.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Qtd. Pendências</TableHead>
                                        <TableHead className="text-right">Total Devido</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(report.debtors || []).map((debtor: any) => (
                                        <TableRow key={debtor.patientId}>
                                            <TableCell className="font-bold">{debtor.patientName}</TableCell>
                                            <TableCell>{debtor.count} atendimentos</TableCell>
                                            <TableCell className="text-right font-bold text-red-600 text-lg">
                                                {formatCurrency(debtor.totalDebt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={`/dashboard/patients?search=${encodeURIComponent(debtor.patientName)}`} target="_blank" rel="noopener noreferrer">
                                                        Ver Histórico
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(report.debtors?.length || 0) === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                Nenhuma pendência encontrada neste período. 🎉
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
