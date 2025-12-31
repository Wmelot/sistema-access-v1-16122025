import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { BodyPainMap } from '../body-pain-map'

interface PainMapStepProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function PainMapStep({ data, updateField, readOnly }: PainMapStepProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    Mapeamento da Dor
                </CardTitle>
                <CardDescription>Clique nas áreas dolorosas para registrar no mapa corporal.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-2xl mx-auto">
                    <BodyPainMap
                        painPoints={data.painPoints}
                        onChange={(v: any) => updateField('painPoints', v)}
                        customPoints={data.customPainPoints || []}
                        onCustomPointsChange={(v: any) => updateField('customPainPoints', v)}
                        readOnly={readOnly}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
