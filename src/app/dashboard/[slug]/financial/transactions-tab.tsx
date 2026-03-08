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
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Pencil, AlertCircle, Eye, User, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { getTransactions, createTransaction, deleteTransaction, getFinancialCategories, updateTransaction } from "./actions"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import Link from "next/link"

import { startOfMonth, endOfMonth } from "date-fns"

export function TransactionsTab() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [categories, setCategories] = useState<any[]>([])

    const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    const [nature, setNature] = useState<'income' | 'expense' | 'all'>('all')
    const [kind, setKind] = useState<'products' | 'services' | 'all'>('all')

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newTransaction, setNewTransaction] = useState({
        type: 'expense',
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        password: ''
    })
    const [attachment, setAttachment] = useState<File | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [startDate, endDate, nature, kind])

    const fetchData = async () => {
        setLoading(true)
        const [transData, catData] = await Promise.all([
            getTransactions(startDate, endDate, nature, kind),
            getFinancialCategories()
        ])
        setTransactions(transData || [])
        setCategories(catData || [])
        setLoading(false)
    }

    const handleCreateOrUpdate = async () => {
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
        if (attachment) formData.append('attachment', attachment)
        if (newTransaction.password) formData.append('password', newTransaction.password)

        let res;
        if (editingId) {
            res = await updateTransaction(editingId, formData)
        } else {
            res = await createTransaction(formData)
        }

        setCreating(true) // Keep loading until done (wait, should be setCreating(false) later)
        if (res?.error) {
            toast.error(res.error)
            setCreating(false)
        } else {
            toast.success(editingId ? "Transação atualizada!" : "Transação criada!")
            setIsCreateOpen(false)
            setEditingId(null)
            setNewTransaction({
                type: 'expense',
                description: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                status: 'paid',
                password: ''
            })
            setAttachment(null)
            fetchData()
            setCreating(false)
        }
    }

    const handleEdit = (t: any) => {
        setEditingId(t.id)
        setNewTransaction({
            type: t.type,
            description: t.description,
            amount: String(t.amount).replace('.', ','),
            category: t.category,
            date: t.date,
            status: t.status,
            password: ''
        })
        setIsCreateOpen(true)
    }

    const resetForm = () => {
        setIsCreateOpen(false)
        setEditingId(null)
        setNewTransaction({
            type: 'expense',
            description: '',
            amount: '',
            category: '',
            date: new Date().toISOString().split('T')[0],
            status: 'paid',
            password: ''
        })
        setAttachment(null)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        const transaction = transactions.find(t => t.id === deleteId)
        const isPaid = transaction?.status === 'paid'

        const performDelete = async (password?: string) => {
            setIsDeleting(true)
            try {
                const res = await deleteTransaction(deleteId, password, "Duplicidade / Erro de lançamento")
                if (res?.error === 'PASSWORD_REQUIRED') {
                    // This case is handled by the prompt, so we just return
                    return false
                }
                if (res?.error) {
                    toast.error(res.error)
                    return false
                }
                toast.success("Transação excluída")
                fetchData()
                return true
            } catch (e) {
                toast.error("Erro técnico ao excluir")
                return false
            } finally {
                setIsDeleting(false)
                setDeleteId(null)
            }
        }

        if (isPaid) {
            const { value: password } = await ((window as any).Swal).fire({
                title: 'Confirmação Necessária',
                text: 'Esta transação já foi liquidada. Digite sua senha para confirmar a exclusão.',
                input: 'password',
                inputPlaceholder: 'Sua senha...',
                showCancelButton: true,
                confirmButtonText: 'Confirmar Exclusão',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#d33',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                }
            })

            if (password) {
                await performDelete(password)
            } else {
                setDeleteId(null)
            }
        } else {
            // Simple confirmation for non-paid transactions
            await performDelete()
        }
    }

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' })

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredTransactions = transactions
        .filter(t =>
            t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const { key, direction } = sortConfig
            let valA = a[key]
            let valB = b[key]

            if (key === 'amount') {
                valA = Number(valA)
                valB = Number(valB)
            } else if (key === 'date') {
                valA = new Date(valA).getTime()
                valB = new Date(valB).getTime()
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase()
                valB = (valB || '').toLowerCase()
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1
            if (valA > valB) return direction === 'asc' ? 1 : -1
            return 0
        })

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
                                <DialogTitle>{editingId ? "Editar Transação" : "Nova Transação"}</DialogTitle>
                                <DialogDescription>{editingId ? "Altere os dados da movimentação." : "Registre uma movimentação financeira manual."}</DialogDescription>
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
                                        <p className="text-[10px] text-muted-foreground leading-tight italic">
                                            Referente ao mês de consumo/competência.
                                        </p>
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
                                {editingId && (newTransaction as any).status === 'paid' && (
                                    <div className="space-y-2 p-3 bg-yellow-50 rounded-md border border-yellow-100">
                                        <Label className="text-yellow-800 text-xs font-bold flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> CONFIRMAÇÃO NECESSÁRIA
                                        </Label>
                                        <p className="text-[10px] text-yellow-700 leading-tight mb-2">
                                            Esta transação já foi liquidada. Para editá-la, digite sua senha de login.
                                        </p>
                                        <Input
                                            type="password"
                                            placeholder="Sua senha para confirmar..."
                                            className="bg-white"
                                            value={newTransaction.password}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, password: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" /> Anexo (Foto da Nota / PDF)
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                        {attachment && (
                                            <Button variant="ghost" size="sm" onClick={() => setAttachment(null)} className="text-red-500 h-10">
                                                Remover
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                                <Button onClick={handleCreateOrUpdate} disabled={creating}>
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end mb-6">
                        <div className="relative col-span-1 sm:col-span-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Buscar transações</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Descrição ou categoria..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Natureza</Label>
                            <Select value={nature} onValueChange={(v: any) => setNature(v)}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Natureza" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="income">Entradas</SelectItem>
                                    <SelectItem value="expense">Saídas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Tipo</Label>
                            <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="services">Serviços</SelectItem>
                                    <SelectItem value="products">Produtos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Data Inicial</Label>
                            <DateInput value={startDate} onChange={setStartDate} className="bg-white" />
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Data Final</Label>
                            <DateInput value={endDate} onChange={setEndDate} className="bg-white" />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">
                                            Data {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-blue-600" /> : <ArrowDown className="h-4 w-4 text-blue-600" />) : <ArrowUpDown className="h-4 w-4 opacity-20" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('description')}>
                                        <div className="flex items-center gap-1">
                                            Descrição {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-blue-600" /> : <ArrowDown className="h-4 w-4 text-blue-600" />) : <ArrowUpDown className="h-4 w-4 opacity-20" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('category')}>
                                        <div className="flex items-center gap-1">
                                            Categoria {sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-blue-600" /> : <ArrowDown className="h-4 w-4 text-blue-600" />) : <ArrowUpDown className="h-4 w-4 opacity-20" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('type')}>
                                        <div className="flex items-center gap-1">
                                            Tipo {sortConfig.key === 'type' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-blue-600" /> : <ArrowDown className="h-4 w-4 text-blue-600" />) : <ArrowUpDown className="h-4 w-4 opacity-20" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-1">
                                            Valor {sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-blue-600" /> : <ArrowDown className="h-4 w-4 text-blue-600" />) : <ArrowUpDown className="h-4 w-4 opacity-20" />}
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1 text-xs">
                                            <User className="h-3 w-3" /> Autor
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <span>{t.creator?.full_name?.split(' ')[0] || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {t.attachment_url && (
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/financial/${t.attachment_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Button variant="ghost" size="icon" title="Ver Anexo">
                                                                <Eye className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(t)}
                                                    >
                                                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteId(t.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}
