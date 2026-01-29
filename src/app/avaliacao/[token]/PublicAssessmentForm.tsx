'use client'

import { useState } from 'react'
import { ASSESSMENTS, AssessmentType, Question } from '@/app/dashboard/[slug]/patients/components/assessments/definitions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitPublicAssessment } from './actions'
import { CheckCircle, BookOpen } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface PublicAssessmentFormProps {
    item: any
    isPreview?: boolean
}

// [FIX] Ensure we can use map recursively if needed or import types correctly.
// Since Question type is imported, we can use it.


export function PublicAssessmentForm({ item, isPreview = false }: PublicAssessmentFormProps) {
    // Determine type (legacy 'spadi' or template type)
    // If template_id exists, we might need to fetch the template definition? 
    // For now assuming definitions comes from ASSESSMENTS mapping using type/slug.
    // If it's a dynamic template (from database), this logic needs to be different.
    // Based on codebase, it seems we primarily use hardcoded definitions (definitions.ts).

    // Logic: 
    // 1. Try item.questionnaire_type
    // 2. Try item.template?.type (if joined)
    // 3. Try finding by ID if possible? (Simpler to assume type matches keys in ASSESSMENTS)

    let type = (item.questionnaire_type || item.template_id || 'spadi') as AssessmentType
    let definition = ASSESSMENTS[type]

    // [NEW] Smart Fallback: Try matching by Title if ID/Type lookup failed
    if (!definition && item.template?.title) {
        const found = Object.values(ASSESSMENTS).find(d => d.title === item.template.title || d.title.includes(item.template.title))
        if (found) {
            definition = found
        }
    }

    // [NEW] Support for Database Templates (Dynamic)
    if (!definition && item.template && item.template.fields) {
        try {
            const dbFields = item.template.fields as any[]
            const questions: Question[] = dbFields.map((f, idx) => ({
                id: f.id || `q${idx + 1}`,
                text: f.label || f.text || '',
                type: f.type === 'radio_group' || f.type === 'select' ? 'mcq' :
                    f.type === 'range' ? 'vas' :
                        f.type === 'text' || f.type === 'textarea' ? 'custom_text' : 'mcq',
                options: f.options?.map((o: any) => {
                    if (typeof o === 'string') {
                        return { label: o, value: o }
                    }
                    return {
                        label: o.label || o.text || o.value || 'Opção',
                        value: isNaN(Number(o.value)) ? o.value : Number(o.value)
                    }
                }),
                min: f.min,
                max: f.max
            }))

            definition = {
                id: item.template.id,
                title: item.template.title,
                description: item.template.description || '',
                questions: questions,
                instruction: 'Por favor, responda as perguntas abaixo.',
                calculateScore: (answers: Record<string, any>) => {
                    // Generic Sum Calculator for Dynamic Forms with Heuristic Colors
                    let total = 0
                    let answered = 0
                    let maxPossible = 0

                    Object.keys(answers).forEach(k => {
                        const val = answers[k]
                        if (typeof val === 'number') {
                            total += val
                            answered++
                            // Estimate max for this question (assuming 5 or 10 if not set)
                            const q = questions.find(q => q.id === k)
                            const qMax = q?.max || (q?.options?.length ? Math.max(...q.options.map(o => Number(o.value) || 0)) : 5)
                            maxPossible += qMax
                        }
                    })

                    // Basic Risk Logic (0-40% Green, 40-70% Yellow, >70% Red)
                    const percent = maxPossible > 0 ? (total / maxPossible) * 100 : 0
                    let riskColor = 'green'
                    if (percent > 70) riskColor = 'red'
                    else if (percent > 40) riskColor = 'yellow'

                    return {
                        total: total,
                        classification: percent > 70 ? 'Alto Escore' : percent > 40 ? 'Médio Escore' : 'Baixo Escore',
                        riskColor: riskColor,
                        note: `Calculado via Template Dinâmico (${answered} itens).`
                    }
                }
            } as any
        } catch (e) {
            console.error("Error parsing dynamic template", e)
        }
    }

    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [errors, setErrors] = useState<Record<string, boolean>>({}) // [NEW] Error state
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

        // [NEW] Clear error if answered
        if (errors[questionId]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[questionId]
                return newErrors
            })
        }

        try {
            setCalculatedScore(definition.calculateScore(newAnswers))
        } catch (e) {
            console.error("Score calc error", e)
        }
    }

    const handleSubmit = async () => {
        // [NEW] Validation Logic
        const newErrors: Record<string, boolean> = {}
        let firstErrorId: string | null = null

        definition.questions.forEach(q => {
            // Skip if dependency not met (effectively hidden)
            if (q.dependency && !answers[q.dependency]) return;

            // Check if answered
            const val = answers[q.id]
            const isMissing = val === undefined || val === null || val === ''

            if (isMissing) {
                newErrors[q.id] = true
                if (!firstErrorId) firstErrorId = q.id
            }
        })

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error('Por favor, responda todas as perguntas obrigatórias.')

            // Scroll to first error
            if (firstErrorId) {
                const el = document.getElementById(`question-container-${firstErrorId}`)
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return
        }

        setIsSubmitting(true)
        try {
            // Ensure scores is plain object without functions
            const safeScores = JSON.parse(JSON.stringify(definition.calculateScore(answers)))
            const res = await submitPublicAssessment(item, answers, safeScores, definition.title)

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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-green-50 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center scale-110 active:scale-100 transition-transform">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sucesso!</h2>
                        <p className="text-slate-600 font-medium leading-relaxed">
                            Suas respostas foram enviadas e já estão no seu prontuário.
                        </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-6">
                        <p className="text-sm text-slate-500 italic">
                            Obrigado por colaborar com seu tratamento. Seu fisioterapeuta analisará os dados em breve.
                        </p>
                    </div>

                    <div className="pt-8">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                            <span className="w-8 h-px bg-slate-200"></span>
                            Access Fisioterapia
                            <span className="w-8 h-px bg-slate-200"></span>
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 bg-white min-h-screen">
            <header className="mb-8 text-center space-y-4">
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">{definition.title}</h1>
                    {(definition.instruction || (definition.clinicalGuidance && isPreview)) && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-full h-8 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5">
                                    <BookOpen className="w-3 h-3 mr-1.5" />
                                    Instruções
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        Instruções do Questionário
                                    </DialogTitle>
                                    <DialogDescription>
                                        {isPreview ? "Informações completas para o profissional." : "Entenda como preencher este questionário."}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {definition.instruction && (
                                        <div className={isPreview ? "p-4 bg-blue-50/50 rounded-2xl border border-blue-100" : ""}>
                                            {isPreview && <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Instrução ao Paciente</h4>}
                                            <p className={`text-slate-700 leading-relaxed ${isPreview ? "text-sm" : "text-base font-medium"}`}>
                                                {definition.instruction}
                                            </p>
                                        </div>
                                    )}
                                    {isPreview && definition.clinicalGuidance && (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mt-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">Orientações Clínicas (Interno)</h4>
                                            <div className="prose prose-sm max-w-none text-slate-600 mt-2">
                                                <div className="whitespace-pre-wrap font-medium leading-relaxed">
                                                    {definition.clinicalGuidance}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
                <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base font-medium">{definition.description}</p>
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
                            hasError={errors[q.id]}
                        />
                    )
                })}
            </div>

            {!isPreview && (
                <Button size="lg" className="w-full text-lg h-12" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Finalizar e Enviar'}
                </Button>
            )}

            {isPreview && (
                <div className="p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 font-medium">
                    Modo Visualização - O envio está desativado.
                </div>
            )}

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
    dependencyValue,
    hasError
}: {
    question: Question,
    value: any,
    onChange: (v: any) => void,
    dependencyValue?: any
    hasError?: boolean
}) {
    const errorClass = hasError ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50"
    const containerClass = hasError ? "border-red-500 ring-1 ring-red-500" : "border hover:border-blue-300"

    if (question.type === 'custom_text') {
        return (
            <div id={`question-container-${question.id}`} className={`space-y-2 p-4 rounded-lg border transition-all ${errorClass}`}>
                <Label className={`text-base font-medium ${hasError ? 'text-red-700' : 'text-slate-800'}`}>
                    {question.text} {hasError && <span className="text-red-500 text-xs ml-2">(Obrigatório)</span>}
                </Label>
                <div className="text-lg font-semibold text-slate-900">{value || '...'}</div>
            </div>
        )
    }

    if (question.type === 'vas') {
        const displayText = dependencyValue
            ? `${question.text} (${dependencyValue})`
            : question.text;

        return (
            <div id={`question-container-${question.id}`} className={`space-y-4 p-5 rounded-lg border shadow-sm transition-all ${hasError ? 'border-red-500 bg-red-50' : 'bg-white'}`}>
                <Label className={`text-base font-medium block mb-2 ${hasError ? 'text-red-700' : 'text-slate-800'}`}>
                    {displayText} {hasError && <span className="text-red-500 text-xs ml-2">(Obrigatório)</span>}
                </Label>
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
        <div id={`question-container-${question.id}`} className={`space-y-3 p-5 rounded-lg bg-white shadow-sm transition-colors ${containerClass}`}>
            <Label className={`text-base font-medium block ${hasError ? 'text-red-700' : 'text-slate-800'}`}>
                {question.text} {hasError && <span className="text-red-500 text-xs ml-2">(Obrigatório)</span>}
            </Label>
            <RadioGroup
                value={value?.toString() ?? ''}
                onValueChange={(val) => onChange(Number(val))}
                className="flex flex-col space-y-2 pt-1"
            >
                {question.options?.map((opt, idx) => {
                    const safeValue = opt.value !== undefined && opt.value !== null ? opt.value.toString() : `opt-${idx}`;
                    return (
                        <div key={opt.label + idx} className={`flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer ${value?.toString() === safeValue ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <RadioGroupItem value={safeValue} id={`${question.id}-${safeValue}`} className="text-blue-600" />
                            <Label htmlFor={`${question.id}-${safeValue}`} className="font-normal cursor-pointer flex-1 text-slate-700 text-sm md:text-base">
                                {opt.label}
                            </Label>
                        </div>
                    )
                })}
            </RadioGroup>
        </div>
    )
}
