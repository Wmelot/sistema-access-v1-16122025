'use client'

import { useState } from 'react'
import { ASSESSMENTS, AssessmentType, Question } from '@/app/dashboard/patients/components/assessments/definitions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitPublicAssessment } from './actions'
import { CheckCircle } from 'lucide-react'

interface PublicAssessmentFormProps {
    item: any
}

export function PublicAssessmentForm({ item }: PublicAssessmentFormProps) {
    // Determine type (legacy 'spadi' or template type)
    // If template_id exists, we might need to fetch the template definition? 
    // For now assuming definitions comes from ASSESSMENTS mapping using type/slug.
    // If it's a dynamic template (from database), this logic needs to be different.
    // Based on codebase, it seems we primarily use hardcoded definitions (definitions.ts).

    // Logic: 
    // 1. Try item.questionnaire_type
    // 2. Try item.template?.type (if joined)
    // 3. Try finding by ID if possible? (Simpler to assume type matches keys in ASSESSMENTS)

    const type = (item.questionnaire_type || item.template_id || 'spadi') as AssessmentType
    const definition = ASSESSMENTS[type]

    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [calculatedScore, setCalculatedScore] = useState<any>(null)

    if (!definition) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 text-red-800 rounded-lg text-center">
                Modelo de avaliação não encontrado ou não suportado online.
            </div>
        )
    }

    const handleAnswer = (questionId: string, value: any) => {
        const newAnswers = { ...answers, [questionId]: value }
        setAnswers(newAnswers)
        try {
            setCalculatedScore(definition.calculateScore(newAnswers))
        } catch (e) {
            console.error("Score calc error", e)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const scores = definition.calculateScore(answers)
            const res = await submitPublicAssessment(item, answers, scores, definition.title)

            if (res.success) {
                setIsSuccess(true)
                toast.success('Obrigado! Suas respostas foram enviadas.')
            } else {
                toast.error(res.error || 'Erro ao enviar respostas.')
            }
        } catch (error) {
            toast.error('Erro inesperado.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 text-center bg-green-50 rounded-xl border border-green-100">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">Respostas Enviadas!</h2>
                <p className="text-green-700">Obrigado por completar sua avaliação. Seus dados já foram recebidos pelo seu fisioterapeuta.</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 bg-white min-h-screen">
            <header className="mb-8 text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{definition.title}</h1>
                <p className="text-slate-500 max-w-lg mx-auto">{definition.description}</p>
                {definition.instruction && (
                    <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md mt-4 text-left inline-block">
                        <strong>Instrução:</strong> {definition.instruction}
                    </div>
                )}
            </header>

            <div className="space-y-8 mb-10">
                {definition.questions.map((q) => {
                    if (q.dependency && !answers[q.dependency]) return null;
                    return (
                        <QuestionRenderer
                            key={q.id}
                            question={q}
                            value={answers[q.id]}
                            onChange={(val) => handleAnswer(q.id, val)}
                            dependencyValue={q.dependency ? answers[q.dependency] : undefined}
                        />
                    )
                })}
            </div>

            <Button size="lg" className="w-full text-lg h-12" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Finalizar e Enviar'}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-8">
                Sistema Access Fisioterapia • {new Date().getFullYear()}
            </p>
        </div>
    )
}

function QuestionRenderer({
    question,
    value,
    onChange,
    dependencyValue
}: {
    question: Question,
    value: any,
    onChange: (v: any) => void,
    dependencyValue?: any
}) {
    if (question.type === 'custom_text') {
        return (
            <div className="space-y-2 p-4 rounded-lg border bg-slate-50 border-slate-200">
                <Label className="text-base font-medium text-slate-800">{question.text}</Label>
                <div className="text-lg font-semibold text-slate-900">{value || '...'}</div>
            </div>
        )
    }

    if (question.type === 'vas') {
        const displayText = dependencyValue
            ? `${question.text} (${dependencyValue})`
            : question.text;

        return (
            <div className="space-y-4 p-5 rounded-lg border bg-white shadow-sm">
                <Label className="text-base font-medium text-slate-800 block mb-2">{displayText}</Label>
                <div className="px-2">
                    <Slider
                        defaultValue={[0]}
                        value={[typeof value === 'number' ? value : 0]}
                        max={question.max || 10}
                        step={1}
                        onValueChange={(vals) => onChange(vals[0])}
                        className="py-4"
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <span>{question.minLabel || 'Sem dor/dificuldade'}</span>
                    <div className="font-bold text-primary text-2xl -mt-2">{value ?? 0}</div>
                    <span>{question.maxLabel || 'Pior possível'}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3 p-5 rounded-lg border bg-white shadow-sm hover:border-blue-300 transition-colors">
            <Label className="text-base font-medium text-slate-800 block">{question.text}</Label>
            <RadioGroup
                value={value?.toString()}
                onValueChange={(val) => onChange(Number(val))}
                className="flex flex-col space-y-2 pt-1"
            >
                {question.options?.map((opt) => (
                    <div key={opt.label} className={`flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer ${value === opt.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <RadioGroupItem value={opt.value.toString()} id={`${question.id}-${opt.value}`} className="text-blue-600" />
                        <Label htmlFor={`${question.id}-${opt.value}`} className="font-normal cursor-pointer flex-1 text-slate-700 text-sm md:text-base">
                            {opt.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    )
}
