"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import { useState, useEffect } from "react"
import { getProductSalesHistory } from "./actions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ProductHistoryDialogProps {
    productId: string
    productName: string
}

export function ProductHistoryDialog({ productId, productName }: ProductHistoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setLoading(true)
            getProductSalesHistory(productId)
                .then(data => setHistory(data))
                .catch(console.error)
                .finally(() => setLoading(false))
        }
    }, [open, productId])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Histórico de Vendas">
                    <History className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Histórico de Vendas: {productName}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Carregando...</div>
                ) : history.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                        Nenhuma venda registrada para este produto.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 font-semibold text-sm px-2 text-muted-foreground">
                            <div>Data</div>
                            <div>Paciente</div>
                            <div className="text-right">Qtd</div>
                            <div className="text-right">Valor</div>
                        </div>
                        <div className="space-y-2">
                            {history.map((sale) => (
                                <div key={sale.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-md text-sm transition-colors border">
                                    <div className="text-muted-foreground w-24">
                                        {sale.date ? format(new Date(sale.date), "dd/MM/yy HH:mm") : '-'}
                                    </div>
                                    <div className="font-medium truncate">
                                        {sale.patientName}
                                    </div>
                                    <div className="text-right font-mono">
                                        {sale.quantity}
                                    </div>
                                    <div className="text-right font-semibold text-primary">
                                        R$ {sale.total.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
