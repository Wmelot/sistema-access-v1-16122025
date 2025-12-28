'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FinancialTabProps {
    patientId: string
    unbilledAppointments: any[]
    invoices: any[]
    fees: any[]
}

export function FinancialTab({ patientId, unbilledAppointments = [], invoices = [], fees = [] }: FinancialTabProps) {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendentes de Faturamento</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{unbilledAppointments.length}</div>
                        <p className="text-xs text-muted-foreground">Agendamentos não cobrados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturas em Aberto</CardTitle>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {invoices.filter(i => i.status === 'pending').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {/* Simple count for now, real calc needs value sum */}
                            {invoices.filter(i => i.status === 'paid').length} Faturas
                        </div>
                        <p className="text-xs text-muted-foreground">Histórico de pagamentos</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Unbilled List */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Agendamentos Pendentes</CardTitle>
                        <CardDescription>Atendimentos realizados mas não cobrados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {unbilledAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {unbilledAppointments.slice(0, 5).map(appt => (
                                    <div key={appt.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-medium">Consulta/Sessão</div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(appt.start_time), "dd/MM/yyyy HH:mm")}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/dashboard/financial/invoices/new?appointmentId=${appt.id}`}>
                                                Gerar Fatura
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={CheckCircle}
                                title="Tudo Faturado"
                                description="Todos os atendimentos foram cobrados."
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Invoices List */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Últimas Faturas</CardTitle>
                        <CardDescription>Histórico de cobranças.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invoices.length > 0 ? (
                            <div className="space-y-4">
                                {invoices.slice(0, 5).map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-medium">Fatura #{inv.id.slice(0, 8)}</div>
                                            <Badge variant={inv.status === 'paid' ? 'default' : (inv.status === 'pending' ? 'secondary' : 'destructive')}>
                                                {inv.status === 'paid' ? 'Pago' : 'Pendente'}
                                            </Badge>
                                        </div>
                                        <div className="font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.amount || 0)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={FileText}
                                title="Nenhuma fatura"
                                description="Nenhum registro financeiro encontrado."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


