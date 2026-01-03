"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Activity, Ruler, Dumbbell, Save, AlertTriangle, ArrowRight, ArrowLeft, Microscope, ShieldAlert,
    FileText, RotateCcw, Shield, Target, AlertCircle, Brain
} from "lucide-react"

import { NeurologicalAssessment } from './neurological/neurological-assessment'

import { cn } from "@/lib/utils"

// --- CONSTANTS & DATA ---

const PREV_TREATMENTS = ['Fisioterapia', 'Medicamentoso', 'Cirúrgico', 'Acupuntura', 'Quiropraxia', 'Infiltração', 'Nenhum']
const PHYSICAL_ACTIVITIES = ['Musculação', 'Corrida', 'Pilates', 'Crossfit', 'Natação', 'Ciclismo', 'Futebol', 'Luta', 'Outros']

// REGION SPECIFIC DATA FOR ROM & STRENGTH
const REGION_DATA: any = {
    spine_cervical: {
        rom: ['Flexão', 'Extensão', 'Inclinação D', 'Inclinação E', 'Rotação D', 'Rotação E'],
        muscles: ['Flexores Profundos', 'Extensores Cervicais', 'Trapézio Superior']
    },
    spine_lumbar: {
        rom: ['Flexão', 'Extensão', 'Inclinação D', 'Inclinação E', 'Rotação D', 'Rotação E'],
        muscles: ['Multífidos', 'Transverso Abdominal', 'Eretores da Espinha']
    },
    shoulder: {
        rom: ['Flexão', 'Extensão', 'Abdução', 'Adução', 'Rotação Externa', 'Rotação Interna'],
        muscles: ['Supraespinhal', 'Infraespinhal', 'Subescapular', 'Deltóide', 'Serrátil Anterior']
    },
    elbow_hand: {
        rom: ['Flexão Cotovelo', 'Extensão Cotovelo', 'Pronação', 'Supinação', 'Flexão Punho', 'Extensão Punho'],
        muscles: ['Bíceps', 'Tríceps', 'Extensores Punho', 'Flexores Punho', 'Preensão Palmar']
    },
    hip: {
        rom: ['Flexão', 'Extensão', 'Abdução', 'Adução', 'Rotação Interna', 'Rotação Externa'],
        muscles: ['Glúteo Médio', 'Glúteo Máximo', 'Iliopsoas', 'Adutores']
    },
    knee: {
        rom: ['Flexão', 'Extensão'],
        muscles: ['Quadríceps', 'Isquitibiais', 'Gastrocnêmio']
    },
    ankle_foot: {
        rom: ['Dorsiflexão', 'Plantiflexão', 'Inversão', 'Eversão'],
        muscles: ['Tibial Anterior', 'Tríceps Sural', 'Fibular', 'Tibial Posterior']
    }
}

interface SmartAssessmentFormProps {
    initialData?: any
    patientId: string
    onSave: (data: any) => void
    readOnly?: boolean
}

const TABS = ['anamnese', 'physical', 'functional']

export function SmartAssessmentForm({ initialData, patientId, onSave, readOnly }: SmartAssessmentFormProps) {
    // INITIALIZATION LOGIC
    const DEFAULT_DATA = {
        // 1. Patient Info & History
        qp: '', hma: '', painDuration: '', eva: 0,
        efep: {
            items: [
                { activity: '', score: 0 },
                { activity: '', score: 0 },
                { activity: '', score: 0 }
            ]
        },
        history: {
            hp: '',
            medication: '',
            prevTreatment: [],
            physicalActivity: [],
            activityFrequency: 'sedentary',
            goals: [],
            experience: 'recreational',
            injuryStatus: 'none'
        },

        // 2. Red Flags
        redFlags: {
            unexplainedWeightLoss: false,
            historyOfCancer: false,
            severeTrauma: false,
            progressiveNeuroDeficit: false,
            nonMechanicalChestPain: false,
            caudaEquina: false,
            fever: false
        },

        // 3. Clinical logic
        anamnesis: {
            onset: '',
            painNature: '',
            mainRegion: '', // Triggers dynamic content
        },

        // 4. Physical Exam
        physicalExam: {
            observation: '', // Posture, edema, etc
            movementQuality: {
                gait: '',
                scapuloHumeral: '',
                lumboPelvic: '',
                other: ''
            },
            rom: {}, // Dynamic structure: { [joint]: { active: '', passive: '', normal: '', contralateral: '' } }
            strength: {}, // Dynamic: { [muscle]: { grade: '', dynamo: '' } }
            specialTests: {} // Dynamic keys
        },

        // 5. Neurological (New)
        neurological: {
            reflexes: {},
            myotomes: {},
            dermatomes: [],
            neuralTension: {}
        },

        // 5. Radar / Functional
        functional: {
            functionScore: 0,
            flexibility: { thomasTest: 0, lungeTest: 0, wells: 0 },
            strength: { bridgeTest: 0, plankTest: 0, dynamometry: 0 }
        }
    }

    const [data, setData] = useState(initialData ? { ...DEFAULT_DATA, ...initialData } : DEFAULT_DATA)
    const [activeTab, setActiveTab] = useState("anamnese")

    // Ensure EFEP init if passed weirdly
    useEffect(() => {
        if (!data.efep || !data.efep.items) {
            setData((prev: any) => ({
                ...prev,
                efep: {
                    items: [
                        { activity: '', score: 0 },
                        { activity: '', score: 0 },
                        { activity: '', score: 0 }
                    ]
                }
            }))
        }
    }, [])

    const updateField = (path: string, val: any) => {
        if (readOnly) return
        setData((prev: any) => {
            const newData = { ...prev }
            const keys = path.split('.')
            let current = newData
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i]
                if (!current[key]) current[key] = {}
                current[key] = { ...current[key] }
                current = current[key]
            }
            current[keys[keys.length - 1]] = val
            return newData
        })
    }

    const handleTabChange = (direction: 'next' | 'prev') => {
        const currentIndex = TABS.indexOf(activeTab)
        if (direction === 'next' && currentIndex < TABS.length - 1) {
            setActiveTab(TABS[currentIndex + 1])
        } else if (direction === 'prev' && currentIndex > 0) {
            setActiveTab(TABS[currentIndex - 1])
        }
    }

    const calculateEfepScore = () => {
        const items = data.efep?.items || []
        const total = items.reduce((acc: number, it: any) => acc + (Number(it.score) || 0), 0)
        return ((total / 3) * 10).toFixed(0)
    }

    const hasRedFlags = Object.values(data.redFlags || {}).some(Boolean)
    const currentRegionData = REGION_DATA[data.anamnesis?.mainRegion]

    return (
        <div className="space-y-6 pb-20 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Avaliação Clínica Inteligente</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        Prática Baseada em Evidência (PBE)
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={() => onSave(data)} className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100 ring-offset-2 focus:ring-2 ring-green-500">
                        <Save className="w-4 h-4 mr-2" /> Salvar Avaliação
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-slate-100/80 mb-8 rounded-xl border border-slate-200">
                    <TabsTrigger value="anamnese" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all">
                        <FileText className="w-5 h-5 mb-1" />
                        <span className="font-semibold">1. Anamnese & Triagem</span>
                    </TabsTrigger>
                    <TabsTrigger value="physical" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                        <Microscope className="w-5 h-5 mb-1" />
                        <span className="font-semibold">2. Exame Físico Específico</span>
                    </TabsTrigger>
                    <TabsTrigger value="functional" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                        <Activity className="w-5 h-5 mb-1" />
                        <span className="font-semibold">3. Radar Funcional</span>
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: ANAMNESE & TRIAGEM --- */}
                <TabsContent value="anamnese" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">

                    {/* A. RED FLAGS */}
                    <Card className={cn("border-l-4 shadow-sm", hasRedFlags ? "border-l-red-500 bg-red-50/40 border-red-200" : "border-l-slate-300")}>
                        <CardHeader className="pb-3">
                            <CardTitle className={cn("flex items-center gap-2 text-lg", hasRedFlags ? "text-red-700" : "text-slate-700")}>
                                <AlertTriangle className="w-5 h-5" />
                                Triagem de Bandeiras Vermelhas (Red Flags)
                            </CardTitle>
                            <CardDescription>Sinais de alerta para patologias graves que requerem encaminhamento.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { id: 'unexplainedWeightLoss', label: 'Perda de peso s/ motivo / Febre' },
                                    { id: 'historyOfCancer', label: 'Histórico de Câncer' },
                                    { id: 'severeTrauma', label: 'Trauma Grave / Risco Fratura' },
                                    { id: 'progressiveNeuroDeficit', label: 'Déficit Neurológico Progressivo' },
                                    { id: 'nonMechanicalChestPain', label: 'Dor Torácica Não-Mecânica' },
                                    { id: 'caudaEquina', label: 'S. Cauda Equina (Anestesia em sela)' },
                                    { id: 'fever', label: 'Febre ou mal estar sistêmico' },
                                ].map((flag) => (
                                    <div key={flag.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", data.redFlags?.[flag.id] ? "bg-red-100 border-red-300" : "bg-white hover:bg-slate-50 border-slate-100")}>
                                        <Checkbox
                                            id={flag.id}
                                            checked={data.redFlags?.[flag.id]}
                                            onCheckedChange={(checked) => updateField(`redFlags.${flag.id}`, checked)}
                                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            disabled={readOnly}
                                        />
                                        <Label htmlFor={flag.id} className="cursor-pointer font-medium text-sm leading-tight text-slate-700">
                                            {flag.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* B. HISTÓRIA CLÍNICA (Merged Layout) */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader className="pb-3"><CardTitle>Queixa & História</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">Queixa Principal (QP)</Label>
                                        <Input
                                            value={data.qp}
                                            onChange={e => updateField('qp', e.target.value)}
                                            placeholder="Descreva a queixa principal do paciente..."
                                            className="font-medium text-lg mt-1 h-12"
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">Tempo de Evolução</Label>
                                            <Input
                                                value={data.painDuration}
                                                onChange={e => updateField('painDuration', e.target.value)}
                                                placeholder="Ex: 3 semanas..."
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-muted-foreground uppercase">Início dos Sintomas</Label>
                                            <Select value={data.anamnesis?.onset} onValueChange={(v) => updateField('anamnesis.onset', v)}>
                                                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="traumatic">Traumático</SelectItem>
                                                    <SelectItem value="insidious">Insidioso (Gradual)</SelectItem>
                                                    <SelectItem value="post_op">Pós-Operatório</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">História da Moléstia Atual (HMA)</Label>
                                        <Textarea
                                            value={data.hma}
                                            onChange={e => updateField('hma', e.target.value)}
                                            placeholder="Descreva a evolução dos sintomas, fatores de melhora/piora..."
                                            className="mt-1 min-h-[120px] resize-y"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* FUNCTIONAL SCALE (EFEP) FIXED */}
                            <Card className="bg-blue-50/50 border-blue-100">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                                            <Target className="w-5 h-5 text-blue-600" />
                                            Funcionalidade (EFEP / PSFS)
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                                            Score: {calculateEfepScore()}%
                                        </Badge>
                                    </div>
                                    <CardDescription>Liste 3 atividades que o paciente tem dificuldade (0=Incapaz, 10=Capaz).</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {data.efep?.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <div className="bg-white font-bold text-slate-500 px-2 py-2 rounded border min-w-[2rem] text-center text-sm">{idx + 1}</div>
                                            <Input
                                                placeholder={`Atividade ${idx + 1} (Ex: Subir escadas)`}
                                                value={item.activity}
                                                onChange={e => updateField(`efep.items.${idx}.activity`, e.target.value)}
                                                className="bg-white"
                                            />
                                            <Select
                                                value={String(item.score)}
                                                onValueChange={v => updateField(`efep.items.${idx}.score`, +v)}
                                            >
                                                <SelectTrigger className="w-[80px] bg-white"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 11 }, (_, i) => <SelectItem key={i} value={String(i)}>{i}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: History & Habits */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-base text-slate-700">Histórico & Hábitos</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">História Pregressa</Label>
                                        <Textarea
                                            value={data.history?.hp}
                                            onChange={e => updateField('history.hp', e.target.value)}
                                            placeholder="Cirurgias, comorbidades..."
                                            className="mt-1 h-20 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-muted-foreground uppercase">Medicações</Label>
                                        <Input
                                            value={data.history?.medication}
                                            onChange={e => updateField('history.medication', e.target.value)}
                                            placeholder="Em uso..."
                                            className="mt-1 text-sm"
                                        />
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Nível de Atividade</Label>
                                        <RadioGroup
                                            value={data.history?.activityFrequency || 'sedentary'}
                                            onValueChange={v => updateField('history.activityFrequency', v)}
                                            className="space-y-1"
                                        >
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="s" /><Label htmlFor="s" className="font-normal text-sm">Sedentário</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="1x" id="1x" /><Label htmlFor="1x" className="font-normal text-sm">1-2x Semana</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="3x" id="3x" /><Label htmlFor="3x" className="font-normal text-sm">3-4x Semana</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="5x" id="5x" /><Label htmlFor="5x" className="font-normal text-sm">Atleta / 5x+</Label></div>
                                        </RadioGroup>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Objetivos</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Reduzir Dor', 'Performance', 'Mobilidade', 'Força'].map(g => (
                                                <div key={g} className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={data.history?.goals?.includes(g)}
                                                        onCheckedChange={c => {
                                                            const curr = data.history?.goals || []
                                                            updateField('history.goals', c ? [...curr, g] : curr.filter((i: string) => i !== g))
                                                        }}
                                                    />
                                                    <span className="text-sm">{g}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900 text-white border-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Dor (EVA)
                                        <span className={cn("text-2xl font-bold", data.eva >= 7 ? "text-red-400" : "text-blue-400")}>{data.eva}/10</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Slider
                                        value={[data.eva]}
                                        onValueChange={v => updateField('eva', v[0])}
                                        max={10}
                                        step={1}
                                        className="py-4"
                                    />
                                    <p className="text-xs text-slate-400 text-center mt-2">Arraste para ajustar</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB 2: EXAME FÍSICO ESPECÍFICO --- */}
                <TabsContent value="physical" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <CardTitle>Região da Avaliação</CardTitle>
                                    <CardDescription>Selecione a articulação principal para carregar os testes específicos.</CardDescription>
                                </div>
                                <Select value={data.anamnesis?.mainRegion} onValueChange={(v) => updateField('anamnesis.mainRegion', v)}>
                                    <SelectTrigger className="w-full md:w-[300px] h-10 bg-white border-blue-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Selecione a Região..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="spine_cervical">Coluna Cervical</SelectItem>
                                        <SelectItem value="spine_lumbar">Coluna Lombar</SelectItem>
                                        <SelectItem value="shoulder">Ombro</SelectItem>
                                        <SelectItem value="elbow_hand">Cotovelo / Punho / Mão</SelectItem>
                                        <SelectItem value="hip">Quadril</SelectItem>
                                        <SelectItem value="knee">Joelho</SelectItem>
                                        <SelectItem value="ankle_foot">Tornozelo / Pé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                    </Card>

                    {data.anamnesis?.mainRegion ? (
                        <>
                            {/* 1. INSPECTION & QUALITY */}
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base text-slate-700">Inspeção & Qualidade de Movimento</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Observações Gerais (Postura, Edema, Cicatriz)</Label>
                                        <Textarea
                                            placeholder="Descreva..."
                                            value={data.physicalExam?.observation}
                                            onChange={e => updateField('physicalExam.observation', e.target.value)}
                                            className="h-24"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Qualidade do Movimento (Ritmo, Compensações)</Label>
                                        <Textarea
                                            placeholder={
                                                data.anamnesis.mainRegion.includes('spine') ? "Ritmo lombo-pélvico, instabilidade..." :
                                                    data.anamnesis.mainRegion === 'shoulder' ? "Ritmo escapulo-umeral, discinese..." :
                                                        "Padrão de marcha, controle dinâmico..."
                                            }
                                            value={data.physicalExam?.movementQuality?.other}
                                            onChange={e => updateField('physicalExam.movementQuality.other', e.target.value)}
                                            className="h-24"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 1.5 NEUROLOGICAL ASSESSMENT */}
                            <NeurologicalAssessment
                                data={data}
                                updateField={updateField}
                                readOnly={readOnly}
                                region={
                                    data.anamnesis?.mainRegion?.match(/cervical|shoulder|elbow_hand/) ? 'cervical' :
                                        data.anamnesis?.mainRegion?.match(/lumbar|hip|knee|ankle_foot/) ? 'lumbar' : 'all'
                                }
                            />

                            {/* 2. ADM (ROM) TABLE */}
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-blue-700">
                                    <Ruler className="w-4 h-4" /> Amplitude de Movimento (ADM)
                                </CardTitle></CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-slate-50 text-left">
                                                    <th className="p-2 font-semibold text-slate-600">Movimento</th>
                                                    <th className="p-2 font-semibold text-slate-600 w-24 text-center">
                                                        {data.anamnesis.mainRegion.includes('spine') ? 'Amplitude' : 'Esquerda'}
                                                    </th>
                                                    <th className="p-2 font-semibold text-slate-600 w-24 text-center">
                                                        {data.anamnesis.mainRegion.includes('spine') ? '' : 'Direita'}
                                                    </th>
                                                    <th className="p-2 font-semibold text-slate-600 w-32 text-right">Referência</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentRegionData?.rom?.map((mov: string, idx: number) => {
                                                    // Logic: Spine Flexion/Extension usually measured as single midline value (e.g. Schober or inches)
                                                    // Rotations/Side Flexions are bilateral.
                                                    const isSpine = data.anamnesis.mainRegion.includes('spine')
                                                    const isMidline = isSpine && (mov.includes('Flexão') || mov.includes('Extensão'))

                                                    return (
                                                        <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                                                            <td className="p-2 font-medium text-slate-700">{mov}</td>

                                                            {/* INPUT 1 (Left or Main) */}
                                                            <td className="p-2" colSpan={isMidline ? 2 : 1}>
                                                                <Input
                                                                    className="h-8 w-full text-center"
                                                                    placeholder={isMidline ? "Total" : "Esq"}
                                                                    value={data.physicalExam?.rom?.[mov]?.[isMidline ? 'value' : 'left'] || ''}
                                                                    onChange={e => updateField(`physicalExam.rom.${mov}.${isMidline ? 'value' : 'left'}`, e.target.value)}
                                                                />
                                                            </td>

                                                            {/* INPUT 2 (Right - Hidden if Midline) */}
                                                            {!isMidline && (
                                                                <td className="p-2">
                                                                    <Input
                                                                        className="h-8 w-full text-center"
                                                                        placeholder="Dir"
                                                                        value={data.physicalExam?.rom?.[mov]?.right || ''}
                                                                        onChange={e => updateField(`physicalExam.rom.${mov}.right`, e.target.value)}
                                                                    />
                                                                </td>
                                                            )}

                                                            <td className="p-2 text-xs text-muted-foreground text-right italic">
                                                                {/* Reference placeholder */}
                                                                -
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Dica: Utilize inclinômetro digital (celular) ou goniômetro para aferição precisa.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3. STRENGTH TABLE */}
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-orange-700">
                                    <Dumbbell className="w-4 h-4" /> Força Muscular
                                </CardTitle></CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-slate-50 text-left">
                                                    <th className="p-2 font-semibold text-slate-600">Músculo / Grupo</th>
                                                    <th className="p-2 font-semibold text-slate-600 w-32">Grau (0-5)</th>
                                                    <th className="p-2 font-semibold text-slate-600 w-32">Dinamometria (kgf)</th>
                                                    <th className="p-2 font-semibold text-slate-600 w-32">Referência</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentRegionData?.muscles?.map((muscle: string, idx: number) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                                                        <td className="p-2 font-medium">{muscle}</td>
                                                        <td className="p-2">
                                                            <Select
                                                                value={data.physicalExam?.strength?.[muscle]?.grade}
                                                                onValueChange={v => updateField(`physicalExam.strength.${muscle}.grade`, v)}
                                                            >
                                                                <SelectTrigger className="h-8"><SelectValue placeholder="Grau" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="5">5 (Normal)</SelectItem>
                                                                    <SelectItem value="4">4 (Bom)</SelectItem>
                                                                    <SelectItem value="3">3 (Regular)</SelectItem>
                                                                    <SelectItem value="2">2 (Ruim)</SelectItem>
                                                                    <SelectItem value="1">1 (Vestígio)</SelectItem>
                                                                    <SelectItem value="0">0 (Nulo)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="p-2">
                                                            <Input
                                                                className="h-8"
                                                                type="number"
                                                                placeholder="kgf"
                                                                value={data.physicalExam?.strength?.[muscle]?.dynamo || ''}
                                                                onChange={e => updateField(`physicalExam.strength.${muscle}.dynamo`, e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-2 text-xs text-muted-foreground">
                                                            Consultar Tabela (Idade/Sexo)
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 4. SPECIAL TESTS (Restoring Checkboxes) */}
                            <Card className="border-indigo-100 bg-indigo-50/20">
                                <CardHeader className="pb-2"><CardTitle className="text-base text-indigo-700">Testes Específicos & Ortopédicos</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    {/* SPINE TESTS */}
                                    {data.anamnesis.mainRegion.includes('spine') && (
                                        <>
                                            <TestCheck id="radiatingPain" label="Sintomas Irradiados (Radiculopatia)" data={data} update={updateField} />
                                            {data.anamnesis.mainRegion.includes('lumbar') && (
                                                <>
                                                    <TestCheck id="slrPositive" label="SLR (Elevação Perna Reta) - Positivo" data={data} update={updateField} />
                                                    <TestCheck id="extensionRelief" label="Melhora c/ Extensão (Preferencial)" data={data} update={updateField} />
                                                    <TestCheck id="flexionRelief" label="Melhora c/ Flexão (Estenose)" data={data} update={updateField} />
                                                </>
                                            )}
                                            {data.anamnesis.mainRegion.includes('cervical') && (
                                                <TestCheck id="wainnerPositive" label="Cluster de Wainner (+)" data={data} update={updateField} />
                                            )}
                                        </>
                                    )}
                                    {/* SHOULDER */}
                                    {data.anamnesis.mainRegion === 'shoulder' && (
                                        <>
                                            <TestCheck id="painfulArc" label="Arco Doloroso (60-120°)" data={data} update={updateField} />
                                            <TestCheck id="hawkinsKennedy" label="Hawkins-Kennedy (+)" data={data} update={updateField} />
                                            <TestCheck id="jobeWeakness" label="Jobe / Empty Can (Fraqueza)" data={data} update={updateField} />
                                            <TestCheck id="erRestriction" label="Restrição Rot. Externa (>50%)" data={data} update={updateField} />
                                        </>
                                    )}
                                    {/* KNEE */}
                                    {data.anamnesis.mainRegion === 'knee' && (
                                        <>
                                            <TestCheck id="lachman" label="Lachman / Gaveta Anterior (+)" data={data} update={updateField} />
                                            <TestCheck id="meniscusTests" label="McMurray / Thessaly (+)" data={data} update={updateField} />
                                            <TestCheck id="patellarTendonPain" label="Dor Tendão Patelar (Palpação)" data={data} update={updateField} />
                                        </>
                                    )}
                                    {/* HIP */}
                                    {data.anamnesis.mainRegion === 'hip' && (
                                        <>
                                            <TestCheck id="fadirPositive" label="FADIR (Impacto Femoroacetabular)" data={data} update={updateField} />
                                            <TestCheck id="trochantericPain" label="Dor Trocanter Maior (Bursite/Tendinite)" data={data} update={updateField} />
                                        </>
                                    )}
                                    {/* ANKLE */}
                                    {data.anamnesis.mainRegion === 'ankle_foot' && (
                                        <>
                                            <TestCheck id="firstStepPain" label="Dor Primeiros Passos (Fascite)" data={data} update={updateField} />
                                            <TestCheck id="anteriorDrawerAnkle" label="Gaveta Anterior (+)" data={data} update={updateField} />
                                            <TestCheck id="squeezeTest" label="Squeeze Test (Sindesmose)" data={data} update={updateField} />
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 border border-dashed rounded-lg">
                            <Microscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-slate-600">Nenhuma Região Selecionada</h3>
                            <p className="text-sm text-slate-400">Selecione uma região acima para iniciar o exame específico.</p>
                        </div>
                    )}
                </TabsContent>

                {/* --- TAB 3: RADAR FUNCIONAL --- */}
                <TabsContent value="functional" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados para Gráfico (Radar)</CardTitle>
                            <CardDescription>Estes dados alimentam o gráfico de evolução visual.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm uppercase text-slate-500 border-b pb-1">Flexibilidade</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Thomas Test (Graus)</Label>
                                            <Input type="number" value={data.functional?.flexibility?.thomasTest} onChange={e => updateField('functional.flexibility.thomasTest', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Lunge Test (cm)</Label>
                                            <Input type="number" value={data.functional?.flexibility?.lungeTest} onChange={e => updateField('functional.flexibility.lungeTest', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Banco de Wells (cm)</Label>
                                            <Input type="number" value={data.functional?.flexibility?.wells} onChange={e => updateField('functional.flexibility.wells', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm uppercase text-slate-500 border-b pb-1">Força & Estabilidade</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Ponte (Segundos)</Label>
                                            <Input type="number" value={data.functional?.strength?.bridgeTest} onChange={e => updateField('functional.strength.bridgeTest', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Prancha (Segundos)</Label>
                                            <Input type="number" value={data.functional?.strength?.plankTest} onChange={e => updateField('functional.strength.plankTest', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Dinamometria Global (kg)</Label>
                                            <Input type="number" value={data.functional?.strength?.dynamometry} onChange={e => updateField('functional.strength.dynamometry', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-6 border-t mt-8">
                <Button variant="outline" onClick={() => handleTabChange('prev')} disabled={activeTab === 'anamnese'}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                </Button>
                <Button onClick={() => activeTab === 'functional' ? onSave(data) : handleTabChange('next')} className={activeTab === 'functional' ? "bg-green-600" : ""}>
                    {activeTab === 'functional' ? "Finalizar & Salvar" : "Próximo"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}

function TestCheck({ id, label, data, update }: any) {
    return (
        <div className="flex items-center gap-2 p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all">
            <Checkbox
                id={id}
                checked={data.physicalExam?.specialTests?.[id] || data.physicalExam?.[id]} // Support both paths for legacy
                onCheckedChange={(c) => update(`physicalExam.${id}`, c)}
                className="data-[state=checked]:bg-indigo-600 border-indigo-200"
            />
            <Label htmlFor={id} className="cursor-pointer text-sm text-slate-700">{label}</Label>
        </div>
    )
}
