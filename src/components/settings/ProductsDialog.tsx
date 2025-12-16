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
import { createProduct, updateProduct } from "@/app/dashboard/products/actions"
import { useState } from "react"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/ui/currency-input"

interface ProductDialogProps {
    product?: {
        id: string
        name: string
        price: number
        stock_quantity: number
        is_unlimited?: boolean
    }
}

export function ProductsDialog({ product }: ProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [isUnlimited, setIsUnlimited] = useState(product?.is_unlimited || false)
    const [price, setPrice] = useState(product?.price || 0)

    async function handleSubmit(formData: FormData) {
        const action = product ? updateProduct.bind(null, product.id) : createProduct
        const result = await action(formData)

        if (result?.error) {
            toast.error("Erro ao salvar produto.")
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

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_unlimited"
                            name="is_unlimited"
                            checked={isUnlimited}
                            onCheckedChange={(c) => setIsUnlimited(!!c)}
                        />
                        <Label htmlFor="is_unlimited" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Estoque Infinito / Sob Encomenda
                        </Label>
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
                            <Label htmlFor="price">Preço Venda (R$)</Label>
                            <CurrencyInput
                                id="price"
                                placeholder="0,00"
                                value={price}
                                onValueChange={(val) => setPrice(val || 0)}
                            />
                            <input type="hidden" name="price" value={price} />
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
