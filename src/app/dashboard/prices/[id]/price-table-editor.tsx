"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updatePriceTableItem } from "../actions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Search, Save, Check } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

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

    const handlePriceChange = async (serviceId: string, newValue: number | null | undefined) => {
        // Optimistic update
        const updatedItems = items.map(item => {
            if (item.service_id === serviceId) {
                return { ...item, custom_price: newValue ?? null }
            }
            return item
        })
        setItems(updatedItems)

        // Identify if change is real (debounce or blur would be better, but for now strict on change?)
        // Actually, CurrencyInput triggers this on every keystroke usually, but let's assume we want to save on blur mostly.
        // However, `CurrencyInput` from `react-currency-input-field` might be tricky with just onValueChange for saving.
        // Let's rely on a separate "Save" action for each row to be safe/explicit, OR auto-save.
        // Auto-save is better. Let's do it.

        setIsSaving(serviceId)
        try {
            const result = await updatePriceTableItem(tableId, serviceId, newValue ?? null)
            if (result.error) {
                toast.error("Erro ao salvar preço")
                // Revert?
            } else {
                // Success
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setIsSaving(null)
        }
    }

    // Filter items
    const filteredItems = items.filter(item =>
        item.service_title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Card>
            <CardContent className="p-6 space-y-4">
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
