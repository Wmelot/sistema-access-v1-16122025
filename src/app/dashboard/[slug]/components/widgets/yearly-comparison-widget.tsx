import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics, getYearlyMetrics } from "../../actions"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type MetricType = 'appointments' | 'revenue' | 'completed'

interface YearlyComparisonWidgetProps {
    data: DashboardMetrics['yearly_comparison']
    professionals?: any[]
    permissions?: string[]
    currentUser?: any
}

export function YearlyComparisonWidget({ data: initialData, professionals = [], permissions = [], currentUser }: YearlyComparisonWidgetProps) {
    const [metric, setMetric] = useState<MetricType>('appointments')
    const [data, setData] = useState(initialData)
    const [selectedProfessional, setSelectedProfessional] = useState<string>('current')
    const [isPending, startTransition] = useTransition()

    const canFilter = permissions.includes('roles.manage') || permissions.includes('financial.view_clinic')

    const handleProfessionalChange = (value: string) => {
        setSelectedProfessional(value)
        startTransition(async () => {
            const profId = value === 'all' ? 'all' : (value === 'current' ? null : value)
            const newData = await getYearlyMetrics(profId)
            if (newData) setData(newData)
        })
    }

    // Determine Line Color
    let lineColor = '#3b82f6' // Default Blue

    if (selectedProfessional === 'current') {
        if (currentUser) {
            // Check both potential property names
            const userColor = currentUser.professional_profile_color || currentUser.color
            if (userColor) lineColor = userColor
        }
    } else if (selectedProfessional !== 'all') {
        const prof = professionals.find(p => p.id === selectedProfessional)
        if (prof) {
            const profColor = prof.professional_profile_color || prof.color
            if (profColor) lineColor = profColor
        }
    }

    if (!data) return null

    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    const chartData = MONTHS.map((month, index) => ({
        name: month,
        current: data[metric]?.current[index] || 0,
        last: data[metric]?.last[index] || 0,
    }))

    const totalCurrent = data[metric]?.current.reduce((a, b) => a + b, 0) || 0
    const totalLast = data[metric]?.last.reduce((a, b) => a + b, 0) || 0
    const showLastYear = totalLast > 0

    const formatValue = (val: number) => {
        if (metric === 'revenue') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
        return val
    }

    return (
        <Card className="h-full flex flex-col relative">
            {isPending && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex flex-col">
                    <CardTitle className="text-sm font-medium">Comparativo Anual</CardTitle>
                    {canFilter && selectedProfessional !== 'current' && (
                        <span className="text-[10px] text-muted-foreground">
                            {selectedProfessional === 'all' ? 'Todos os Profissionais' : professionals.find(p => p.id === selectedProfessional)?.full_name}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {canFilter && (
                        <Select value={selectedProfessional} onValueChange={handleProfessionalChange}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Profissional" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="current">Meu Perfil</SelectItem>
                                <SelectItem value="all">Todos</SelectItem>
                                {professionals.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.professional_profile_color || p.color || '#3b82f6' }} />
                                            {p.full_name?.split(' ')[0]}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
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
                    <span className="font-semibold" style={{ color: lineColor }}>{currentYear}: {formatValue(totalCurrent)}</span>
                    {showLastYear && <span className="font-semibold text-gray-700">{lastYear}: {formatValue(totalLast)}</span>}
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <defs>
                                <filter id={`lineShadow-${lineColor}`} x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#374151', fontSize: 10 }} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => metric === 'revenue' ? `R$${val / 1000}k` : val} tick={{ fill: '#374151', fontSize: 10 }} />
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
                                    stroke="#4b5563"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#4b5563', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    filter={`url(#lineShadow-${lineColor})`}
                                />
                            )}
                            <Line
                                type="monotone"
                                name={String(currentYear)}
                                dataKey="current"
                                stroke={lineColor}
                                strokeWidth={2}
                                dot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                filter={`url(#lineShadow-${lineColor})`}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
