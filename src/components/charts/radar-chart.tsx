"use client"

import {
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart as RechartsRadar,
    ResponsiveContainer,
    PolarRadiusAxis
} from "recharts"

interface RadarChartProps {
    data: {
        subject: string
        value: number
        fullMark: number
    }[]
    width?: number | string
    height?: number | string
    color?: string
}

export function RadarChart({ data, width = "100%", height = 300, color = "#8884d8" }: RadarChartProps) {
    return (
        <div style={{ width, height }} className="mx-auto">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsRadar outerRadius="80%" data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={['auto', 'auto']} />
                    <Radar
                        name="Avaliação"
                        dataKey="value"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.6}
                    />
                </RechartsRadar>
            </ResponsiveContainer>
        </div>
    )
}
