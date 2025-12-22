"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface ReportsTableProps {
    data: any[]
}

type SortConfig = {
    key: string
    direction: 'asc' | 'desc'
} | null

export function ReportsTable({ data }: ReportsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const sortedData = [...data].sort((a, b) => {
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
            case 'professional':
                aValue = a.profiles?.full_name || ''
                bValue = b.profiles?.full_name || ''
                break
            case 'service':
                aValue = a.services?.name || ''
                bValue = b.services?.name || ''
                break
            case 'price':
                aValue = Number(a.price || 0)
                bValue = Number(b.price || 0)
                break
            case 'status':
                aValue = a.payment_status || ''
                bValue = b.payment_status || ''
                break
            case 'payment':
                aValue = a.payment_methods?.name || ''
                bValue = b.payment_methods?.name || ''
                break
            default:
                return 0
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
        if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
        return <ArrowDown className="ml-2 h-4 w-4" />
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('date')} className="hover:bg-transparent px-0">
                            Data <SortIcon columnKey="date" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('patient')} className="hover:bg-transparent px-0">
                            Paciente <SortIcon columnKey="patient" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('professional')} className="hover:bg-transparent px-0">
                            Profissional <SortIcon columnKey="professional" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('service')} className="hover:bg-transparent px-0">
                            Serviço <SortIcon columnKey="service" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('price')} className="hover:bg-transparent px-0">
                            Valor <SortIcon columnKey="price" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('status')} className="hover:bg-transparent px-0">
                            Status Visual <SortIcon columnKey="status" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('payment')} className="hover:bg-transparent px-0">
                            Pagamento <SortIcon columnKey="payment" />
                        </Button>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedData.map((appt: any) => (
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
                {sortedData.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Nenhum registro encontrado neste período.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
