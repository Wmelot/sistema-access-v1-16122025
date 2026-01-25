"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { updatePriceTableItem, bulkUpdatePriceTableItems } from "../actions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Search, Save, Check, Percent, Calculator, Info } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface PriceTableItem {
    service_id: string
    service_title: string
    default_price: number
    custom_price: number | null
    item_id: string | null
}

interface PriceTableEditorProps {
    tableId: string
    initialItems: PriceTableItem[]
}

export function PriceTableEditor({ tableId, initialItems }: PriceTableEditorProps) {
    const router = useRouter()
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState("")
    const [isSaving, setIsSaving] = useState<string | null>(null) // ID of item being saved
    const [isBulkLoading, setIsBulkLoading] = useState(false)
    const [adjustmentPercent, setAdjustmentPercent] = useState<string>("")
    const [adjustmentMode, setAdjustmentMode] = useState<"discount" | "increase">("discount")

    const handlePriceChange = async (serviceId: string, newValue: number | null | undefined) => {
        // Optimistic update
        const updatedItems = items.map(item => {
            if (item.service_id === serviceId) {
                return { ...item, custom_price: newValue ?? null }
            }
            return item
        })
        setItems(updatedItems)

        setIsSaving(serviceId)
        try {
            const result = await updatePriceTableItem(tableId, serviceId, newValue ?? null)
            if (result.error) {
                toast.error("Erro ao salvar preço")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setIsSaving(null)
        }
    }

    const applyBulkAdjustment = async () => {
        const percent = parseFloat(adjustmentPercent)
        if (isNaN(percent)) {
            toast.error("Informe um percentual válido")
            return
        }

        setIsBulkLoading(true)
        const toastId = toast.loading("Aplicando reajuste...")

        try {
            // Calculate new prices
            const newOverrides = items.map(item => {
                // Apply percentage based on mode
                let factor = 1
                if (adjustmentMode === "discount") {
                    factor = (100 - percent) / 100
                } else {
                    factor = (100 + percent) / 100
                }

                const rawNewPrice = item.default_price * factor
                const roundedNewPrice = Math.ceil(rawNewPrice)

                return {
                    service_id: item.service_id,
                    price: roundedNewPrice
                }
            })

            const result = await bulkUpdatePriceTableItems(tableId, newOverrides)

            if (result.error) {
                toast.error(result.error, { id: toastId })
            } else {
                toast.success("Reajuste aplicado a todos os serviços!", { id: toastId })
                // Update local state
                setItems(prev => prev.map(item => {
                    const override = newOverrides.find(o => o.service_id === item.service_id)
                    return { ...item, custom_price: override?.price ?? null }
                }))
                setAdjustmentPercent("")
            }
        } catch (error) {
            toast.error("Erro ao aplicar reajuste", { id: toastId })
        } finally {
            setIsBulkLoading(false)
        }
    }

    // Filter items
    const filteredItems = items.filter(item =>
        item.service_title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Card>
            <CardContent className="p-6 space-y-6">
                {/* Ferramenta de Reajuste em Massa */}
                <div className="bg-muted/30 p-4 rounded-lg border border-primary/20 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Calculator className="h-4 w-4" />
                            Reajuste de Preços em Massa
                        </div>
                        <Tabs
                            value={adjustmentMode}
                            onValueChange={(v) => setAdjustmentMode(v as any)}
                        >
                            <TabsList className="h-8 p-0.5">
                                <TabsTrigger value="discount" className="text-[10px] px-3 h-7">Desconto</TabsTrigger>
                                <TabsTrigger value="increase" className="text-[10px] px-3 h-7">Acréscimo</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5 flex-1 max-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                {adjustmentMode === "discount" ? "Percentual de Desconto" : "Percentual de Acréscimo"}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            {adjustmentMode === "discount"
                                                ? "O valor será reduzido em relação ao Preço Padrão."
                                                : "O valor será aumentado em relação ao Preço Padrão."}
                                            <br />
                                            O resultado será sempre <strong>arredondado para cima</strong>.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="Ex: 10"
                                    className="pr-8"
                                    value={adjustmentPercent}
                                    onChange={(e) => setAdjustmentPercent(e.target.value)}
                                    disabled={isBulkLoading}
                                />
                                <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                        <Button
                            onClick={applyBulkAdjustment}
                            disabled={isBulkLoading || !adjustmentPercent}
                            size="sm"
                            className={cn(
                                "gap-2",
                                adjustmentMode === "discount" ? "bg-primary" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            )}
                        >
                            {isBulkLoading ? "Processando..." : `Aplicar ${adjustmentMode === "discount" ? "Desconto" : "Aumento"}`}
                        </Button>
                        <p className="text-[11px] text-muted-foreground italic flex-1 min-w-[200px]">
                            * Este ajuste substitui todos os preços personalizados atuais desta tabela pelos novos valores calculados.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar serviço..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground ml-auto">
                        <strong>{filteredItems.length}</strong> serviços encontrados
                    </div>
                </div>

                <div className="rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Serviço</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[200px]">Preço Padrão</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[250px]">Preço na Tabela</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.service_id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">
                                        {item.service_title}
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.default_price)}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-full">
                                                <CurrencyInput
                                                    value={item.custom_price !== null ? item.custom_price : ''}
                                                    placeholder="Usar Padrão"
                                                    onValueChange={(val) => handlePriceChange(item.service_id, val)}
                                                    className={item.custom_price !== null ? "font-semibold border-primary/50 bg-primary/5" : ""}
                                                />
                                                {isSaving === item.service_id && (
                                                    <span className="absolute right-2 top-2.5 animate-spin">
                                                        ⏳
                                                    </span>
                                                )}
                                            </div>
                                            {item.custom_price !== null && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Restaurar Padrão"
                                                    onClick={() => handlePriceChange(item.service_id, null)}
                                                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                                >
                                                    <span className="sr-only">Limpar</span>
                                                    ✖
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                        Nenhum serviço encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
