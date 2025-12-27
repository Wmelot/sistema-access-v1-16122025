'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Loader2, TrendingUp } from 'lucide-react'
import { getPatientStats } from '@/app/dashboard/assessments/assessment-actions'

export function EvolutionCharts({ patientId }: { patientId: string }) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            if (!patientId) return
            const res = await getPatientStats(patientId)
            if (res.success) {
                setData(res.data)
            }
            setLoading(false)
        }
        fetchStats()
    }, [patientId])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    if (data.length < 2) return (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p>Dados insuficientes para gerar gráficos de evolução.</p>
            <p className="text-sm">Realize pelo menos duas avaliações completas.</p>
        </div>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* 1. Composição Corporal */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Evolução: % Gordura</CardTitle>
                    <CardDescription>Objetivo: Redução/Manutenção</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="fatPercent" name="% Gordura" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 2. Cardio VO2 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Evolução: VO2 Máximo</CardTitle>
                    <CardDescription>Capacidade Aeróbia</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="vo2" name="VO2 Max" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 3. Força Relativa */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Evolução: Força Relativa</CardTitle>
                    <CardDescription>Força total / Peso corporal</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 'dataMax + 0.5']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="relativeForce" name="F. Relativa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 4. Mobilidade */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Evolução: Flexibilidade (Wells)</CardTitle>
                    <CardDescription>Banco de Wells (cm)</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 'dataMax + 5']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="wells" name="Wells (cm)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
