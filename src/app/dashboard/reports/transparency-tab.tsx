'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertCircle } from "lucide-react"

interface Expense {
    id: string
    description: string
    amount: number
    due_date: string
    date?: string
    status: string
}

export default function TransparencyTab({ expenses }: { expenses: Expense[] }) {
    if (!expenses || expenses.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Transparência Financeira
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Nenhuma despesa registrada no período.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Resumo de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(totalExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total de despesas registradas
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Data de Pagamento</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">
                                        {expense.description}
                                    </TableCell>
                                    <TableCell className="text-red-600 font-semibold">
                                        {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell>
                                        {expense.due_date
                                            ? format(new Date(expense.due_date), "dd/MM/yyyy", { locale: ptBR })
                                            : expense.date
                                                ? format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })
                                                : '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={expense.status === 'paid' ? 'default' : 'destructive'}>
                                            {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
