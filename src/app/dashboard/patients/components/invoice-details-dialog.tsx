"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { getInvoiceItems } from "../actions"
import { Loader2, Search } from "lucide-react"

interface InvoiceDetailsDialogProps {
    invoice: any
}

export function InvoiceDetailsDialog({ invoice }: InvoiceDetailsDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<any[]>([])

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen && items.length === 0) {
            setLoading(true)
            const data = await getInvoiceItems(invoice.id)
            setItems(data || [])
            setLoading(false)
        }
    }

    // Helper to extraction
    const getServiceName = (app: any) => {
        if (Array.isArray(app.services)) return app.services[0]?.name
        return app.services?.name
    }

    const getProfileName = (app: any) => {
        if (Array.isArray(app.profiles)) return app.profiles[0]?.full_name
        return app.profiles?.full_name
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Ver Detalhes</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detalhes da Fatura</DialogTitle>
                    <DialogDescription>
                        Fatura gerada em {format(new Date(invoice.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
                        <div>
                            <span className="font-semibold block">Método de Pagamento:</span>
                            <span className="capitalize">{invoice.payment_method === 'credit_card' ? 'Cartão de Crédito' : invoice.payment_method}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-semibold block">Valor Total:</span>
                            <span className="text-lg font-bold text-green-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
                            </span>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Profissional</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                            Nenhum item encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {format(new Date(item.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell>{getServiceName(item) || '-'}</TableCell>
                                            <TableCell>{getProfileName(item) || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
