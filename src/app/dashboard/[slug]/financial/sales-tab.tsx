"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { DateInput } from "@/components/ui/date-input"
import { getSalesAnalytics } from "./actions"
import { Loader2, TrendingUp, DollarSign, Package, TrendingDown, ShoppingCart, BarChart as BarChartIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line
} from 'recharts'

export function SalesTab() {
    const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    const fetchData = async () => {
        setLoading(true)
        const result = await getSalesAnalytics(startDate, endDate)
        setData(result)
        setLoading(false)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters */}
            <div className="flex flex-col sm:grid sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border shadow-sm items-end">
                <div className="sm:col-span-2 flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-slate-800">Análise de Vendas</h2>
                    <p className="text-xs text-muted-foreground">Desempenho de produtos e lucratividade no período.</p>
                </div>
                <div className="w-full">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Início</Label>
                    <DateInput value={startDate} onChange={setStartDate} className="bg-white w-full" />
                </div>
                <div className="w-full">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Fim</Label>
                    <DateInput value={endDate} onChange={setEndDate} className="bg-white w-full" />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-emerald-500 shadow-sm border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-tight text-slate-500">Receita Bruta</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">{formatCurrency(data?.totalRevenue)}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Package className="h-3 w-3" /> {data?.totalItems} itens vendidos
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-tight text-slate-500">Custo (CMV)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">{formatCurrency(data?.totalCost)}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">Custo total de aquisição/produção.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-tight text-slate-500">Lucro Bruto</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">{formatCurrency(data?.grossProfit)}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium text-emerald-600">
                            Margem de {data?.margin.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 shadow-sm border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-tight text-slate-500">Ticket Médio</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">{formatCurrency(data?.totalRevenue / (data?.totalItems || 1))}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Valor médio por item vendido.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-0">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" /> Histórico de Vendas (Diário)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data?.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(new Date(str), 'dd/MM')}
                                        tick={{ fontSize: 10 }}
                                        stroke="#94a3b8"
                                    />
                                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                    <Tooltip
                                        labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                                        formatter={(val: any) => [formatCurrency(val), 'Receita']}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-0">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChartIcon className="h-4 w-4 text-primary" /> Top Produtos (Receita)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={120}
                                        tick={{ fontSize: 10 }}
                                        stroke="#94a3b8"
                                    />
                                    <Tooltip
                                        formatter={(val: any) => [formatCurrency(val), 'Receita']}
                                    />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                        {data?.topProducts.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card className="shadow-sm border-0">
                <CardHeader>
                    <CardTitle className="text-sm font-bold">Listagem Detalhada de Itens Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="text-left p-4">Produto</th>
                                        <th className="text-center p-4">Quantidade</th>
                                        <th className="text-right p-4">Receita</th>
                                        <th className="text-right p-4">Custo</th>
                                        <th className="text-right p-4">Margem R$</th>
                                        <th className="text-right p-4">Margem %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.topProducts.map((p: any) => (
                                        <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{p.name}</td>
                                            <td className="p-4 text-center font-medium text-slate-600">{p.quantity}</td>
                                            <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(p.revenue)}</td>
                                            <td className="p-4 text-right text-slate-500">{formatCurrency(p.cost)}</td>
                                            <td className="p-4 text-right font-medium text-slate-700">{formatCurrency(p.revenue - p.cost)}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${((p.revenue - p.cost) / p.revenue) > 0.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {(((p.revenue - p.cost) / p.revenue) * 100).toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data?.topProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground italic">Nenhuma venda registrada no período selecionado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
