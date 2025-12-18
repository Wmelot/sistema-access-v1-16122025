'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ASSESSMENTS, AssessmentType } from './definitions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AssessmentListProps {
    assessments: any[]
}

export function AssessmentList({ assessments }: AssessmentListProps) {
    if (assessments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Nenhuma avaliação realizada ainda.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {assessments.map((assessment) => {
                const riskColor = assessment.scores?.riskColor;

                const getColors = (color: string) => {
                    switch (color) {
                        case 'green': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', label: 'text-green-700' }
                        case 'yellow': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', label: 'text-yellow-700' }
                        case 'red': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', label: 'text-red-700' }
                        default: return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-900', label: 'text-slate-500' }
                    }
                }

                const colors = getColors(riskColor)
                const def = ASSESSMENTS[assessment.type as AssessmentType]

                return (
                    <Card key={assessment.id} className={riskColor ? `border-${riskColor}-200` : ''}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{def?.title || assessment.type}</CardTitle>
                                    <CardDescription>
                                        {format(new Date(assessment.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        {' • '}
                                        {assessment.professionals?.name || 'Profissional'}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <strong>Resultados:</strong>
                            <div className="flex flex-wrap gap-3 mt-2">
                                {Object.entries(assessment.scores).map(([key, value]) => {
                                    if (key === 'riskColor') return null
                                    const label = key === 'classification' ? 'Classificação' :
                                        key === 'total' ? 'Total' :
                                            key.replace(/([A-Z])/g, ' $1').trim();

                                    return (
                                        <div key={key} className={`${colors.bg} px-3 py-1.5 rounded-md border ${colors.border}`}>
                                            <span className={`text-[10px] uppercase font-bold block mb-0.5 ${colors.label}`}>
                                                {label}
                                            </span>
                                            <span className={`text-sm font-semibold ${colors.text}`}>
                                                {String(value)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
