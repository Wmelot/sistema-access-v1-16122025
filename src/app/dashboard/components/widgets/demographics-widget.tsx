
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export function DemographicsWidget({ data }: { data: DashboardMetrics['demographics'] }) {
    if (!data) return null
    if (data.total === 0) return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Demografia</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Sem dados.</CardContent>
        </Card>
    )

    const chartData = [
        { name: 'Homens', value: data.men, color: '#3b82f6' }, // blue-500
        { name: 'Mulheres', value: data.women, color: '#ec4899' }, // pink-500
        { name: 'Crianças', value: data.children, color: '#10b981' }, // emerald-500
    ].filter(d => d.value > 0)

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Demografia</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                    Total: {data.total} atendimentos
                </div>
            </CardContent>
        </Card>
    )
}
