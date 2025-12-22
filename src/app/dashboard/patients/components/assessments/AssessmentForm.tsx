'use client'

import { useState } from 'react'
import { ASSESSMENTS, AssessmentType, Question } from './definitions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { createAssessment } from '@/app/dashboard/patients/actions/assessments'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AssessmentFormProps {
    patientId: string
    type: AssessmentType
    onSuccess: () => void
    mode?: 'default' | 'patient'
}

export function AssessmentForm({ patientId, type, onSuccess, mode = 'default' }: AssessmentFormProps) {
    const definition = ASSESSMENTS[type]
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [calculatedScore, setCalculatedScore] = useState<any>(null)

    const handleAnswer = (questionId: string, value: number) => {
        const newAnswers = { ...answers, [questionId]: value }
        setAnswers(newAnswers)
        // Real-time score update
        setCalculatedScore(definition.calculateScore(newAnswers))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const scores = definition.calculateScore(answers)
            await createAssessment(patientId, type, answers, scores, definition.title)
            toast.success('Avaliação salva com sucesso')
            onSuccess()
        } catch (error) {
            toast.error('Erro ao salvar avaliação')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!definition) return <div>Tipo de avaliação não encontrado.</div>

    const isPatientMode = mode === 'patient'

    const getRiskColorClasses = (color: string) => {
        switch (color) {
            case 'green': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', value: 'text-green-900', label: 'text-green-700' }
            case 'yellow': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', value: 'text-yellow-900', label: 'text-yellow-700' }
            case 'red': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', value: 'text-red-900', label: 'text-red-700' }
            default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', value: 'text-slate-900', label: 'text-slate-700' }
        }
    }

    const colors = calculatedScore?.riskColor ? getRiskColorClasses(calculatedScore.riskColor) : getRiskColorClasses('default')

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{definition.title}</h3>
                    {isPatientMode && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase font-bold">Modo Paciente</span>}
                </div>
                <p className="text-sm text-muted-foreground">{definition.description}</p>
            </div>

            {definition.instruction && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-md text-sm flex gap-3 items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    <p>{definition.instruction}</p>
                </div>
            )}

            <div className="space-y-8">
                {definition.questions.map((q) => (
                    <QuestionRenderer
                        key={q.id}
                        question={q}
                        value={answers[q.id]}
                        onChange={(val) => handleAnswer(q.id, val)}
                    />
                ))}
            </div>

            {!isPatientMode && calculatedScore && (
                <Card className={`${colors.bg} ${colors.border}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-base ${colors.text}`}>Resultado Preliminar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(calculatedScore).map(([key, value]) => {
                                if (key === 'riskColor') return null
                                const label = key === 'classification' ? 'Classificação' :
                                    key === 'total' ? 'Pontuação Total' :
                                        key.replace(/([A-Z])/g, ' $1').trim();

                                return (
                                    <div key={key}>
                                        <span className={`text-xs uppercase font-bold tracking-wider ${colors.label}`}>{label}</span>
                                        <div className={`text-2xl font-bold ${colors.value}`}>
                                            {String(value)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
        </div>
    )
}

function QuestionRenderer({ question, value, onChange }: { question: Question, value: number | undefined, onChange: (v: number) => void }) {
    if (question.type === 'vas') {
        return (
            <div className="space-y-3">
                <Label>{question.text} - {value ?? 0}</Label>
                <Slider
                    defaultValue={[0]}
                    value={[value ?? 0]}
                    max={question.max || 10}
                    step={1}
                    onValueChange={(vals) => onChange(vals[0])}
                />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label className="text-base">{question.text}</Label>
            <RadioGroup
                value={value?.toString()}
                onValueChange={(val) => onChange(Number(val))}
                className="flex flex-col space-y-1"
            >
                {question.options?.map((opt) => (
                    <div key={opt.label} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value.toString()} id={`${question.id}-${opt.value}`} />
                        <Label htmlFor={`${question.id}-${opt.value}`} className="font-normal cursor-pointer">
                            {opt.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    )
}
