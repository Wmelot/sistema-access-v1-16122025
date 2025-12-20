
'use client'



import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts' // Changed to LineChart
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type MetricType = 'appointments' | 'revenue' | 'completed'

export function YearlyComparisonWidget({ data }: { data: DashboardMetrics['yearly_comparison'] }) {
    const [metric, setMetric] = useState<MetricType>('appointments')

    if (!data) return null

    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    // Prepare Chart Data based on selected metric
    const chartData = MONTHS.map((month, index) => ({
        name: month,
        current: data[metric]?.current[index] || 0,
        last: data[metric]?.last[index] || 0,
    }))

    const totalCurrent = data[metric]?.current.reduce((a, b) => a + b, 0) || 0
    const totalLast = data[metric]?.last.reduce((a, b) => a + b, 0) || 0

    // Check if Last Year has any data to decide if we show its line
    const showLastYear = totalLast > 0

    const formatValue = (val: number) => {
        if (metric === 'revenue') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
        }
        return val
    }

    const metricLabels = {
        appointments: 'Agendamentos',
        revenue: 'Faturamento',
        completed: 'Atendimentos Realizados'
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Comparativo Anual</CardTitle>
                <div className="flex items-center gap-2">
                    <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="appointments">Agendamentos</SelectItem>
                            <SelectItem value="revenue">Faturamento</SelectItem>
                            <SelectItem value="completed">Atendimentos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-2">
                <div className="flex justify-end text-xs text-muted-foreground space-x-3 mb-2">
                    <span className="font-semibold text-blue-500">{currentYear}: {formatValue(totalCurrent)}</span>
                    {showLastYear && <span className="font-semibold text-gray-400">{lastYear}: {formatValue(totalLast)}</span>}
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => metric === 'revenue' ? `R$${val / 1000}k` : val} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                                formatter={(val: any) => [formatValue(Number(val) || 0), '']}
                                labelStyle={{ color: '#6b7280', marginBottom: '0.25rem' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            {showLastYear && (
                                <Line
                                    type="monotone"
                                    name={String(lastYear)}
                                    dataKey="last"
                                    stroke="#e5e7eb"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#e5e7eb', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            )}
                            <Line
                                type="monotone"
                                name={String(currentYear)}
                                dataKey="current"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
