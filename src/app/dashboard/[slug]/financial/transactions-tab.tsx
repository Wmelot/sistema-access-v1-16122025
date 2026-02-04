import { QuantumLoader } from "@/components/ui/quantum-loader" // Import
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

// ... imports remain the same in upper block, just replacing Loader2 import in this block ...

export function TransactionsTab() {
    // ... state ...

    // ... imports ...

    // RENDER BLOCK:
    return (
        <>
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
                                {/* ... form fields ... */}
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
                                            <DateInput
                                                value={newTransaction.date}
                                                onChange={(val) => setNewTransaction({ ...newTransaction, date: val })}
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
                                            <CurrencyInput
                                                placeholder="0,00"
                                                value={newTransaction.amount}
                                                onValueChange={(val) => setNewTransaction({ ...newTransaction, amount: String(val || '') })}
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
                                    <Button onClick={handleCreate} disabled={creating} className="relative overflow-hidden min-w-[100px]">
                                        {creating ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-primary/90 z-10">
                                                <QuantumLoader size="20" color="white" />
                                            </div>
                                        ) : 'Salvar'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar transação..."
                                className="pl-9 bg-white h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Input
                            type="month"
                            value={filterDate.substring(0, 7)}
                            onChange={(e) => setFilterDate(e.target.value + "-01")}
                            className="w-full sm:w-[200px] bg-white h-10"
                        />
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="rounded-md border hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('date')}>
                                        <div className="flex items-center gap-1">
                                            Data
                                            {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                            {sortConfig?.key !== 'date' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
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
                                    <TableHead>Bandeira</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center align-middle">
                                            <div className="flex justify-center items-center w-full h-full">
                                                <QuantumLoader size="40" className="opacity-50" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                                                    {t.patient && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Pac.: <Link href={`/dashboard/patients/${t.patient.id}`} className="hover:underline hover:text-blue-600 transition-colors">
                                                                {t.patient.name}
                                                            </Link>
                                                        </span>
                                                    )}
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
                                                <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap">
                                                    {t.invoice?.card_brand?.name || '-'}
                                                </span>
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

                    {/* MOBILE CARD VIEW */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {loading ? (
                            <div className="flex justify-center py-12"><QuantumLoader size="30" /></div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10">
                                Nenhuma transação encontrada.
                            </div>
                        ) : (
                            filteredTransactions.map((t) => (
                                <div key={t.id} className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
                                    {/* ... mobile card content ... */}
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col pr-4">
                                            <span className="font-bold text-base leading-tight">{t.description}</span>
                                            {t.patient && (
                                                <Link href={`/dashboard/patients/${t.patient.id}`} className="text-xs text-blue-600 hover:underline mt-1">
                                                    Pac.: {t.patient.name}
                                                </Link>
                                            )}
                                            {t.product && <span className="text-xs text-muted-foreground mt-0.5">Prod.: {t.product.name}</span>}
                                        </div>
                                        <span className={`font-bold text-lg whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                        </span>
                                    </div>

                                    {/* Info Row */}
                                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {t.category}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {format(new Date(t.date), 'dd/MM/yyyy')}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end pt-1 gap-4">
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="h-8 w-8 p-0">
                                            <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                        </Button>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
