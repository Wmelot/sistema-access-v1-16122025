
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function YearlyComparisonWidget({ data }: { data: DashboardMetrics['yearly_comparison'] }) {
    if (!data) return null

    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    const chartData = MONTHS.map((month, index) => ({
        name: month,
        current: data.current_year[index] || 0,
        last: data.last_year[index] || 0,
    }))

    const totalCurrent = data.current_year.reduce((a, b) => a + b, 0)
    const totalLast = data.last_year.reduce((a, b) => a + b, 0)

    return (
        <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Comparativo Anual</CardTitle>
                <div className="text-xs text-muted-foreground space-x-2">
                    <span className="font-semibold text-blue-500">{currentYear}: {totalCurrent}</span>
                    <span className="font-semibold text-gray-400">{lastYear}: {totalLast}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Legend />
                            <Bar name={String(lastYear)} dataKey="last" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                            <Bar name={String(currentYear)} dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
