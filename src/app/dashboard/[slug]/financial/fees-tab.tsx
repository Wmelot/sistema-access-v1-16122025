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
import { Loader2, Pencil, Plus, Trash2, CreditCard, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

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
    fee_fixed?: number
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
    const [editFixedValue, setEditFixedValue] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [activeGroupIdx, setActiveGroupIdx] = useState<Record<string, number>>({})
    const [isAddBrandOpen, setIsAddBrandOpen] = useState(false)
    const [isAddFeeOpen, setIsAddFeeOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const handleSaveGroup = async (method: string, installments: number, brandIds: string[], newValue: string, newFixedValue: string, acquirerId: string) => {
        const val = parseFloat(newValue)
        const fixedVal = parseFloat(newFixedValue || "0")

        if (isNaN(val) || val < 0 || isNaN(fixedVal) || fixedVal < 0) {
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

        const promises = feesToUpdate.map(f => updatePaymentFee(f.id, val, fixedVal))
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
        const result = await MySwal.fire({
            title: 'Desativar Bandeira?',
            text: "As taxas associadas à esta bandeira permanecerão, mas ela não estará mais disponível para novos agendamentos. Continuar?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, desativar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return

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
        const result = await MySwal.fire({
            title: 'Excluir Taxa?',
            text: "Tem certeza que deseja excluir esta taxa? Esta ação não pode ser desfeita.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return

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
                .map(f => `${f.method}:${f.installments}:${Number(f.fee_percent).toFixed(4)}:${Number(f.fee_fixed || 0).toFixed(4)}`).join('|');

            const siblings = cardBrands.filter(other => {
                if (other.id === brand.id || !other.active || processedBrandIds.has(other.id)) return false;
                const otherFees = acquirerFees.filter(f => f.card_brand?.id === other.id);
                const otherFingerprint = otherFees.sort((a, b) => a.method.localeCompare(b.method) || a.installments - b.installments)
                    .map(f => `${f.method}:${f.installments}:${Number(f.fee_percent).toFixed(4)}:${Number(f.fee_fixed || 0).toFixed(4)}`).join('|');
                return fingerprint === otherFingerprint;
            });

            const brandGroup = [brand, ...siblings];
            brandGroup.forEach(b => processedBrandIds.add(b.id));

            groupedFees.push({ brands: brandGroup, fees: brandFees });
        });

        return { id: aid, name, receiptDays, groups: groupedFees };
    }).filter(a => a.groups.length > 0) // Only show acquirers that actually have fees
        .sort((a, b) => b.groups.length - a.groups.length); // Show most populated first

    const handleNextGroup = (acquirerId: string, max: number) => {
        setActiveGroupIdx(prev => ({
            ...prev,
            [acquirerId]: ((prev[acquirerId] || 0) + 1) % max
        }));
    };

    const handlePrevGroup = (acquirerId: string, max: number) => {
        setActiveGroupIdx(prev => ({
            ...prev,
            [acquirerId]: ((prev[acquirerId] || 0) - 1 + max) % max
        }));
    };

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
                                            <div>
                                                <Label htmlFor="fee_fixed">Valor Fixo (R$)</Label>
                                                <Input
                                                    id="fee_fixed"
                                                    name="fee_fixed"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    defaultValue="0"
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
                        <div className="flex flex-wrap gap-8">
                            {groupedAcquirers.map(acquirer => (
                                <div key={acquirer.id} className="w-full lg:w-[calc(50%-1rem)] xl:w-[calc(50%-2rem)] space-y-6 min-w-[320px] flex-grow">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                                <div className="w-2 h-8 bg-blue-600 rounded-full" />
                                                {acquirer.name.toUpperCase()}
                                            </h3>
                                            <Badge variant="outline" className={cn(
                                                "font-bold uppercase text-[9px]",
                                                acquirer.receiptDays === 1 ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                            )}>
                                                Recebe em D+{acquirer.receiptDays}
                                            </Badge>
                                        </div>

                                        {acquirer.groups.length > 1 && (
                                            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-sm backdrop-blur-sm">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-white border shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95"
                                                    onClick={() => handlePrevGroup(acquirer.id, acquirer.groups.length)}
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </Button>
                                                <div className="flex flex-col items-center px-3 min-w-[60px]">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase leading-none mb-0.5">Variação</span>
                                                    <span className="text-[12px] font-black text-blue-600 leading-none">
                                                        {(activeGroupIdx[acquirer.id] || 0) + 1} / {acquirer.groups.length}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-white border shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95"
                                                    onClick={() => handleNextGroup(acquirer.id, acquirer.groups.length)}
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {(() => {
                                            const activeIdx = activeGroupIdx[acquirer.id] || 0;
                                            const group = acquirer.groups[activeIdx];
                                            if (!group) return null;

                                            return (
                                                <div className="space-y-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                                                        <div className="flex -space-x-2">
                                                            {group.brands.map(b => (
                                                                <div key={b.id} className="bg-white p-1.5 rounded-full shadow-sm border border-slate-100" title={b.name}>
                                                                    <CreditCard className="h-4 w-4 text-primary" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-900">
                                                                BANDEIRAS: {group.brands.map(b => b.name).join(' / ')}
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
                                                                    <TableHead className="text-[11px] font-bold uppercase py-2">Parc.</TableHead>
                                                                    <TableHead className="text-[11px] font-bold uppercase py-2 text-right">Taxa %</TableHead>
                                                                    <TableHead className="text-[11px] font-bold uppercase py-2 text-right">Fixo(R$)</TableHead>
                                                                    <TableHead className="text-[11px] font-bold uppercase py-2 text-right w-[60px]">Ação</TableHead>
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
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <Input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            value={editValue}
                                                                                            onChange={(e) => setEditValue(e.target.value)}
                                                                                            className="w-14 h-7 text-right text-xs"
                                                                                            autoFocus
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="font-bold text-slate-900">{fee.fee_percent}%</span>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="py-2.5 text-right font-mono text-slate-900">
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <Input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            value={editFixedValue}
                                                                                            onChange={(e) => setEditFixedValue(e.target.value)}
                                                                                            className="w-14 h-7 text-right text-xs"
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className={cn(
                                                                                        "text-[11px] font-bold",
                                                                                        fee.fee_fixed && fee.fee_fixed > 0 ? "text-blue-600" : "text-slate-500"
                                                                                    )}>
                                                                                        {fee.fee_fixed ? `R$ ${fee.fee_fixed.toFixed(2)}` : 'R$ 0,00'}
                                                                                    </span>
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
                                                                                                editFixedValue,
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
                                                                                            setEditFixedValue((fee.fee_fixed || 0).toString())
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
                                            );
                                        })()}
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
