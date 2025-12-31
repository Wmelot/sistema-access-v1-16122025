import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    Tooltip as RechartsTooltip, Legend
} from 'recharts'

interface AssessmentRadarProps {
    data: any[]
}

export function AssessmentRadar({ data }: AssessmentRadarProps) {
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Avaliação Global (Radar)</CardTitle>
                <CardDescription>Visão geral das capacidades funcionais</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#888888', fontSize: 12 }} />
                            <Radar
                                name="Avaliação"
                                dataKey="A"
                                stroke="#2563eb"
                                fill="#3b82f6"
                                fillOpacity={0.6}
                            />
                            <Legend />
                            <RechartsTooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
