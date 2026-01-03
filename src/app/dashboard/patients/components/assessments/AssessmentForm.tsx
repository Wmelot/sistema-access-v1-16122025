'use client'

import { useState } from 'react'
import { ASSESSMENTS, AssessmentType, Question } from './definitions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Info, BookOpen } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { createAssessment } from '@/app/dashboard/patients/actions/assessments'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WomensHealthForm } from '@/components/assessments/womens-health-form'

interface AssessmentFormProps {
    patientId: string
    type: AssessmentType
    onSuccess: () => void
    mode?: 'default' | 'patient'
}

export function AssessmentForm({ patientId, type, onSuccess, mode = 'default' }: AssessmentFormProps) {
    const definition = ASSESSMENTS[type]
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [calculatedScore, setCalculatedScore] = useState<any>(null)

    const handleAnswer = (questionId: string, value: any) => {
        const newAnswers = { ...answers, [questionId]: value }
        setAnswers(newAnswers)
        // Real-time score update
        try {
            setCalculatedScore(definition.calculateScore(newAnswers))
        } catch (e) {
            console.error("Score calculation error", e)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const scores = definition.calculateScore(answers)
            await createAssessment(patientId, type, answers, scores, definition.title)
            toast.success('Avaliação salva com sucesso')
            onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar avaliação')
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

    // [NEW] Special handling for Women's Health Form
    if (type === 'womens_health') {
        const handleWomensHealthSave = async (data: any) => {
            setIsSubmitting(true)
            try {
                // Determine risk color logic for WH? or just save data.
                // WH form generates data structure, we can determine "scores" or "tags" here.
                const triggers = []
                if (data.complaints?.stressUrinaryIncontinence) triggers.push('SUI_FEMALE')
                if (data.complaints?.urgeIncontinence) triggers.push('OAB_URGE')

                const scores = {
                    total: 0,
                    classification: triggers.length > 0 ? `Indicado: ${triggers.join(', ')}` : 'Avaliação Inicial',
                    riskColor: data.redFlags && Object.values(data.redFlags).some(Boolean) ? 'red' : 'green',
                    protocol_triggers: triggers // Pass explicitly for backend
                }
                await createAssessment(patientId, type, data, scores, definition.title)
                toast.success('Avaliação salva com sucesso')
                onSuccess()
            } catch (error: any) {
                toast.error(error.message || 'Erro ao salvar avaliação')
            } finally {
                setIsSubmitting(false)
            }
        }
        return <WomensHealthForm patientId={patientId} onSave={handleWomensHealthSave} />
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="space-y-4 border-b pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-slate-900">{definition.title}</h3>
                            {isPatientMode && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase font-bold">Modo Paciente</span>}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{definition.description}</p>
                    </div>

                    {/* [NEW] Clinical Guidance Button (Professional Only) */}
                    {!isPatientMode && definition.clinicalGuidance && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 shrink-0 text-blue-700 border-blue-200 hover:bg-blue-50">
                                    <BookOpen className="h-4 w-4" />
                                    Instruções
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Instruções Clínicas</DialogTitle>
                                    <DialogDescription>{definition.title}</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh]">
                                    <div className="text-sm text-slate-700 space-y-4 pr-4">
                                        {/* Simple formatting for lines */}
                                        {definition.clinicalGuidance.split('\n').map((line, i) => (
                                            <p key={i} className={line.trim().startsWith('-') ? 'pl-4' : ''}>
                                                {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                                                    part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
                                                )}
                                            </p>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {definition.instruction && (
                    <div className="bg-slate-50 border px-4 py-3 rounded-md text-sm flex gap-3 items-start text-slate-700">
                        <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                        <p>{definition.instruction}</p>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {definition.questions.map((q) => {
                    if (q.dependency && !answers[q.dependency]) return null;

                    return (
                        <QuestionRenderer
                            key={q.id}
                            question={q}
                            value={answers[q.id]}
                            onChange={(val) => handleAnswer(q.id, val)}
                            isPatientMode={isPatientMode}
                            dependencyValue={q.dependency ? answers[q.dependency] : undefined}
                        />
                    )
                })}
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

            <div className="pt-4">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
            </div>
        </div>
    )
}

function QuestionRenderer({
    question,
    value,
    onChange,
    isPatientMode,
    dependencyValue
}: {
    question: Question,
    value: any,
    onChange: (v: any) => void,
    isPatientMode?: boolean,
    dependencyValue?: any
}) {
    if (question.type === 'custom_text') {
        if (isPatientMode) {
            return (
                <div className="space-y-2 p-4 rounded-lg border bg-blue-50/50 border-blue-100">
                    <Label className="text-sm font-medium text-slate-500">{question.text}</Label>
                    <div className="text-lg font-semibold text-slate-900">{value || '...'}</div>
                </div>
            )
        }
        return (
            <div className="space-y-3 p-4 rounded-lg border bg-white shadow-sm border-slate-200">
                <Label className="text-base font-medium text-slate-800">{question.text}</Label>
                <Input
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={question.placeholder}
                    className="max-w-md"
                />
            </div>
        )
    }

    if (question.type === 'vas') {
        const displayText = dependencyValue
            ? `${question.text} (${dependencyValue})`
            : question.text;

        return (
            <div className="space-y-4 p-4 rounded-lg border bg-slate-50/50">
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
                <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    <span>{question.minLabel || 'Sem dor/dificuldade'}</span>
                    <span className="font-bold text-primary text-lg">{value ?? 0}</span>
                    <span>{question.maxLabel || 'Pior dor/dificuldade possível'}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3 p-4 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <Label className="text-base font-medium text-slate-800">{question.text}</Label>
            <RadioGroup
                value={value?.toString()}
                onValueChange={(val) => onChange(Number(val))}
                className="flex flex-col space-y-2 pt-2"
            >
                {question.options?.map((opt) => (
                    <div key={opt.label} className={`flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer ${value === opt.value ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:bg-white'}`}>
                        <RadioGroupItem value={opt.value.toString()} id={`${question.id}-${opt.value}`} className="text-blue-600" />
                        <Label htmlFor={`${question.id}-${opt.value}`} className="font-normal cursor-pointer flex-1 text-slate-700">
                            {opt.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    )
}
