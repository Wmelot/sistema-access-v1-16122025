"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updatePaymentFee, deletePaymentFee, createCardBrand, updateCardBrand, deleteCardBrand, createPaymentFee, updateOrganizationPaymentSettings } from "./actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Loader2, Pencil, Plus, Trash2, CreditCard, Settings } from "lucide-react"

interface Fee {
    id: string
    method: string
    installments: number
    fee_percent: number
    card_brand?: {
        id: string
        name: string
        slug: string
        icon_emoji: string
        active: boolean
    }
    acquirer?: {
        id: string
        name: string
        receipt_days: number
    }
}

interface CardBrand {
    id: string
    name: string
    slug: string
    icon_emoji: string
    active: boolean
}

interface PaymentSettings {
    max_installments: number
}

interface FeesTabProps {
    fees: Fee[]
    cardBrands: CardBrand[]
    paymentSettings: PaymentSettings
}

export function FeesTab({ fees, cardBrands, paymentSettings }: FeesTabProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [isAddBrandOpen, setIsAddBrandOpen] = useState(false)
    const [isAddFeeOpen, setIsAddFeeOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const handleSaveGroup = async (method: string, installments: number, brandIds: string[], newValue: string, acquirerId: string) => {
        const val = parseFloat(newValue)
        if (isNaN(val) || val < 0) {
            toast.error("Valor inválido")
            return
        }

        setLoading(true)

        // Find all fee IDs for this specific row across all brands in the group AND the correct acquirer
        const feesToUpdate = fees.filter(f =>
            f.method === method &&
            f.installments === installments &&
            brandIds.includes(f.card_brand?.id || '') &&
            f.acquirer?.id === acquirerId
        )

        const promises = feesToUpdate.map(f => updatePaymentFee(f.id, val))
        const results = await Promise.all(promises)

        setLoading(false)

        const errors = results.filter((r: any) => r?.error)
        if (errors.length > 0) {
            toast.error("Erro ao atualizar algumas taxas")
        } else {
            toast.success("Taxas atualizadas!")
            setEditingId(null)
        }
    }

    const handleAddBrand = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await createCardBrand(formData)

        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Bandeira criada!")
            setIsAddBrandOpen(false)
        }
    }

    const handleDeleteBrand = async (id: string) => {
        if (!confirm("Desativar esta bandeira? As taxas associadas permanecerão.")) return

        setLoading(true)
        const res = await deleteCardBrand(id)
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Bandeira desativada!")
        }
    }

    const handleDeleteFee = async (id: string) => {
        if (!confirm("Excluir esta taxa? Esta ação não pode ser desfeita.")) return

        setLoading(true)
        const res = await deletePaymentFee(id)
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Taxa excluída!")
        }
    }

    const handleAddFee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await createPaymentFee(formData)

        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Taxa criada!")
            setIsAddFeeOpen(false)
        }
    }

    const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await updateOrganizationPaymentSettings(formData)

        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Configurações atualizadas!")
            setIsSettingsOpen(false)
        }
    }

    const formatMethod = (method: string) => {
        if (method === 'pix') return 'Pix'
        if (method === 'debit_card') return 'Débito'
        if (method === 'credit_card') return 'Crédito'
        if (method === 'cash') return 'Dinheiro'
        return method
    }

    // --- SMART GROUPING LOGIC (Group by Acquirer, then by Identical Rates) ---

    // 1. Get unique acquirers
    const acquirerIds = Array.from(new Set(fees.map(f => f.acquirer?.id || 'none')));
    const groupedAcquirers = acquirerIds.map(aid => {
        const acquirerFees = fees.filter(f => (f.acquirer?.id || 'none') === aid);
        const name = acquirerFees[0]?.acquirer?.name || "Manual / Padrão";
        const receiptDays = acquirerFees[0]?.acquirer?.receipt_days || 1;

        // Group brands within this acquirer that have the same rates
        const groupedFees: { brands: CardBrand[], fees: Fee[] }[] = [];
        const processedBrandIds = new Set<string>();

        cardBrands.filter(b => b.active).forEach(brand => {
            if (processedBrandIds.has(brand.id)) return;

            const brandFees = acquirerFees.filter(f => f.card_brand?.id === brand.id);
            if (brandFees.length === 0) return;

            const fingerprint = brandFees.sort((a, b) => a.method.localeCompare(b.method) || a.installments - b.installments)
                .map(f => `${f.method}:${f.installments}:${f.fee_percent}`).join('|');

            const siblings = cardBrands.filter(other => {
                if (other.id === brand.id || !other.active || processedBrandIds.has(other.id)) return false;
                const otherFees = acquirerFees.filter(f => f.card_brand?.id === other.id);
                const otherFingerprint = otherFees.sort((a, b) => a.method.localeCompare(b.method) || a.installments - b.installments)
                    .map(f => `${f.method}:${f.installments}:${f.fee_percent}`).join('|');
                return fingerprint === otherFingerprint;
            });

            const brandGroup = [brand, ...siblings];
            brandGroup.forEach(b => processedBrandIds.add(b.id));

            groupedFees.push({ brands: brandGroup, fees: brandFees });
        });

        return { id: aid, name, receiptDays, groups: groupedFees };
    });


    return (
        <Tabs defaultValue="fees" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList>
                    <TabsTrigger value="fees">Taxas</TabsTrigger>
                    <TabsTrigger value="brands">Bandeiras</TabsTrigger>
                </TabsList>

                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurações
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleUpdateSettings}>
                            <DialogHeader>
                                <DialogTitle>Configurações de Pagamento</DialogTitle>
                                <DialogDescription>
                                    Configure o limite máximo de parcelas permitido
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="max_installments">Máximo de Parcelas</Label>
                                <Input
                                    id="max_installments"
                                    name="max_installments"
                                    type="number"
                                    min="1"
                                    max="24"
                                    defaultValue={paymentSettings.max_installments}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <TabsContent value="fees">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Taxas das Maquininhas</CardTitle>
                                <CardDescription>
                                    Configure as taxas cobradas pela operadora do cartão por bandeira e parcelas.
                                </CardDescription>
                            </div>
                            <Dialog open={isAddFeeOpen} onOpenChange={setIsAddFeeOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nova Taxa
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddFee}>
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Nova Taxa</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div>
                                                <Label htmlFor="acquirer_id">Maquininha</Label>
                                                <Select name="acquirer_id" required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a máquina..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {groupedAcquirers.map(acquirer => (
                                                            <SelectItem key={acquirer.id} value={acquirer.id}>
                                                                {acquirer.name}
                                                                {acquirer.receiptDays === 30 && " (D+30)"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="method">Método</Label>
                                                <Select name="method" required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="debit_card">Débito</SelectItem>
                                                        <SelectItem value="credit_card">Crédito</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="card_brand_id">Bandeira</Label>
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="h-auto p-0 text-xs"
                                                        onClick={() => {
                                                            setIsAddFeeOpen(false)
                                                            setIsAddBrandOpen(true)
                                                        }}
                                                    >
                                                        + Nova Bandeira
                                                    </Button>
                                                </div>
                                                <Select name="card_brand_id" required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {cardBrands.map(brand => (
                                                            <SelectItem key={brand.id} value={brand.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                                                    {brand.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="installments">Parcelas</Label>
                                                <Input
                                                    id="installments"
                                                    name="installments"
                                                    type="number"
                                                    min="1"
                                                    max={paymentSettings.max_installments}
                                                    defaultValue="1"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="fee_percent">Taxa (%)</Label>
                                                <Input
                                                    id="fee_percent"
                                                    name="fee_percent"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    defaultValue="0"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={loading}>
                                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                Criar
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-12">
                            {groupedAcquirers.map(acquirer => (
                                <div key={acquirer.id} className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                                            {acquirer.name}
                                        </h3>
                                        <Badge variant="outline" className={cn(
                                            "font-bold uppercase text-[9px]",
                                            acquirer.receiptDays === 1 ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                        )}>
                                            Recebe em D+{acquirer.receiptDays}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {acquirer.groups.map((group, idx) => (
                                            <div key={idx} className="space-y-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                                                    <div className="flex -space-x-2">
                                                        {group.brands.map(b => (
                                                            <div key={b.id} className="bg-white p-1.5 rounded-full shadow-sm border border-slate-100" title={b.name}>
                                                                <CreditCard className="h-4 w-4 text-primary" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">
                                                            {group.brands.map(b => b.name).join(' / ')}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                                            Estrutura Compartilhada
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                    <Table>
                                                        <TableHeader className="bg-slate-50/50">
                                                            <TableRow>
                                                                <TableHead className="text-[11px] font-bold uppercase py-2">Método</TableHead>
                                                                <TableHead className="text-[11px] font-bold uppercase py-2">Parcelas</TableHead>
                                                                <TableHead className="text-[11px] font-bold uppercase py-2 text-right">Taxa (%)</TableHead>
                                                                <TableHead className="text-[11px] font-bold uppercase py-2 text-right w-[80px]">Ação</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {group.fees.map((fee) => {
                                                                const isEditing = editingId === `${acquirer.id}-${group.brands.map(b => b.id).join('-')}-${fee.method}-${fee.installments}`;
                                                                return (
                                                                    <TableRow key={fee.id} className="hover:bg-slate-50/30 transition-colors">
                                                                        <TableCell className="py-2.5 font-medium text-slate-700">
                                                                            {formatMethod(fee.method)}
                                                                        </TableCell>
                                                                        <TableCell className="py-2.5 text-slate-600">
                                                                            {fee.installments}x
                                                                        </TableCell>
                                                                        <TableCell className="py-2.5 text-right font-mono text-slate-900">
                                                                            {isEditing ? (
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    value={editValue}
                                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                                    className="w-20 h-7 text-right ml-auto"
                                                                                    autoFocus
                                                                                />
                                                                            ) : (
                                                                                <span className="font-bold text-primary">{fee.fee_percent}%</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="py-2.5 text-right uppercase text-[10px] font-bold">
                                                                            {isEditing ? (
                                                                                <div className="flex justify-end gap-1">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                                        onClick={() => handleSaveGroup(
                                                                                            fee.method,
                                                                                            fee.installments,
                                                                                            group.brands.map(b => b.id),
                                                                                            editValue,
                                                                                            acquirer.id
                                                                                        )}
                                                                                        disabled={loading}
                                                                                    >
                                                                                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        className="h-7 px-2 text-slate-400"
                                                                                        onClick={() => setEditingId(null)}
                                                                                    >
                                                                                        ✖
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <Button
                                                                                    size="icon"
                                                                                    variant="ghost"
                                                                                    onClick={() => {
                                                                                        setEditingId(`${acquirer.id}-${group.brands.map(b => b.id).join('-')}-${fee.method}-${fee.installments}`)
                                                                                        setEditValue(fee.fee_percent.toString())
                                                                                    }}
                                                                                    className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
                                                                                >
                                                                                    <Pencil className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="brands">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Bandeiras de Cartão</CardTitle>
                                <CardDescription>
                                    Gerencie as bandeiras de cartão aceitas pela sua clínica
                                </CardDescription>
                            </div>
                            <Dialog open={isAddBrandOpen} onOpenChange={setIsAddBrandOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nova Bandeira
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddBrand}>
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Bandeira</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div>
                                                <Label htmlFor="name">Nome</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    placeholder="Ex: Visa, Mastercard..."
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>Estilo visual</Label>
                                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-dashed">
                                                    <CreditCard className="h-5 w-5 text-primary" />
                                                    <span className="text-xs text-slate-500 italic">Padrão Lucide Ativado</span>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={loading}>
                                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                Criar
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cardBrands.map((brand) => (
                                <Card key={brand.id} className="relative">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-full">
                                                    <CreditCard className="h-5 w-5 text-primary" />
                                                </div>
                                                <CardTitle className="text-base">{brand.name}</CardTitle>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteBrand(brand.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-slate-500">
                                            {fees.filter(f => f.card_brand?.id === brand.id).length} taxas configuradas
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
