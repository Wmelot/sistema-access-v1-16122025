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

    const handleEdit = (fee: Fee) => {
        setEditingId(fee.id)
        setEditValue(fee.fee_percent.toString())
    }

    const handleSave = async (id: string) => {
        const val = parseFloat(editValue)
        if (isNaN(val) || val < 0) {
            toast.error("Valor inválido")
            return
        }

        setLoading(true)
        const res = await updatePaymentFee(id, val)
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Taxa atualizada!")
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

    // Group fees by brand
    const feesByBrand = fees.reduce((acc, fee) => {
        const brandKey = fee.card_brand?.id || 'no_brand'
        if (!acc[brandKey]) {
            acc[brandKey] = {
                brand: fee.card_brand,
                fees: []
            }
        }
        acc[brandKey].fees.push(fee)
        return acc
    }, {} as Record<string, { brand?: CardBrand, fees: Fee[] }>)

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
                                            <div>
                                                <Label htmlFor="card_brand_id">Bandeira</Label>
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
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(feesByBrand).map(([brandKey, { brand, fees: brandFees }]) => (
                                <div key={brandKey} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b pb-2">
                                        {brand ? (
                                            <>
                                                <CreditCard className="h-4 w-4 text-primary" />
                                                <span>{brand.name}</span>
                                            </>
                                        ) : (
                                            <span>Sem Bandeira (Legado)</span>
                                        )}
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Método</TableHead>
                                                <TableHead>Parcelas</TableHead>
                                                <TableHead>Taxa (%)</TableHead>
                                                <TableHead className="w-[100px]">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {brandFees.map((fee) => (
                                                <TableRow key={fee.id}>
                                                    <TableCell className="font-medium">{formatMethod(fee.method)}</TableCell>
                                                    <TableCell>{fee.installments}x</TableCell>
                                                    <TableCell>
                                                        {editingId === fee.id ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="w-24 h-8"
                                                            />
                                                        ) : (
                                                            <span>{fee.fee_percent}%</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingId === fee.id ? (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleSave(fee.id)}
                                                                    disabled={loading}
                                                                >
                                                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                                                                </Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-1">
                                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(fee)} className="h-8 w-8">
                                                                    <Pencil className="h-4 w-4 text-slate-400" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleDeleteFee(fee.id)}
                                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
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
