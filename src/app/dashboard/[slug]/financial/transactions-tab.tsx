"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { DateInput } from "@/components/ui/date-input"
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { getTransactions, createTransaction, deleteTransaction, getFinancialCategories } from "./actions"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import Link from "next/link"

export function TransactionsTab() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [categories, setCategories] = useState<any[]>([])

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newTransaction, setNewTransaction] = useState({
        type: 'expense',
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
    })

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [transData, catData] = await Promise.all([
            getTransactions(),
            getFinancialCategories()
        ])
        setTransactions(transData || [])
        setCategories(catData || [])
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!newTransaction.description || !newTransaction.amount || !newTransaction.category) {
            toast.error("Preencha todos os campos obrigatórios.")
            return
        }

        setCreating(true)
        const formData = new FormData()
        formData.append('type', newTransaction.type)
        formData.append('description', newTransaction.description)
        formData.append('amount', newTransaction.amount.replace(',', '.'))
        formData.append('category', newTransaction.category)
        formData.append('date', newTransaction.date)
        formData.append('status', newTransaction.status)

        const res = await createTransaction(formData)
        setCreating(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Transação criada!")
            setIsCreateOpen(false)
            setNewTransaction({
                type: 'expense',
                description: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                status: 'paid'
            })
            fetchData()
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            await deleteTransaction(deleteId)
            toast.success("Transação excluída")
            fetchData()
        } finally {
            setIsDeleting(false)
            setDeleteId(null)
        }
    }

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <ConfirmationDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Excluir Transação"
                description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transações</CardTitle>
                        <CardDescription>Histórico de entradas e saídas do caixa.</CardDescription>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Nova Transação
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Transação</DialogTitle>
                                <DialogDescription>Registre uma movimentação financeira manual.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={newTransaction.type}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, type: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="income">Entrada (+)</SelectItem>
                                                <SelectItem value="expense">Saída (-)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data</Label>
                                        <DateInput
                                            value={newTransaction.date}
                                            onChange={(v) => setNewTransaction({ ...newTransaction, date: v })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Input
                                        placeholder="Ex: Aluguel, Venda de Produto..."
                                        value={newTransaction.description}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Valor (R$)</Label>
                                        <CurrencyInput
                                            value={newTransaction.amount}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, amount: String(v || '') })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Categoria</Label>
                                        <Input
                                            list="trans-categories"
                                            value={newTransaction.category}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                                            placeholder="Selecione ou digite..."
                                        />
                                        <datalist id="trans-categories">
                                            {categories.map((c: any) => <option key={c.id} value={c.name} />)}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar transações..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Nenhuma transação encontrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="font-medium">{t.description}</TableCell>
                                            <TableCell>
                                                <span className="bg-slate-100 px-2 py-1 rounded-full text-xs">
                                                    {t.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {t.type === 'income' ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <ArrowUpCircle className="h-4 w-4" /> Entrada
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 flex items-center gap-1">
                                                        <ArrowDownCircle className="h-4 w-4" /> Saída
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(t.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
