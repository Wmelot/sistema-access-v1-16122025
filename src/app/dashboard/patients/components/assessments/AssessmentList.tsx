'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ASSESSMENTS, AssessmentType } from './definitions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface AssessmentListProps {
    assessments: any[]
    onView?: (assessment: any) => void
}

export function AssessmentList({ assessments, onView }: AssessmentListProps) {
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
                const def = assessment.type && ASSESSMENTS[assessment.type as AssessmentType]

                const getColors = (color: string) => {
                    switch (color) {
                        case 'green': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', label: 'text-green-700' }
                        case 'yellow': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', label: 'text-yellow-700' }
                        case 'red': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', label: 'text-red-700' }
                        default: return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-900', label: 'text-slate-500' }
                    }
                }

                // Use title from DB if generic, or from def if legacy
                const title = assessment.title || def?.title || assessment.type

                // Only use legacy scores
                const scores = assessment.scores
                const riskColor = scores?.riskColor;
                const colors = getColors(riskColor)

                return (
                    <Card key={assessment.id} className={riskColor ? `border-${riskColor}-200` : ''}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{title}</CardTitle>
                                    <CardDescription>
                                        {format(new Date(assessment.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        {' • '}
                                        {assessment.author || assessment.professionals?.name || 'Profissional'}
                                    </CardDescription>
                                </div>
                                {!scores && onView && (
                                    <Button variant="outline" size="sm" onClick={() => onView(assessment)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver Detalhes
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {scores ? (
                                <>
                                    <strong>Resultados:</strong>
                                    <div className="flex flex-wrap gap-3 mt-2">
                                        {Object.entries(scores).map(([key, value]) => {
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
                                    {/* Link for Details even with Scores */}
                                    {onView && (
                                        <div className="mt-3 text-right">
                                            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={() => onView(assessment)}>
                                                Ver Respostas Completas
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Avaliação realizada sem cálculo automático. Clique em detalhes para ver as respostas.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
