"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { getInvoiceItems, updateInvoiceStatus } from "../actions"
import { Loader2, Search, DollarSign } from "lucide-react"

interface InvoiceDetailsDialogProps {
    invoice: any
}

export function InvoiceDetailsDialog({ invoice }: InvoiceDetailsDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<any[]>([])

    // Receipt State
    const [isReceiving, setIsReceiving] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("pix")
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [installments, setInstallments] = useState(1)
    const [processing, setProcessing] = useState(false)

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
            {/* Increased max-w and added overflow handling for multiple items */}
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detalhes da Fatura</DialogTitle>
                    <DialogDescription>
                        Fatura gerada em {format(new Date(invoice.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg shrink-0">
                        <div>
                            <span className="font-semibold block">Método de Pagamento:</span>
                            <span className="capitalize">
                                {invoice.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                                    invoice.payment_method === 'pending' ? 'Pendente' : invoice.payment_method}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="font-semibold block">Valor Total:</span>
                            <span className="text-lg font-bold text-green-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
                            </span>
                        </div>
                    </div>

                    <div className="border rounded-md flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="w-[80px] text-center">Qtd</TableHead>
                                    <TableHead className="text-right">Unitário</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
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
                                            <TableCell className="font-medium">
                                                {item.description}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.quantity || 1}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price || 0)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price || item.unit_price || 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>


                {/* Footer for Actions */}
                <DialogFooter className="mt-4 border-t pt-4">
                    {invoice.status === 'pending' && !isReceiving && (
                        <Button
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setIsReceiving(true)}
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Receber (Baixar)
                        </Button>
                    )}

                    {isReceiving && (
                        <div className="w-full flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data do Pagamento</Label>
                                    <Input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Método</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pix">Pix</SelectItem>
                                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                            <SelectItem value="cash">Dinheiro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {paymentMethod === 'credit_card' && (
                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <Label>Parcelas</Label>
                                        <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1x (À vista)</SelectItem>
                                                {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                                                    <SelectItem key={num} value={String(num)}>{num}x</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsReceiving(false)} disabled={processing}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={processing}
                                    onClick={async () => {
                                        setProcessing(true)
                                        const res = await updateInvoiceStatus(invoice.id, 'paid', paymentMethod, paymentDate, installments)
                                        if (res?.success) {
                                            setOpen(false) // Close dialog
                                        }
                                        setProcessing(false)
                                    }}
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Recebimento'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
