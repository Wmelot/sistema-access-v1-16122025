"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { format } from "date-fns"

import { getProfessionals } from "../../professionals/actions"

interface EditTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: any
    onConfirm: (data: any) => void
}

export function EditTransactionDialog({ open, onOpenChange, transaction, onConfirm }: EditTransactionDialogProps) {
    const [desc, setDesc] = useState("")
    const [date, setDate] = useState("")
    const [amount, setAmount] = useState(0)
    const [category, setCategory] = useState("general")
    const [isExcluded, setIsExcluded] = useState(false)
    const [linkedProfessionalId, setLinkedProfessionalId] = useState<string | null>(null)
    const [professionals, setProfessionals] = useState<any[]>([])

    useEffect(() => {
        getProfessionals().then(setProfessionals)
    }, [])

    useEffect(() => {
        if (transaction) {
            setDesc(transaction.description || "")
            // Format date for input type=date (YYYY-MM-DD)
            try {
                const d = new Date(transaction.date)
                setDate(d.toISOString().slice(0, 10))
            } catch { setDate("") }
            setAmount(Math.abs(transaction.amount))
            setCategory(transaction.category || "general")
            setIsExcluded(transaction.is_excluded || false)
            setLinkedProfessionalId(transaction.linked_professional_id || null)
        }
    }, [transaction])

    const handleSave = () => {
        onConfirm({
            ...transaction,
            description: desc,
            date: date,
            amount: transaction.amount < 0 ? -Math.abs(amount) : Math.abs(amount),
            category,
            is_excluded: isExcluded,
            linked_professional_id: linkedProfessionalId
        })
        onOpenChange(false)
    }

    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Lançamento</DialogTitle>
                    <DialogDescription>
                        Ajuste os detalhes antes de criar o registro no sistema.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="desc" className="text-right">
                            Descrição
                        </Label>
                        <Input
                            id="desc"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Categoria
                        </Label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="general">Geral / Administrativo</option>
                            <option value="infrastructure">Infraestrutura (Aluguel, Luz, Internet)</option>
                            <option value="materials">Materiais e Insumos</option>
                            <option value="marketing">Marketing / Anúncios</option>
                            <option value="simples">Imposto (Simples Nacional)</option>
                            <option value="gps">Imposto (GPS / INSS)</option>
                            <option value="fees">Taxas Bancárias / Cartão</option>
                            <option value="salary">Folha / Comissões</option>
                            <option value="partner_distribution">Distribuição de Lucro (Sócios)</option>
                            <option value="investment">Investimento / Equipamentos</option>
                        </select>
                    </div>

                    {(category === 'salary' || category === 'partner_distribution') && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="professional" className="text-right text-blue-600 font-semibold">
                                Destinatário
                            </Label>
                            <select
                                id="professional"
                                value={linkedProfessionalId || ""}
                                onChange={(e) => setLinkedProfessionalId(e.target.value)}
                                className="col-span-3 flex h-9 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                            >
                                <option value="">Selecione o Profissional...</option>
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Data
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Valor
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <div className="col-start-2 col-span-3 flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_excluded"
                                checked={isExcluded}
                                onChange={(e) => setIsExcluded(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="is_excluded" className="cursor-pointer">
                                Excluir do DRE? (Não considerar despesa)
                            </Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Salvar e Criar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
