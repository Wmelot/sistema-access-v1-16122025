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
import { createTransaction, deleteTransaction, markTransactionAsPaid, getPayables, getFinancialCategories } from "./actions"
import { Loader2, Plus, Trash2, Search, CheckCircle2, AlertCircle, CalendarClock } from "lucide-react"
import { toast } from "sonner"
import { format, isBefore, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export function PayablesTab({ initialPayables, categories }: { initialPayables: any[], categories: any[] }) {
    const [payables, setPayables] = useState<any[]>(initialPayables || [])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newBill, setNewBill] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0], // Competence
        due_date: new Date().toISOString().split('T')[0], // Due Date
        installments: '1',
        is_recurring: false
    })

    // Payment Confirmation State
    const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<any>(null)
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

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
    const handleCreate = async () => {
        if (!newBill.description || !newBill.amount || !newBill.category) {
            toast.error("Preencha os campos obrigatórios.")
            return
        }

        setCreating(true)
        const formData = new FormData()
        formData.append('type', 'expense') // Always expense for Payables
        formData.append('status', 'pending') // Always pending
        formData.append('description', newBill.description)
        formData.append('amount', newBill.amount.replace(',', '.'))
        formData.append('category', newBill.category)
        formData.append('date', newBill.date)
        formData.append('due_date', newBill.due_date)
        formData.append('installments', newBill.installments)
        formData.append('is_recurring', String(newBill.is_recurring))

        const res = await createTransaction(formData)
        setCreating(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Conta a pagar criada!")
            setIsCreateOpen(false)
            setNewBill({
                description: '', amount: '', category: '',
                date: new Date().toISOString().split('T')[0],
                due_date: new Date().toISOString().split('T')[0],
                installments: '1', is_recurring: false
            })
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
        setPaymentConfirmOpen(true)
    }

    const confirmPayment = async () => {
        if (!selectedBill) return
        await markTransactionAsPaid(selectedBill.id, paymentDate)
        toast.success("Pagamento registrado!")
        setPaymentConfirmOpen(false)
        setSelectedBill(null)
        fetchPayables()
    }

    // No client-side filter needed anymore, used logic in fetchPayables
    const filtered = payables

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
                                    <DialogTitle>Nova Conta a Pagar</DialogTitle>
                                    <DialogDescription>Cadastre uma despesa futura.</DialogDescription>
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
                                                placeholder="0,00"
                                                value={newBill.amount}
                                                onValueChange={(val) => setNewBill({ ...newBill, amount: String(val || '') })}
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
                                                        <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                                                    ))}
                                                    <SelectItem value="24">24x</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center space-x-2 pb-2">
                                            <Checkbox
                                                id="recurring"
                                                checked={newBill.is_recurring}
                                                onCheckedChange={(c) => setNewBill({ ...newBill, is_recurring: !!c })}
                                                disabled={newBill.installments !== '1'}
                                            />
                                            <Label htmlFor="recurring" className="cursor-pointer">Despesa Recorrente</Label>
                                        </div>
                                    </div>

                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleCreate} disabled={creating}>
                                        {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Conta'}
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
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Valor</TableHead>
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
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {bill.status === 'pending' && (
                                                            <Button variant="ghost" size="icon" title="Pagar" onClick={() => openPaymentDialog(bill)}>
                                                                <CheckCircle2 className="h-5 w-5 text-green-500 hover:text-green-700" />
                                                            </Button>
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
            </Card>
        </>
    )
}
