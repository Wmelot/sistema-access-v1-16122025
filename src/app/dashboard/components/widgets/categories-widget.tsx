
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { DashboardMetrics } from "../../actions"

// Bright Palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function CategoriesWidget({ data }: { data: DashboardMetrics['categories'] }) {
    if (!data || data.length === 0) return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Sem dados.</CardContent>
        </Card>
    )

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
                                </filter>
                            </defs>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="name"
                                labelLine={false}
                                filter="url(#shadow)"
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    const p = percent || 0
                                    // Hide label if less than 8% to avoid clutter
                                    if (p < 0.08) return null
                                    const RADIAN = Math.PI / 180;
                                    const ma = midAngle || 0
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-ma * RADIAN);
                                    const y = cy + radius * Math.sin(-ma * RADIAN);

                                    return (
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                                            {`${(p * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#333', fontWeight: '500' }}
                                formatter={(value: number, name: string, props: any) => {
                                    const total = data.reduce((a, b) => a + (b.count || 0), 0)
                                    const percent = total > 0 ? (value / total) * 100 : 0
                                    return [`${value} (${percent.toFixed(0)}%)`, name]
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
