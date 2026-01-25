"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Plus } from "lucide-react"
import { createProduct, updateProduct } from "@/app/dashboard/[slug]/products/actions"
import { useState } from "react"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/ui/currency-input"

interface ProductDialogProps {
    product?: {
        id: string
        name: string
        base_price: number
        cost_price?: number
        stock_quantity: number
        is_unlimited?: boolean
        is_variable_cost?: boolean
        target_markup?: number
    }
}

export function ProductsDialog({ product }: ProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [isUnlimited, setIsUnlimited] = useState(product?.is_unlimited || false)
    const [isVariableCost, setIsVariableCost] = useState(product?.is_variable_cost || false)
    const [price, setPrice] = useState(product?.base_price || 0)
    const [costPrice, setCostPrice] = useState(product?.cost_price || 0)
    const [targetMarkup, setTargetMarkup] = useState(product?.target_markup || 2.0)

    const currentMarkup = costPrice > 0 ? price / costPrice : 0

    // Dynamic logic for Markup Status based on Target
    const getMarkupStatus = () => {
        if (currentMarkup === 0) return { label: "BAIXO", color: "bg-red-100 text-red-700", status: "low" }

        // If current is less than 80% of target -> Below Target
        if (currentMarkup < targetMarkup * 0.8) {
            return { label: "BAIXO", color: "bg-red-100 text-red-700", status: "low" }
        }

        // If current is between 80% and 100% of target -> Near Target
        if (currentMarkup < targetMarkup) {
            return { label: "ALERTA", color: "bg-amber-100 text-amber-700", status: "warning" }
        }

        // If current >= target -> Goal Achieved
        return { label: "SAUDÁVEL", color: "bg-green-100 text-green-700", status: "healthy" }
    }

    const mStat = getMarkupStatus()
    const markupStatus = mStat.status as "low" | "high" | "healthy" | "warning"

    async function handleSubmit(formData: FormData) {
        const action = product ? updateProduct.bind(null, product.id) : createProduct
        const result = await action(formData)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(product ? "Produto atualizado!" : "Produto criado!")
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {product ? (
                    <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button size="sm" className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Novo Produto
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                    <DialogDescription>
                        {product ? 'Atualize o estoque e valores.' : 'Adicione um item ao estoque.'}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Produto</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Bandagem Elástica"
                            defaultValue={product?.name}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-3 p-3 border rounded-lg bg-zinc-50/50">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_unlimited"
                                name="is_unlimited"
                                checked={isUnlimited}
                                onCheckedChange={(c) => setIsUnlimited(!!c)}
                            />
                            <Label htmlFor="is_unlimited" className="text-sm font-medium leading-none cursor-pointer">
                                Estoque Infinito / Sob Encomenda
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_variable_cost"
                                name="is_variable_cost"
                                checked={isVariableCost}
                                onCheckedChange={(c) => setIsVariableCost(!!c)}
                            />
                            <Label htmlFor="is_variable_cost" className="text-sm font-medium leading-none cursor-pointer">
                                Produto com Custo Variável
                            </Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="stock_quantity">Estoque Atual</Label>
                            <Input
                                id="stock_quantity"
                                name="stock_quantity"
                                type="number"
                                defaultValue={product?.stock_quantity || 0}
                                required
                                disabled={isUnlimited}
                                className={isUnlimited ? "opacity-50" : ""}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cost_price">{isVariableCost ? 'Custo Estimado (R$)' : 'Preço Custo (R$)'}</Label>
                            <CurrencyInput
                                id="cost_price"
                                placeholder="0,00"
                                value={costPrice}
                                onValueChange={(val) => setCostPrice(val || 0)}
                            />
                            <input type="hidden" name="cost_price" value={costPrice} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">Preço Venda (R$)</Label>
                            <CurrencyInput
                                id="price"
                                placeholder="0,00"
                                value={price}
                                onValueChange={(val) => setPrice(val || 0)}
                            />
                            <input type="hidden" name="base_price" value={price} />
                        </div>

                        <div className="col-span-2 grid gap-2 p-3 bg-primary/5 rounded-md border border-primary/20">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="target_markup" className="flex items-center gap-1">
                                    Markup Atual
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${mStat.color}`}>
                                        {mStat.label}
                                    </span>
                                </Label>
                                <span className="text-sm font-mono font-bold">{currentMarkup.toFixed(2)}x</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                * O markup é a relação entre o preço de venda e o custo.
                                {mStat.status === 'low' && ' Cuidado: Margem muito baixa, pode não cobrir custos fixos.'}
                                {mStat.status === 'warning' && ' Quase lá: Você está próximo, mas ainda abaixo da sua meta.'}
                                {mStat.status === 'healthy' && ' Excelente: Seu markup atingiu ou superou a meta definida.'}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <Label className="text-xs shrink-0">Meta de Markup:</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    name="target_markup"
                                    value={targetMarkup}
                                    onChange={(e) => setTargetMarkup(Number(e.target.value))}
                                    className="h-8 w-20 text-xs"
                                    placeholder="2.0"
                                />
                                {costPrice > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[10px] px-2"
                                        onClick={() => setPrice(Math.ceil(costPrice * targetMarkup))}
                                    >
                                        Sugerir Preço (R$ {(costPrice * targetMarkup).toFixed(2)})
                                    </Button>
                                )}
                            </div>
                            {/* Hidden field for is_variable_cost because checkbox doesn't always send if not 'on' */}
                            <input type="hidden" name="is_variable_cost" value={isVariableCost ? 'on' : 'off'} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Salvar Produto</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
