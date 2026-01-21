"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Assuming these exist, check Task
import { useState, useEffect } from "react"
import { getDREData, DRELineItem } from "./actions"
import { Loader2, Download } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DREPage() {
    const [year, setYear] = useState(new Date().getFullYear().toString())
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))
    const [viewType, setViewType] = useState<'managerial' | 'fiscal'>('managerial')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DRELineItem[]>([])

    // Years gen
    const years = [2024, 2025, 2026]

    async function fetchData() {
        setLoading(true)
        try {
            // Calculate start/end of month
            const firstDay = `${year}-${month}-01`
            const lastDay = new Date(Number(year), Number(month), 0).toISOString().split('T')[0] // Last day of month

            const result = await getDREData(firstDay, lastDay, viewType)
            setData(result)
        } catch (e: any) {
            toast.error("Erro ao carregar DRE: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [year, month, viewType])

    // Helper to format currency
    const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">DRE - Demonstrativo de Resultado</h2>
                    <p className="text-muted-foreground">
                        Análise de competência mensal (Receitas vs Despesas).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={viewType} onValueChange={(v: any) => setViewType(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="managerial">🖥️ Gerencial (Real)</SelectItem>
                            <SelectItem value="fiscal">🏛️ Fiscal (Notas)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="01">Janeiro</SelectItem>
                            <SelectItem value="02">Fevereiro</SelectItem>
                            <SelectItem value="03">Março</SelectItem>
                            <SelectItem value="04">Abril</SelectItem>
                            <SelectItem value="05">Maio</SelectItem>
                            <SelectItem value="06">Junho</SelectItem>
                            <SelectItem value="07">Julho</SelectItem>
                            <SelectItem value="08">Agosto</SelectItem>
                            <SelectItem value="09">Setembro</SelectItem>
                            <SelectItem value="10">Outubro</SelectItem>
                            <SelectItem value="11">Novembro</SelectItem>
                            <SelectItem value="12">Dezembro</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" title="Exportar">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="bg-muted/10 pb-4">
                    <CardTitle>Resultado do Período</CardTitle>
                    <CardDescription>
                        Visualização {viewType === 'managerial' ? 'Gerencial' : 'Fiscal'} de {month}/{year}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="divide-y">
                            {data.map((item, idx) => (
                                <DRERow key={idx} item={item} fmt={fmt} isRoot />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function DRERow({ item, fmt, isRoot = false }: { item: DRELineItem, fmt: (v: number) => string, isRoot?: boolean }) {
    return (
        <div className={cn(
            "flex flex-col",
            isRoot ? "bg-card" : "bg-muted/5"
        )}>
            <div className={cn(
                "flex justify-between items-center py-3 px-6",
                item.isBold ? "font-bold text-base" : "text-sm",
                item.type === 'total' ? "bg-muted/20 border-t border-b" : ""
            )}>
                <span>{item.label}</span>
                <span className={cn(
                    item.type === 'debit' ? "text-red-600" :
                        item.type === 'credit' ? "text-green-600" :
                            "text-foreground"
                )}>
                    {item.type === 'debit' && item.value > 0 ? '-' : ''} {fmt(item.value)}
                </span>
            </div>

            {item.children && item.children.length > 0 && (
                <div className="pl-4 border-l-4 border-muted/20 ml-6 bg-muted/5">
                    {item.children.map((child, idx) => (
                        <DRERow key={idx} item={child} fmt={fmt} />
                    ))}
                </div>
            )}
        </div>
    )
}
