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
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Pencil, AlertCircle, Eye, User, Paperclip, Filter, Download, MoreHorizontal, Edit, Check, X, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { getTransactions, createTransaction, deleteTransaction, getFinancialCategories, updateTransaction } from "./actions"
import { getProducts, getPatients } from "@/actions/patients"
import { getServices } from "@/app/dashboard/[slug]/services/actions"
import { getProfessionals } from "@/app/dashboard/[slug]/professionals/actions"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useParams } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"

import { startOfMonth, endOfMonth } from "date-fns"

export function TransactionsTab() {
    const { slug } = useParams()
    const { isCollapsed } = useSidebar()
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [categories, setCategories] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [professionals, setProfessionals] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])

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
        password: '',
        patient_id: 'none',
        product_id: 'none',
        professional_id: 'none',
        quantity: '1',
        production_cost: '0'
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
        const [transData, catData, prodData, servData, profData, patData] = await Promise.all([
            getTransactions(startDate, endDate, nature, kind),
            getFinancialCategories(),
            getProducts(),
            getServices(slug as string),
            getProfessionals(slug as string),
            getPatients({ limit: 100, slug: slug as string })
        ])
        setTransactions(transData || [])
        setCategories(catData || [])
        setProducts(prodData || [])
        setServices(servData || [])
        setProfessionals(profData || [])
        setPatients((patData as any)?.data || [])
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
        if (newTransaction.patient_id && newTransaction.patient_id !== 'none') formData.append('patient_id', newTransaction.patient_id)
        if (newTransaction.product_id && newTransaction.product_id !== 'none') formData.append('product_id', newTransaction.product_id)
        if (newTransaction.professional_id && newTransaction.professional_id !== 'none') formData.append('professional_id', newTransaction.professional_id)
        formData.append('quantity', newTransaction.quantity)
        formData.append('production_cost', newTransaction.production_cost)

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
                password: '',
                patient_id: 'none',
                product_id: 'none',
                professional_id: 'none',
                quantity: '1',
                production_cost: '0'
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
            password: '',
            patient_id: t.patient_id || 'none',
            product_id: t.product_id || 'none',
            professional_id: t.professional_id || 'none',
            quantity: String(t.quantity || 1),
            production_cost: String(t.production_cost || 0)
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
            password: '',
            patient_id: 'none',
            product_id: 'none',
            professional_id: 'none',
            quantity: '1',
            production_cost: '0'
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
                    <Dialog
                        open={isCreateOpen}
                        onOpenChange={(open) => {
                            setIsCreateOpen(open)
                            if (!open) resetForm()
                        }}
                        modal={false}
                    >
                        <DialogTrigger asChild>
                            <Button className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-lg shadow-slate-200 transition-all">
                                <Plus className="h-4 w-4" /> Nova Transação
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            overlayClassName="hidden"
                            className={cn(
                                "fixed z-40 transition-all duration-300 ease-in-out",
                                "top-[84px] bottom-6 right-6",
                                "!translate-x-0 !translate-y-0",
                                "!w-auto !max-w-none h-auto overflow-y-auto shadow-2xl border-2 border-slate-200 bg-white",
                                isCollapsed
                                    ? "left-[84px]"
                                    : "left-[274px]"
                            )}
                            onPointerDownOutside={(e) => e.preventDefault()}
                            onInteractOutside={(e) => e.preventDefault()}
                        >
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {editingId ? "Editar Transação" : "Nova Transação"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium italic">
                                    {editingId ? "Altere os dados da movimentação conforme necessário." : "Registre uma movimentação financeira manual para o caixa da clínica."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-8 py-6">
                                {/* Basic Info Row: Type, Date, Category */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tipo de Fluxo</Label>
                                        <Select
                                            value={newTransaction.type}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, type: v as any })}
                                        >
                                            <SelectTrigger className="h-12 border-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="income" className="text-emerald-600 font-bold">Entrada (+)</SelectItem>
                                                <SelectItem value="expense" className="text-rose-600 font-bold">Saída (-)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Data de Competência</Label>
                                        <DateInput
                                            value={newTransaction.date}
                                            onChange={(v) => setNewTransaction({ ...newTransaction, date: v })}
                                            className="h-12 border-2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Categoria Financeira</Label>
                                        <Input
                                            list="trans-categories"
                                            value={newTransaction.category}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                                            placeholder="Selecione ou digite..."
                                            className="h-12 border-2"
                                        />
                                        <datalist id="trans-categories">
                                            {categories.map((c: any) => <option key={c.id} value={c.name} />)}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Item Selection Row: Always show to help discovery, but mention it's related to stock/tracking */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-blue-700">Vincular Produto</Label>
                                            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-100 italic">Opcional</Badge>
                                        </div>
                                        <Select
                                            value={newTransaction.product_id}
                                            onValueChange={(id) => {
                                                const prod = products.find(p => p.id === id)
                                                if (prod) {
                                                    setNewTransaction({
                                                        ...newTransaction,
                                                        product_id: id,
                                                        description: `Venda: ${prod.name}`,
                                                        amount: String(prod.price).replace('.', ','),
                                                        production_cost: String(prod.cost_price || 0),
                                                        category: 'Venda de Produto'
                                                    })
                                                } else {
                                                    setNewTransaction({ ...newTransaction, product_id: 'none' })
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 bg-white border-blue-200 focus:ring-blue-500">
                                                <SelectValue placeholder="Selecione um produto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum produto</SelectItem>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-400 mt-1 italic">Vincular produto gerencia estoque e análise de vendas.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-indigo-700">Vincular Serviço</Label>
                                            <Badge variant="outline" className="text-[9px] bg-indigo-50 text-indigo-600 border-indigo-100 italic">Opcional</Badge>
                                        </div>
                                        <Select
                                            onValueChange={(id) => {
                                                const serv = services.find(s => s.id === id)
                                                if (serv) {
                                                    setNewTransaction({
                                                        ...newTransaction,
                                                        description: `Serviço: ${serv.name}`,
                                                        amount: String(serv.price).replace('.', ','),
                                                        category: 'Serviços'
                                                    })
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 bg-white border-indigo-200 focus:ring-indigo-500">
                                                <SelectValue placeholder="Selecione um serviço..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum serviço</SelectItem>
                                                {services.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-400 mt-1 italic">Vincular serviço ajuda na análise DRE.</p>
                                    </div>
                                </div>

                                {/* People & Attachment Row: Patient, Professional, Attachment */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Paciente Vinculado</Label>
                                        <Select
                                            value={newTransaction.patient_id}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, patient_id: v })}
                                        >
                                            <SelectTrigger className="h-12 border-2">
                                                <SelectValue placeholder="Selecione o paciente (Opcional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum paciente</SelectItem>
                                                {patients.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Profissional Responsável (Comissão)</Label>
                                        <Select
                                            value={newTransaction.professional_id}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, professional_id: v })}
                                        >
                                            <SelectTrigger className="h-12 border-2">
                                                <SelectValue placeholder="Selecione o profissional (Opcional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum profissional</SelectItem>
                                                {professionals.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 group">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Paperclip className="h-4 w-4" /> Comprovante / Anexo
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                                className="cursor-pointer h-12 border-2 flex-1"
                                            />
                                            {attachment && (
                                                <Button variant="ghost" size="sm" onClick={() => setAttachment(null)} className="text-rose-500 h-12 px-2 hover:bg-rose-50 min-w-fit">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description and Amount Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Descrição Detalhada</Label>
                                        <Input
                                            placeholder="Ex: Aluguel, Venda de Produto..."
                                            value={newTransaction.description}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                            className="h-12 border-2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Valor (R$)</Label>
                                        <CurrencyInput
                                            value={newTransaction.amount}
                                            onValueChange={(v) => setNewTransaction({ ...newTransaction, amount: String(v || '') })}
                                            className="h-12 border-2 font-bold text-lg"
                                        />
                                    </div>
                                </div>

                                {editingId && (newTransaction as any).status === 'paid' && (
                                    <div className="space-y-2 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                        <Label className="text-yellow-800 text-xs font-bold flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> CONFIRMAÇÃO NECESSÁRIA
                                        </Label>
                                        <p className="text-xs text-yellow-700 leading-relaxed mb-3">
                                            Esta transação já foi liquidada. Para editá-la, digite sua senha de login por segurança.
                                        </p>
                                        <Input
                                            type="password"
                                            placeholder="Sua senha para confirmar..."
                                            className="bg-white h-11"
                                            value={newTransaction.password}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, password: e.target.value })}
                                        />
                                    </div>
                                )}

                            </div>
                            <DialogFooter className="border-t pt-6">
                                <Button variant="ghost" onClick={resetForm} className="h-12 px-8">Cancelar</Button>
                                <Button onClick={handleCreateOrUpdate} disabled={creating} className="h-12 px-12 font-bold text-base shadow-lg shadow-primary/20">
                                    {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Transação"}
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
