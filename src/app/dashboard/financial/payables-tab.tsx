"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CurrencyInput } from "@/components/ui/currency-input" // [NEW]
import { createTransaction, deleteTransaction, markTransactionAsPaid, getPayables, getFinancialCategories, updatePayableValue, updateTransaction } from "./actions"
import { Loader2, Plus, Trash2, Search, CheckCircle2, AlertCircle, CalendarClock, ArrowUpDown, ArrowUp, ArrowDown, Pencil } from "lucide-react"
import { toast } from "sonner"
import { format, isBefore, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { createClient } from "@/lib/supabase/client" // [NEW]

export function PayablesTab({ initialPayables, categories }: { initialPayables: any[], categories: any[] }) {
    const [payables, setPayables] = useState<any[]>(initialPayables || [])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null) // [NEW] Track editing
    const [newBill, setNewBill] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        installments: '1',
        is_recurring: false,
        is_variable_value: false
    })

    // Payment Confirmation State
    const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<any>(null)
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [paymentAmount, setPaymentAmount] = useState('')

    // Set Value Dialog State
    const [valueDialogOpen, setValueDialogOpen] = useState(false)
    const [newValue, setNewValue] = useState('')

    const [statusFilter, setStatusFilter] = useState("pending")
    // Default current month? Or empty? Let's default empty to show all pending.
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedSearch !== searchTerm) {
                setDebouncedSearch(searchTerm)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchPayables = async () => {
        setLoading(true)
        const data = await getPayables({
            status: statusFilter,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            searchTerm: debouncedSearch || undefined
        })
        setPayables(data || [])
        setLoading(false)
    }

    // Refetch when filters change
    useEffect(() => {
        fetchPayables()
    }, [statusFilter, startDate, endDate, debouncedSearch])

    // Handlers
    const handleEdit = (bill: any) => {
        setEditingId(bill.id)
        setNewBill({
            description: bill.description,
            amount: String(bill.amount),
            category: bill.category,
            date: bill.date,
            due_date: bill.due_date,
            installments: '1', // Editing existing single record usually treats it as 1x item even if part of series originally? Yes for now.
            is_recurring: bill.is_recurring,
            is_variable_value: bill.is_variable_value || false
        })
        setIsCreateOpen(true)
    }

    const resetForm = () => {
        setIsCreateOpen(false)
        setEditingId(null)
        setNewBill({
            description: '',
            amount: '',
            category: '',
            date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            installments: '1',
            is_recurring: false,
            is_variable_value: false
        })
    }

    const handleCreateOrUpdate = async () => {
        if (!newBill.description || !newBill.category) {
            toast.error("Preencha descrição e categoria.")
            return
        }

        // Allow amount to be empty/0 if variable value
        if (!newBill.is_variable_value && !newBill.amount) {
            toast.error("Preencha o valor.")
            return
        }

        setCreating(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const formData = new FormData()
        formData.append('type', 'expense')
        formData.append('status', 'pending')
        formData.append('description', newBill.description)
        formData.append('amount', newBill.amount ? newBill.amount.replace(',', '.') : '0')
        formData.append('category', newBill.category)
        formData.append('date', newBill.date)
        formData.append('due_date', newBill.due_date)
        formData.append('installments', newBill.installments)
        formData.append('is_recurring', String(newBill.is_recurring))
        formData.append('is_variable_value', String(newBill.is_variable_value))

        if (user) {
            formData.append('professional_id', user.id)
        }

        let res;
        if (editingId) {
            res = await updateTransaction(editingId, formData)
        } else {
            res = await createTransaction(formData)
        }

        setCreating(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success(editingId ? "Conta atualizada!" : "Conta a pagar criada!")
            resetForm()
            fetchPayables()
        }
    }

    const handleDelete = async (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            await deleteTransaction(deleteId)
            toast.success("Excluído")
            fetchPayables()
        } finally {
            setIsDeleting(false)
            setDeleteId(null)
        }
    }

    const openPaymentDialog = (bill: any) => {
        setSelectedBill(bill)
        setPaymentDate(new Date().toISOString().split('T')[0]) // Default to today
        setPaymentAmount(String(bill.amount || ''))
        setPaymentConfirmOpen(true)
    }

    const confirmPayment = async () => {
        if (!selectedBill) return
        await markTransactionAsPaid(selectedBill.id, paymentDate, paymentAmount ? Number(paymentAmount.replace(',', '.')) : undefined)
        toast.success("Pagamento registrado!")
        setPaymentConfirmOpen(false)
        setSelectedBill(null)
        fetchPayables()
    }

    const openValueDialog = (bill: any) => {
        setSelectedBill(bill)
        setNewValue('')
        setValueDialogOpen(true)
    }

    const confirmValueUpdate = async () => {
        if (!selectedBill || !newValue) return

        // Dynamic import to avoid circular dep issues or just import above? 
        // We need updatePayableValue from actions.
        const { updatePayableValue } = await import("./actions") // Lazy import if needed, but simple import is fine if added up top.
        // Assuming I added it to top import list in a previous step, but I modified actions.ts AFTER viewing payables-tab imports.
        // Let's rely on standard import. Wait, I should add it to top imports.
        // But I'm doing a replace_block here. 
        // I'll add the function call here assuming import exists, or add import on separate edit.
        // Actually, I can't edit imports easily in this block.
        // I will use `require` or rely on next step to add import.
        // Or simpler: Just assume I will fix imports.

        // Actually, I can include the import line change if I expand the block, but that's risky.
        // I'll just use the function, and if it fails build, I'll fix imports.
        // Wait, I cannot run build.
        // I'll assume `updatePayableValue` is imported. I will add it to the import list in a separate call.

        // Wait, I can use a separate call to fix imports first?
        // No, I'm already in this call.
        // I'll proceed.

        await updatePayableValue(selectedBill.id, Number(newValue.replace(',', '.')))
        toast.success("Valor atualizado!")
        setValueDialogOpen(false)
        setSelectedBill(null)
        fetchPayables()
    }

    // No client-side filter needed anymore, used logic in fetchPayables
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

    const filtered = [...payables].sort((a, b) => {
        if (!sortConfig) return 0

        let aValue: any = ''
        let bValue: any = ''

        switch (sortConfig.key) {
            case 'due_date':
                aValue = new Date(a.due_date).getTime()
                bValue = new Date(b.due_date).getTime()
                break
            case 'description':
                aValue = a.description.toLowerCase()
                bValue = b.description.toLowerCase()
                break
            case 'category':
                aValue = a.category.toLowerCase()
                bValue = b.category.toLowerCase()
                break
            case 'amount':
                aValue = Number(a.amount)
                bValue = Number(b.amount)
                break
            default:
                return 0
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    // Calculate totals
    const totalPending = filtered.reduce((acc, curr) => {
        if (curr.status === 'pending') return acc + (Number(curr.amount) || 0)
        return acc
    }, 0)

    return (
        <>
            <ConfirmationDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Excluir Conta a Pagar"
                description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Contas a Pagar</CardTitle>
                        <CardDescription>Gerencie suas despesas pendentes e fluxo de caixa futuro.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                                    <Plus className="h-4 w-4" /> Nova Conta
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>{editingId ? 'Editar Conta' : 'Nova Conta a Pagar'}</DialogTitle>
                                    <DialogDescription>{editingId ? 'Altere os dados da despesa.' : 'Cadastre uma despesa futura.'}</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Descrição da Despesa</Label>
                                        <Input
                                            placeholder="Ex: Conta de Luz, Aluguel..."
                                            value={newBill.description}
                                            onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Valor (R$)</Label>
                                            <CurrencyInput
                                                placeholder={newBill.is_variable_value ? "A definir" : "0,00"}
                                                value={newBill.amount}
                                                onValueChange={(val) => setNewBill({ ...newBill, amount: String(val || '') })}
                                                disabled={newBill.is_variable_value && !newBill.amount} // Optional: allow user to set estimate. Let's ENABLE it always, but hint.
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Categoria</Label>
                                            <Input
                                                list="payables-categories"
                                                value={newBill.category}
                                                onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                                                placeholder="Selecione..."
                                            />
                                            <datalist id="payables-categories">
                                                {categories.map((c: any) => <option key={c.id} value={c.name} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Data Compra (Competência)</Label>
                                            <DateInput
                                                value={newBill.date}
                                                onChange={(v) => setNewBill({ ...newBill, date: v })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-red-600 font-semibold">Vencimento</Label>
                                            <DateInput
                                                value={newBill.due_date}
                                                onChange={(v) => setNewBill({ ...newBill, due_date: v })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 items-end">
                                        <div className="space-y-2">
                                            <Label>Parcelamento (x)</Label>
                                            <Select
                                                value={newBill.installments}
                                                onValueChange={(v) => setNewBill({ ...newBill, installments: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">À vista (1x)</SelectItem>
                                                    {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
                                                        <SelectItem key={n} value={String(n)} disabled={!!editingId}>{n}x {editingId && '(N/A na edição)'}</SelectItem>
                                                    ))}
                                                    <SelectItem value="24">24x</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col gap-2 pb-1">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="recurring"
                                                    checked={newBill.is_recurring}
                                                    onCheckedChange={(c) => setNewBill({ ...newBill, is_recurring: !!c })}
                                                    disabled={newBill.installments !== '1'}
                                                />
                                                <Label htmlFor="recurring" className="cursor-pointer">Despesa Recorrente</Label>
                                            </div>

                                            {newBill.is_recurring && (
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="variable-val"
                                                        checked={newBill.is_variable_value}
                                                        onCheckedChange={(c) => setNewBill({ ...newBill, is_variable_value: !!c })}
                                                    />
                                                    <Label htmlFor="variable-val" className="cursor-pointer text-xs">Valor Variável (Conta de Consumo)</Label>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                                    <Button onClick={handleCreateOrUpdate} disabled={creating}>
                                        {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingId ? 'Salvar Alterações' : 'Criar Conta')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs">Buscar</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Descrição da conta..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-[150px] space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="paid">Pago</SelectItem>
                                        <SelectItem value="all">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-[150px] space-y-1">
                                <Label className="text-xs">De</Label>
                                <DateInput value={startDate} onChange={setStartDate} />
                            </div>
                            <div className="w-full md:w-[150px] space-y-1">
                                <Label className="text-xs">Até</Label>
                                <DateInput value={endDate} onChange={setEndDate} />
                            </div>

                            <div className="w-full md:w-[200px] text-right pb-2">
                                <span className="text-sm text-muted-foreground block">Total Filtrado:</span>
                                <span className="text-xl font-bold text-slate-700">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('due_date')}>
                                        <div className="flex items-center gap-1">
                                            Vencimento
                                            {sortConfig?.key === 'due_date' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                            {sortConfig?.key !== 'due_date' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('description')}>
                                        <div className="flex items-center gap-1">
                                            Descrição
                                            {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                            {sortConfig?.key !== 'description' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('category')}>
                                        <div className="flex items-center gap-1">
                                            Categoria
                                            {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                            {sortConfig?.key !== 'category' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('amount')}>
                                        <div className="flex items-center gap-1">
                                            Valor
                                            {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                            {sortConfig?.key !== 'amount' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhuma conta pendente.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((bill) => {
                                        const isOverdue = isBefore(new Date(bill.due_date), startOfDay(new Date()))
                                        const isPendingValue = bill.pending_value_resolution

                                        return (
                                            <TableRow key={bill.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarClock className={`h-4 w-4 ${isOverdue ? "text-red-500" : "text-slate-500"}`} />
                                                        <span className={bill.status === 'paid' ? "text-green-600 font-medium" : (isOverdue ? "font-bold text-red-600" : "")}>
                                                            {format(new Date(bill.due_date), 'dd/MM/yyyy')}
                                                        </span>
                                                        {bill.status === 'paid' && <span className="text-[10px] bg-green-100 text-green-600 px-1 rounded">Pago</span>}
                                                        {bill.status === 'pending' && isOverdue && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Atrasado</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-700">{bill.description}</span>
                                                        {bill.is_recurring && <span className="text-[10px] text-blue-600 flex items-center gap-1">🔄 Recorrente</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800">
                                                        {bill.category}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-bold text-red-600">
                                                    {isPendingValue
                                                        ? <span className="text-yellow-600 text-xs bg-yellow-100 px-2 py-1 rounded">A Definir</span>
                                                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEdit(bill)}>
                                                            <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-500" />
                                                        </Button>
                                                        {bill.status === 'pending' && (
                                                            isPendingValue ? (
                                                                <Button variant="outline" size="sm" className="h-8 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => openValueDialog(bill)}>
                                                                    Definir Valor
                                                                </Button>
                                                            ) : (
                                                                <Button variant="ghost" size="icon" title="Pagar" onClick={() => openPaymentDialog(bill)}>
                                                                    <CheckCircle2 className="h-5 w-5 text-green-500 hover:text-green-700" />
                                                                </Button>
                                                            )
                                                        )}
                                                        <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(bill.id)}>
                                                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                                        </Button>
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

                {/* Payment Confirmation Dialog */}
                <Dialog open={paymentConfirmOpen} onOpenChange={setPaymentConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Pagamento</DialogTitle>
                            <DialogDescription>
                                Confirme os dados do pagamento para: <strong>{selectedBill?.description}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Data do Pagamento</Label>
                                <DateInput value={paymentDate} onChange={setPaymentDate} />
                            </div>

                            <div className="space-y-2">
                                <Label>Valor Pago (R$)</Label>
                                <CurrencyInput
                                    value={paymentAmount}
                                    onValueChange={(val) => setPaymentAmount(String(val || ''))}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-100 flex gap-2">
                                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                                <div>
                                    Esta ação marcará a conta como PAGA e atualizará o saldo.
                                    {selectedBill?.is_recurring && <p className="mt-1 font-semibold">⚠️ Lembre-se de lançar a conta do próximo mês se necessário.</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPaymentConfirmOpen(false)}>Cancelar</Button>
                            <Button onClick={confirmPayment} className="bg-green-600 hover:bg-green-700 text-white">
                                Confirmar Pagamento
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Set Value Dialog */}
                <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Definir Valor da Conta</DialogTitle>
                            <DialogDescription>
                                Informe o valor exato da conta: <strong>{selectedBill?.description}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Valor do Mês (R$)</Label>
                                <CurrencyInput
                                    placeholder="0,00"
                                    value={newValue}
                                    onValueChange={(val) => setNewValue(String(val || ''))}
                                    autoFocus
                                />
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-100">
                                Após confirmar, o status mudará para "Pendente" e você poderá realizar o pagamento.
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setValueDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={confirmValueUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Atualizar e Liberar Pagamento
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>
        </>
    )
}
