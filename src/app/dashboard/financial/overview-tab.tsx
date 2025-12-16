"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { getFinancialSummary } from "./actions"
import { Loader2, Wallet, Building2, CreditCard as CreditCardIcon, TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"

export function OverviewTab() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        fetchData()
    }, [date])

    const fetchData = async () => {
        setLoading(true)
        const result = await getFinancialSummary(date)
        setData(result)
        setLoading(false)
    }

    const formatCurrency = (val: number) => {
        if (!isVisible) return "R$ ••••••"
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Resumo Financeiro</h2>
                        <p className="text-sm text-muted-foreground">Visão acumulada até a data selecionada.</p>
                    </div>
                    <button
                        onClick={() => setIsVisible(!isVisible)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-muted-foreground"
                        title={isVisible ? "Ocultar valores" : "Mostrar valores"}
                    >
                        {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                </div>
                <div className="w-full sm:w-[180px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Data de referência</Label>
                    <DateInput
                        value={date}
                        onChange={(val) => setDate(val)}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Main Balance Card */}
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 shadow-lg">
                <CardContent className="p-8">
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-300 font-medium text-sm uppercase tracking-wider">Saldo Geral Disponível</span>
                        {loading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                                    {formatCurrency(data?.totalBalance)}
                                </span>
                            </div>
                        )}
                        <div className="mt-4 flex gap-6 text-sm text-slate-300">
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-green-400" />
                                <span>Entradas: {formatCurrency(data?.income)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendingDown className="h-4 w-4 text-red-400" />
                                <span>Saídas: {formatCurrency(data?.expense)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Accounts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {/* Dinheiro (Físico) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dinheiro em Caixa</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                            <div className="text-2xl font-bold text-gray-800">
                                {formatCurrency(data?.accounts?.cash)}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Recebimentos em espécie
                        </p>
                    </CardContent>
                </Card>

                {/* Banco (C6 Simulator) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conta Bancária (Pix/Débito)</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                            <div className={`text-2xl font-bold ${data?.accounts?.bank < 0 && isVisible ? 'text-red-600' : 'text-gray-800'}`}>
                                {formatCurrency(data?.accounts?.bank)}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Considerando despesas debitadas
                        </p>
                    </CardContent>
                </Card>

                {/* Crédito (Recebíveis) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recebíveis (Crédito)</CardTitle>
                        <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(data?.accounts?.future)}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Valores parcelados a receber
                        </p>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
