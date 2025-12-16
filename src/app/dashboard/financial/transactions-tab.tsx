"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getTransactions, createTransaction, deleteTransaction, getFinancialCategories } from "./actions"
import { Loader2, Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function TransactionsTab() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
    const [searchTerm, setSearchTerm] = useState("")

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newTransaction, setNewTransaction] = useState({
        type: 'expense' as 'income' | 'expense',
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        installments: '1'
    })

    useEffect(() => {
        fetchTransactions()
        fetchCategories()
    }, [filterDate])

    const fetchCategories = async () => {
        const cats = await getFinancialCategories()
        setCategories(cats || [])
    }

    const fetchTransactions = async () => {
        setLoading(true)
        // Fetch for the selected month? Or usually all? Let's fetch selected month for now or just limit?
        // actions.ts getTransactions accepts startDate/endDate.
        // Let's fetch ALL for now to simplify, or maybe filter by month of selected date?
        // User pattern: usually wants to see the month.
        const dateObj = new Date(filterDate)
        const firstDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().split('T')[0]
        const lastDay = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0]

        const data = await getTransactions(firstDay, lastDay)
        setTransactions(data || [])
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!newTransaction.description || !newTransaction.amount || !newTransaction.category) {
            toast.error("Preencha descrição, valor e categoria")
            return
        }

        setCreating(true)
        const formData = new FormData()
        formData.append('type', newTransaction.type)
        formData.append('description', newTransaction.description)
        formData.append('amount', newTransaction.amount.replace(',', '.'))
        formData.append('category', newTransaction.category)
        formData.append('date', newTransaction.date)
        formData.append('installments', newTransaction.installments)

        const res = await createTransaction(formData)
        setCreating(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Transação criada!")
            setIsCreateOpen(false)
            setNewTransaction({ ...newTransaction, description: '', amount: '', installments: '1' })
            fetchTransactions()
            fetchCategories() // Update in case new category was added
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return
        await deleteTransaction(id)
        toast.success("Excluído")
        fetchTransactions()
    }

    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Transações</CardTitle>
                    <CardDescription>Gerencie entradas e saídas.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Nova Transação</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Transação</DialogTitle>
                                <DialogDescription>Adicione uma despesa ou receita.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={newTransaction.type}
                                            onValueChange={(v: "income" | "expense") => setNewTransaction({ ...newTransaction, type: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="income">Receita (Entrada)</SelectItem>
                                                <SelectItem value="expense">Despesa (Saída)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data</Label>
                                        <Input
                                            type="date"
                                            value={newTransaction.date}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Input
                                        placeholder="Ex: Aluguel, Compra..."
                                        value={newTransaction.description}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Valor Total (R$)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newTransaction.amount}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                        />
                                    </div>

                                    {/* Installments Input */}
                                    <div className="space-y-2">
                                        <Label>Parcelas</Label>
                                        <Select
                                            value={newTransaction.installments}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, installments: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">À vista (1x)</SelectItem>
                                                {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                                                    <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                                                ))}
                                                <SelectItem value="24">24x</SelectItem>
                                                <SelectItem value="36">36x</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Category Selection (Input with Datalist for flexibility) */}
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Input
                                        list="categories-list"
                                        placeholder="Digite ou selecione a categoria..."
                                        value={newTransaction.category}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                                    />
                                    <datalist id="categories-list">
                                        {categories.map((c: any) => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>

                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar transação..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Input
                        type="month"
                        value={filterDate.substring(0, 7)}
                        onChange={(e) => setFilterDate(e.target.value + "-01")}
                        className="w-[180px]"
                    />
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Nenhuma transação encontrada neste mês.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{t.description}</span>
                                                {t.patient && <span className="text-xs text-muted-foreground">Pac.: {t.patient.name}</span>}
                                                {t.product && <span className="text-xs text-muted-foreground">Prod.: {t.product.name}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {t.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`flex items-center gap-1 font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'income' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
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
    )
}
