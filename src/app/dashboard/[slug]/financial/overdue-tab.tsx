"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, MessageSquare, AlertTriangle, ExternalLink } from "lucide-react"
import { getOverdueInvoices } from "./actions"
import { format } from "date-fns"
import Link from "next/link"
import { ptBR } from "date-fns/locale"

export function OverdueTab({ slug }: { slug: string }) {
    const [overdue, setOverdue] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const data = await getOverdueInvoices()
        setOverdue(data || [])
        setLoading(false)
    }

    const filtered = overdue.filter(item =>
        item.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalDebt = filtered.reduce((acc, curr) => acc + Number(curr.total || 0), 0)

    const handleWhatsApp = (phone: string, name: string, amount: number) => {
        const cleanPhone = phone.replace(/\D/g, '')
        const message = encodeURIComponent(`Olá ${name.split(' ')[0]}, tudo bem? Passando para lembrar do acerto referente ao seu último atendimento no valor de R$ ${amount.toFixed(2)}. Qual seria a melhor forma para você?`)
        window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank')
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-50 border-red-100">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-red-600">Total Inadimplente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebt)}
                        </div>
                        <p className="text-xs text-red-500 mt-1">{filtered.length} Faturas pendentes</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Inadimplência</CardTitle>
                            <CardDescription>Pacientes com faturas vencidas ou não finalizadas.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar paciente..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Vencimento / Data</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Nenhum registro de inadimplência encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((item) => {
                                        const dateToDisplay = item.payment_date || item.appointment?.start_time || item.created_at
                                        const daysOverdue = Math.floor((new Date().getTime() - new Date(dateToDisplay).getTime()) / (1000 * 3600 * 24))

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{item.patient?.name}</span>
                                                        <span className="text-xs text-muted-foreground">{item.patient?.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{format(new Date(dateToDisplay), "dd 'de' MMMM", { locale: ptBR })}</span>
                                                        {daysOverdue > 0 && (
                                                            <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> {daysOverdue} dias de atraso
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-red-600">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleWhatsApp(item.patient?.phone, item.patient?.name, item.total)}
                                                        >
                                                            <MessageSquare className="h-4 w-4" /> Cobrar
                                                        </Button>
                                                        {item.appointment?.id && (
                                                            <Link href={`/dashboard/${slug}/attendance/${item.appointment.id}`}>
                                                                <Button variant="ghost" size="sm" className="gap-2">
                                                                    <ExternalLink className="h-4 w-4" /> Ver
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
