"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
    Activity, Ruler, Footprints, AlertCircle, Dumbbell, Move,
    ChevronRight, ChevronLeft, Save, FileText, Zap, Shield,
    ArrowRight, CheckCircle2, RotateCcw, Scale
} from "lucide-react"

// Charts (Recharts)
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts'

import { SHOE_DATABASE, getRecommendedShoes, ShoeModel } from '@/app/dashboard/assessments/shoe-database'
import { BodyPainMap } from './body-pain-map'

interface BiomechanicsFormProps {
    initialData?: any
    patientId: string
    onSave: (data: any) => void
    readOnly?: boolean
}

const DEFAULT_DATA = {
    // 1. Anamnesis
    qp: '',
    hma: '',
    painDuration: '',
    eva: 0,

    // 2. Pain Map
    painMap: { anterior: [], posterior: [], feet: [] },
    // 2b. Specific Pain Checklist (Legacy Support)
    painPoints: {
        metatarsal1: { right: false, left: false },
        metatarsal3: { right: false, left: false },
        metatarsal5: { right: false, left: false },
        calcaneus: { right: false, left: false },
        arch: { right: false, left: false },
        achilles: { right: false, left: false },
        knee: { right: false, left: false },
        hip: { right: false, left: false },
    },

    // 3. Current Shoes (For Recommendations)
    currentShoe: {
        model: '',
        size: '',
        selectionId: '', // from DB
        isManual: true, // Allow manual edit
        specs: { // Manual override or loaded from DB
            weight: 250,
            drop: 8,
            stack: 20,
            flexLong: 'medium', // low, medium, high
            flexTor: 'medium',
            stability: false
        }
    },

    // 4. Physical Exam (FPI)
    fpi: {
        right: [0, 0, 0, 0, 0, 0], // 6 items (-2 to +2 each)
        left: [0, 0, 0, 0, 0, 0]
    },

    // 4b. Anthropometry & Tests
    anthropometry: {
        dismetria: { right: 0, left: 0 }, // mm
        naviculometer: { right: 0, left: 0 }, // mm
        craig: { right: 0, left: 0 }, // degrees (Anteversion)
        pelvicDrop: { right: false, left: false }, // Queda Pélvica
        dynamicValgus: { right: false, left: false } // Valgo Dinâmico
    },

    // 5. Dynamic Exam (DFI)
    dfi: {
        right: { initial: 0, loading: 0, propulsion: 0 }, // -1 (Sup), 0 (Neu), 1 (Pro)
        left: { initial: 0, loading: 0, propulsion: 0 }
    },

    // 6. Capabilities (Radar Inputs)
    flexibility: {
        lungeRight: 35, lungeLeft: 35, // degrees
        mobilityRight: 0, mobilityLeft: 0, // -5 to +5
        thomasRight: 5, thomasLeft: 5, // degrees
        hamstringRight: 110, hamstringLeft: 110, // degrees
        jackRight: 0, jackLeft: 0, // -5 to +5
        rotatorsRight: 35, rotatorsLeft: 35 // degrees
    },
    strength: {
        gluteMedRight: 5, gluteMedLeft: 5, // 0-10
        gluteMaxRight: 5, gluteMaxLeft: 5,
        trunkincRight: 0, trunkincLeft: 0 // -5 to +5 (Deviation)
    },
    balance: {
        stabRight: 0, stabLeft: 0 // -5 to +5
    },
    functionScore: 0, // Legacy support
    efep: {
        items: [
            { activity: '', score: 0 },
            { activity: '', score: 0 },
            { activity: '', score: 0 }
        ],
        total: 0
    },

    // 7. Plan
    exercises: [] // Selected IDs
}

export function BiomechanicsForm({ initialData, patientId, onSave, readOnly = false }: BiomechanicsFormProps) {
    // --- STATE MANAGEMENT ---
    // Safe initialization logic: Merge Defaults <- InitialData
    // We do a deep merge for safety on nested objects like 'specs'
    const [data, setData] = useState<any>(() => {
        if (!initialData || Object.keys(initialData).length === 0) return DEFAULT_DATA

        // Deep merge helper (simple version for this specific structure)
        return {
            ...DEFAULT_DATA,
            ...initialData,
            painMap: { ...DEFAULT_DATA.painMap, ...(initialData.painMap || {}) },
            painPoints: { ...DEFAULT_DATA.painPoints, ...(initialData.painPoints || {}) },
            currentShoe: {
                ...DEFAULT_DATA.currentShoe,
                ...(initialData.currentShoe || {}),
                specs: { ...DEFAULT_DATA.currentShoe.specs, ...(initialData.currentShoe?.specs || {}) }
            },
            fpi: { ...DEFAULT_DATA.fpi, ...(initialData.fpi || {}) },
            anthropometry: { ...DEFAULT_DATA.anthropometry, ...(initialData.anthropometry || {}) },
            dfi: { ...DEFAULT_DATA.dfi, ...(initialData.dfi || {}) },
            flexibility: { ...DEFAULT_DATA.flexibility, ...(initialData.flexibility || {}) },
            strength: { ...DEFAULT_DATA.strength, ...(initialData.strength || {}) },
            balance: { ...DEFAULT_DATA.balance, ...(initialData.balance || {}) },
            efep: {
                ...DEFAULT_DATA.efep,
                ...(initialData.efep || {}),
                items: (initialData.efep?.items || DEFAULT_DATA.efep.items).map((it: any, idx: number) => ({
                    ...DEFAULT_DATA.efep.items[idx],
                    ...it
                }))
            },
        }
    })

    // Debounced Autosave
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!readOnly && JSON.stringify(data) !== JSON.stringify(initialData)) {
                onSave(data)
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [data, onSave, readOnly, initialData])


    // --- LOGIC HELPER FUNCTIONS ---

    // 1. Minimalism Index (0-100%)
    const minimalismIndex = useMemo(() => {
        const s = data.currentShoe.specs
        let score = 0

        // Weight (Lighter is better for minimalism) < 200g = 5pts, > 350g = 0pts
        score += Math.max(0, 5 - (s.weight - 150) / 40)

        // Drop (Lower is better) 0mm = 5pts, >12mm = 0pts
        score += Math.max(0, 5 - (s.drop / 2.4))

        // Stack (Lower is better) <15mm = 5pts, >35mm = 0pts
        score += Math.max(0, 5 - (s.stack - 10) / 5)

        // Flexibility
        if (s.flexLong === 'high') score += 5
        else if (s.flexLong === 'medium') score += 2.5

        if (s.flexTor === 'high') score += 5
        else if (s.flexTor === 'medium') score += 2.5

        // Stability (None = 5pts)
        if (!s.stability) score += 5

        // Normalize to 100% (Max score 30)
        return Math.min(100, Math.round((score / 30) * 100))
    }, [data.currentShoe.specs])

    // 2. FPI Classification
    const getFpiClass = (scores: number[]) => {
        const sum = scores.reduce((a, b) => a + b, 0)
        if (sum > 6) return { label: 'Pronado (Plano)', color: 'text-orange-600', score: sum }
        if (sum < -6) return { label: 'Supinado (Cavo)', color: 'text-blue-600', score: sum }
        return { label: 'Neutro', color: 'text-green-600', score: sum }
    }
    const fpiRight = getFpiClass(data.fpi.right)
    const fpiLeft = getFpiClass(data.fpi.left)

    // 3. Radar Data Generation
    const radarData = useMemo(() => {
        // Helpers for normalization
        const norm100 = (val: number, max: number) => Math.min(100, (val / max) * 100)
        const mapRange = (val: number, min: number, max: number) => {
            // Map val from [min, max] to [0, 100]
            const p = (val - min) / (max - min)
            return Math.min(100, Math.max(0, p * 100))
        }

        // 1. Pain (Less pain = Higher score)
        const scorePain = 100 - (data.eva * 10)

        // 2. Function
        // EFEP Logic: Average of the 3 items (0-10 each). 
        // 0 = Incapaz (Bad), 10 = Capaz (Good).
        // Result needs to be 0-100.
        // So (Sum / 3) * 10
        const efepItems = data.efep?.items || []
        const efepSum = efepItems.reduce((acc: number, item: any) => acc + (+item.score || 0), 0)
        const scoreFunc = efepItems.length > 0 ? (efepSum / efepItems.length) * 10 : 0

        // 3. Stability (Avg of stabRight/Left which are -5 to +5. 0 is ideal?)
        // Wait, User said "Estabilidade e equilíbrio: deve ser igual a média das 4 variáveis"
        // And "valor convertido para 100".
        // If -5 (Unstable) to +5 (Very Stable)? Or is 0 ideal?
        // Assuming +5 is BEST stability.
        const stabAvg = (data.balance.stabRight + data.balance.stabLeft) / 2 // -5 to 5
        const scoreStab = mapRange(stabAvg, -5, 5)

        // 4. Strength (0-10 inputs -> 0-100)
        const strAvg = (
            data.strength.gluteMedRight + data.strength.gluteMedLeft +
            data.strength.gluteMaxRight + data.strength.gluteMaxLeft
        ) / 4
        const scoreStr = strAvg * 10

        // 5. Posture (FPI Deviation)
        // Neutral (0) = 100. Deviation (+10 or -10) = 0.
        // FPI Sum ranges roughly -12 to +12.
        const devR = Math.abs(fpiRight.score)
        const devL = Math.abs(fpiLeft.score)
        const devAvg = (devR + devL) / 2
        const scorePosture = Math.max(0, 100 - (devAvg * 8)) // 12 * 8 = 96 approx

        // 6. Flexibility (Weighted)
        // Logic:
        // Mobilidade (-5 to 5) -> +5 = 100
        const scoreMob = mapRange((data.flexibility.mobilityRight + data.flexibility.mobilityLeft) / 2, -5, 5)

        // Thomas (>10 = 100). Linear up to 10?
        // Let's cap at 10. 0 = 0, 10 = 100.
        const scoreThomas = mapRange((data.flexibility.thomasRight + data.flexibility.thomasLeft) / 2, 0, 10)

        // Isquios (>132 = 100). 
        const scoreHam = mapRange((data.flexibility.hamstringRight + data.flexibility.hamstringLeft) / 2, 90, 132)

        // Rotators (40-42 Ideal). <40 Bad. >42 Bad? User "Aumentada para valores superiores a 42".
        // Wait. "flexibilidade reduzida < 40, Normal 40-42, Aumentada > 42".
        // "Aumentada" is usually good in flexibility context OR instability?
        // Assuming for Score 0-100 (Capability), standard range is best?
        // Or is "More Flexibility" always better? User said "Lunge > 45 boa flexibilidade".
        // Let's assume higher is better for score, but 40-42 is "Normal".
        // Actually, let's strictly follow: >40 is Good (100).
        const avgRot = (data.flexibility.rotatorsRight + data.flexibility.rotatorsLeft) / 2
        const scoreRot = avgRot >= 40 ? 100 : mapRange(avgRot, 20, 40)

        // Lunge (>45 = 100)
        const avgLunge = (data.flexibility.lungeRight + data.flexibility.lungeLeft) / 2
        const scoreLunge = avgLunge >= 45 ? 100 : mapRange(avgLunge, 20, 45)

        // Jack (-5 to 5).
        const scoreJack = mapRange((data.flexibility.jackRight + data.flexibility.jackLeft) / 2, -5, 5)

        // Weighted Avg (Lunge x2, Rot x2)
        const totalFlex = (scoreMob + scoreThomas + scoreHam + (scoreRot * 2) + scoreJack + (scoreLunge * 2)) / 8

        // 7. Symmetry
        // 100 - %Diff. 
        // Logic: Dismetria > 20mm = 0.
        const dismR = data.anthropometry?.dismetria?.right || 0
        const dismL = data.anthropometry?.dismetria?.left || 0
        const diffMm = Math.abs(dismR - dismL)
        const scoreSym = Math.max(0, 100 - (diffMm * 5)) // 20mm * 5 = 100 penalty

        return [
            { subject: 'Dor (Alívio)', A: scorePain, fullMark: 100 },
            { subject: 'Função', A: scoreFunc, fullMark: 100 },
            { subject: 'Estabilidade', A: scoreStab, fullMark: 100 },
            { subject: 'Força', A: scoreStr, fullMark: 100 },
            { subject: 'Postura', A: scorePosture, fullMark: 100 },
            { subject: 'Simetria', A: scoreSym, fullMark: 100 },
            { subject: 'Flexibilidade', A: totalFlex, fullMark: 100 },
        ]
    }, [data, fpiRight.score, fpiLeft.score])


    // --- HANDLERS ---
    const updateField = (path: string, val: any) => {
        setData((prev: any) => {
            const newState = { ...prev }
            const parts = path.split('.')
            let current = newState
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = { ...current[parts[i]] }
                current = current[parts[i]]
            }
            current[parts[parts.length - 1]] = val
            return newState
        })
    }

    const selectShoe = (shoeId: string) => {
        const shoe = SHOE_DATABASE.find(s => s.id === shoeId)
        if (shoe) {
            updateField('currentShoe.model', `${shoe.brand} ${shoe.model}`)
            updateField('currentShoe.selectionId', shoe.id)
            updateField('currentShoe.specs', {
                weight: shoe.weight,
                drop: shoe.drop,
                stack: shoe.stackHeight,
                flexLong: shoe.flexibility === 'high' ? 'high' : 'medium',
                flexTor: shoe.flexibility === 'high' ? 'high' : 'medium', // mapping
                stability: shoe.stabilityControl
            })
        }
    }

    // Recommendations
    const recommendations = useMemo(() => {
        return getRecommendedShoes({
            footType: fpiRight.label.includes('Plano') ? 'flat' : fpiRight.label.includes('Cavo') ? 'cavus' : 'neutral',
            weight: 75, // Placeholder, need patient weight
            experienceLevel: 'intermediate',
            currentMinimalismIndex: minimalismIndex
        })
    }, [fpiRight, minimalismIndex])

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* 1. Header & Anamnesis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Anamnese & Queixa
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Queixa Principal (QP)</Label>
                                <Input
                                    value={data.qp}
                                    onChange={e => updateField('qp', e.target.value)}
                                    placeholder="Descreva a queixa..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>História da Moléstia Atual (HMA)</Label>
                                <Textarea
                                    value={data.hma}
                                    onChange={e => updateField('hma', e.target.value)}
                                    placeholder="Detalhes da história..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Tempo de Dor</Label>
                                <Input
                                    value={data.painDuration}
                                    onChange={e => updateField('painDuration', e.target.value)}
                                    placeholder="Ex: 3 semanas, 2 anos..."
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Intensidade da Dor (EVA)</Label>
                                    <span className={`font-bold text-lg ${data.eva > 7 ? 'text-red-500' : 'text-primary'}`}>
                                        {data.eva}/10
                                    </span>
                                </div>
                                <Slider
                                    value={[data.eva]}
                                    onValueChange={v => updateField('eva', v[0])}
                                    max={10} step={1}
                                    className="py-4"
                                />
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* EFEP SECTION - Moved Inside Anamnese Card */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold text-sm uppercase text-slate-500">Funcionalidade (EFEP/PSFS)</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Identifique 3 atividades importantes que você tem dificuldade. Avalie a capacidade de 0 (Incapaz) a 10 (Capaz como antes).
                        </p>

                        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                            <div className="grid grid-cols-12 gap-4 font-bold text-xs text-slate-500 uppercase">
                                <div className="col-span-8 md:col-span-9">Atividade Específica</div>
                                <div className="col-span-4 md:col-span-3 text-center">Nota (0-10)</div>
                            </div>
                            {data.efep?.items.map((item: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-8 md:col-span-9">
                                        <Input
                                            placeholder={`Ex: Subir escadas, Correr 5km...`}
                                            value={item.activity}
                                            onChange={e => updateField(`efep.items.${idx}.activity`, e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-3">
                                        <Select
                                            value={String(item.score)}
                                            onValueChange={v => updateField(`efep.items.${idx}.score`, +v)}
                                        >
                                            <SelectTrigger className="bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 11 }, (_, i) => (
                                                    <SelectItem key={i} value={String(i)}>{i} - {i === 0 ? 'Incapaz' : i === 10 ? 'Capaz' : ''}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2 flex justify-end items-center gap-4 border-t border-slate-200 mt-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Score Funcional (Média)</span>
                                <span className="font-bold text-lg text-blue-600 bg-white px-3 py-1 rounded border">
                                    {((data.efep?.items.reduce((acc: number, it: any) => acc + (+it.score || 0), 0) / 3) * 10).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Pain Map (Radar Style) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" />
                        Mapeamento da Dor
                    </CardTitle>
                    <CardDescription>Clique nas áreas dolorosas para registrar no mapa corporal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BodyPainMap
                        painPoints={data.painPoints}
                        onChange={(v: any) => updateField('painPoints', v)}
                        readOnly={readOnly}
                    />
                </CardContent>
            </Card>


        </Card >

            {/* 3. Shoe Analysis (The Engine) */ }
    < div className="grid md:grid-cols-3 gap-6" >
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-blue-500" />
                    Análise de Calçados
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Selector */}
                <div className="space-y-2">
                    <Label>Selecionar Calçado (Banco de Dados) ou Digitar Manualmente</Label>
                    <div className="flex gap-2">
                        <Select onValueChange={selectShoe}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Escolha um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {SHOE_DATABASE.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.brand} {s.model} ({s.type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => updateField('currentShoe.specs', DEFAULT_DATA.currentShoe.specs)}>Limpar</Button>
                    </div>
                    <Input
                        value={data.currentShoe.model}
                        onChange={e => updateField('currentShoe.model', e.target.value)}
                        placeholder="Nome do modelo (caso não esteja na lista)"
                        className="mt-2"
                    />
                </div>

                {/* Specs Display - Editable now */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Scale className="w-4 h-4" /> Peso (g)</div>
                        <Input
                            type="number"
                            value={data.currentShoe.specs.weight}
                            onChange={e => updateField('currentShoe.specs.weight', +e.target.value)}
                            className="text-center h-8"
                        />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Ruler className="w-4 h-4" /> Drop (mm)</div>
                        <Input
                            type="number"
                            value={data.currentShoe.specs.drop}
                            onChange={e => updateField('currentShoe.specs.drop', +e.target.value)}
                            className="text-center h-8"
                        />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Move className="w-4 h-4" /> Stack (mm)</div>
                        <Input
                            type="number"
                            value={data.currentShoe.specs.stack}
                            onChange={e => updateField('currentShoe.specs.stack', +e.target.value)}
                            className="text-center h-8"
                        />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Zap className="w-4 h-4" /> Flexibilidade</div>
                        <Select
                            value={data.currentShoe.specs.flexLong}
                            onValueChange={v => {
                                updateField('currentShoe.specs.flexLong', v)
                                updateField('currentShoe.specs.flexTor', v)
                            }}
                        >
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Baixa (Rígido)</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta (Flexível)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Shield className="w-4 h-4" /> Estabilidade</div>
                        <div className="flex items-center justify-center h-8">
                            <Checkbox
                                checked={data.currentShoe.specs.stability}
                                onCheckedChange={c => updateField('currentShoe.specs.stability', c)}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Score & Recommendations */}
        <Card className="bg-slate-900 text-white border-slate-800">
            <CardHeader>
                <CardTitle className="text-center">Índice Minimalista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 text-center">
                <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32">
                        <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                        <circle className="text-green-500" strokeWidth="8" strokeDasharray={360} strokeDashoffset={360 - (360 * minimalismIndex / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                    </svg>
                    <span className="absolute text-3xl font-bold">{minimalismIndex}%</span>
                </div>

                <div className="text-left space-y-4 pt-4 border-t border-slate-700">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Recomendados</h4>
                    <div className="space-y-2">
                        {recommendations.map((rec, i) => (
                            <div key={rec.id} className="flex items-center gap-3 text-sm">
                                <div className="flex-1">
                                    <div className="font-medium text-white">{rec.brand} {rec.model}</div>
                                    <div className="text-xs text-slate-400">IM: {rec.minimalismIndex}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div >

    {/* 4. Measurements & Exam Data */ }
    < Tabs defaultValue="physical" className="w-full" >
        <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="physical" className="gap-2"><Footprints className="w-4 h-4" /> Exame Físico (FPI/DFI)</TabsTrigger>
            <TabsTrigger value="capabilities" className="gap-2"><Ruler className="w-4 h-4" /> Capacidades (Medidas)</TabsTrigger>
            <TabsTrigger value="plan" className="gap-2"><FileText className="w-4 h-4" /> Plano & Exercícios</TabsTrigger>
        </TabsList>

        {/* A. Physical Exam (FPI) */}
        <TabsContent value="physical" className="space-y-6 mt-6">
            {/* Anthropometry Section - NEW */}
            <Card>
                <CardHeader>
                    <CardTitle>Antropometria e Testes Especiais</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase text-slate-500">Dismetria (Comprimento MMPP)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Direito (mm)</Label>
                                <Input type="number" value={data.anthropometry?.dismetria?.right} onChange={e => updateField('anthropometry.dismetria.right', +e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Esquerdo (mm)</Label>
                                <Input type="number" value={data.anthropometry?.dismetria?.left} onChange={e => updateField('anthropometry.dismetria.left', +e.target.value)} />
                            </div>
                        </div>
                        <div className="pt-2 text-xs text-muted-foreground flex justify-between">
                            <span>Diferença: {Math.abs((data.anthropometry?.dismetria?.right || 0) - (data.anthropometry?.dismetria?.left || 0))}mm</span>
                            <span>{Math.abs((data.anthropometry?.dismetria?.right || 0) - (data.anthropometry?.dismetria?.left || 0)) > 20 ? 'Significativa' : 'Normal'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase text-slate-500">Biometria / Testes</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Anteversão (Craig) º</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="D" value={data.anthropometry?.craig?.right} onChange={e => updateField('anthropometry.craig.right', +e.target.value)} />
                                    <Input placeholder="E" value={data.anthropometry?.craig?.left} onChange={e => updateField('anthropometry.craig.left', +e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Naviculômetro (mm)</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="D" value={data.anthropometry?.naviculometer?.right} onChange={e => updateField('anthropometry.naviculometer.right', +e.target.value)} />
                                    <Input placeholder="E" value={data.anthropometry?.naviculometer?.left} onChange={e => updateField('anthropometry.naviculometer.left', +e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-2">
                                <Checkbox checked={data.anthropometry?.pelvicDrop?.right} onCheckedChange={c => updateField('anthropometry.pelvicDrop.right', c)} />
                                <Label className="text-xs">Queda Pélvica (D)</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox checked={data.anthropometry?.dynamicValgus?.right} onCheckedChange={c => updateField('anthropometry.dynamicValgus.right', c)} />
                                <Label className="text-xs">Valgo Dinâmico (D)</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Foot Posture Index (FPI-6)</CardTitle>
                    <CardDescription>Avaliação da postura estática do pé (-2 Supinado a +2 Pronado)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Simple Matrix for FPI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Right Foot */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm uppercase text-slate-500">Pé Direito</h4>
                                <Badge className={`${fpiRight.color.replace('text-', 'bg-')}/10 text-white border-none`}>
                                    {fpiRight.label} ({fpiRight.score})
                                </Badge>
                            </div>
                            <div className="grid grid-cols-6 gap-1 text-center text-xs text-muted-foreground">
                                <span>Talar</span><span>Curv.</span><span>Calc.</span><span>Talo.</span><span>Arco</span><span>Abd.</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                                {data.fpi.right.map((val: number, i: number) => (
                                    <Input
                                        key={i}
                                        type="number"
                                        min={-2} max={2}
                                        value={val}
                                        onChange={e => {
                                            const newArr = [...data.fpi.right]
                                            newArr[i] = parseInt(e.target.value) || 0
                                            updateField('fpi.right', newArr)
                                        }}
                                        className="h-8 p-1 text-center"
                                    />
                                ))}
                            </div>
                        </div>
                        {/* Left Foot */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm uppercase text-slate-500">Pé Esquerdo</h4>
                                <Badge className={`${fpiLeft.color.replace('text-', 'bg-')}/10 text-white border-none`}>
                                    {fpiLeft.label} ({fpiLeft.score})
                                </Badge>
                            </div>
                            <div className="grid grid-cols-6 gap-1 text-center text-xs text-muted-foreground">
                                <span>Talar</span><span>Curv.</span><span>Calc.</span><span>Talo.</span><span>Arco</span><span>Abd.</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                                {data.fpi.left.map((val: number, i: number) => (
                                    <Input
                                        key={i}
                                        type="number"
                                        min={-2} max={2}
                                        value={val}
                                        onChange={e => {
                                            const newArr = [...data.fpi.left]
                                            newArr[i] = parseInt(e.target.value) || 0
                                            updateField('fpi.left', newArr)
                                        }}
                                        className="h-8 p-1 text-center"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* B. Capabilities (All the inputs for Radar) */}
        <TabsContent value="capabilities" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Flexibilities */}
                <Card>
                    <CardHeader><CardTitle>Flexibilidade (Goniometria/Testes)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 items-end">
                            <Label className="col-span-1">Teste</Label>
                            <Label className="text-center text-xs">Direito</Label>
                            <Label className="text-center text-xs">Esquerdo</Label>
                        </div>

                        {/* Lunge */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <Label>Lunge (cm/graus)</Label>
                            <Input type="number" value={data.flexibility.lungeRight} onChange={e => updateField('flexibility.lungeRight', +e.target.value)} />
                            <Input type="number" value={data.flexibility.lungeLeft} onChange={e => updateField('flexibility.lungeLeft', +e.target.value)} />
                        </div>
                        {/* Thomas */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <Label>Thomas (Graus)</Label>
                            <Input type="number" value={data.flexibility.thomasRight} onChange={e => updateField('flexibility.thomasRight', +e.target.value)} />
                            <Input type="number" value={data.flexibility.thomasLeft} onChange={e => updateField('flexibility.thomasLeft', +e.target.value)} />
                        </div>
                        {/* Isquios */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <Label>Isquios (Graus)</Label>
                            <Input type="number" value={data.flexibility.hamstringRight} onChange={e => updateField('flexibility.hamstringRight', +e.target.value)} />
                            <Input type="number" value={data.flexibility.hamstringLeft} onChange={e => updateField('flexibility.hamstringLeft', +e.target.value)} />
                        </div>
                        {/* Rotators */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <Label>Rotadores (Graus)</Label>
                            <Input type="number" value={data.flexibility.rotatorsRight} onChange={e => updateField('flexibility.rotatorsRight', +e.target.value)} />
                            <Input type="number" value={data.flexibility.rotatorsLeft} onChange={e => updateField('flexibility.rotatorsLeft', +e.target.value)} />
                        </div>
                        {/* Mobility */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <Label>Mobilidade (-5 a +5)</Label>
                            <Input type="number" value={data.flexibility.mobilityRight} onChange={e => updateField('flexibility.mobilityRight', +e.target.value)} />
                            <Input type="number" value={data.flexibility.mobilityLeft} onChange={e => updateField('flexibility.mobilityLeft', +e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Strength & Balance */}
                <Card>
                    <CardHeader><CardTitle>Força e Estabilidade</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* Strength */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Força (0-10)</Label>
                            <div className="grid grid-cols-3 gap-2 items-center">
                                <Label>Glúteo Médio</Label>
                                <Input type="number" value={data.strength.gluteMedRight} onChange={e => updateField('strength.gluteMedRight', +e.target.value)} />
                                <Input type="number" value={data.strength.gluteMedLeft} onChange={e => updateField('strength.gluteMedLeft', +e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 items-center">
                                <Label>Glúteo Máximo</Label>
                                <Input type="number" value={data.strength.gluteMaxRight} onChange={e => updateField('strength.gluteMaxRight', +e.target.value)} />
                                <Input type="number" value={data.strength.gluteMaxLeft} onChange={e => updateField('strength.gluteMaxLeft', +e.target.value)} />
                            </div>
                        </div>
                        <Separator />
                        {/* Balance */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Equilíbrio (Y-Balance/Outros) (-5 a +5)</Label>
                            <div className="grid grid-cols-3 gap-2 items-center">
                                <Label>Estabilidade</Label>
                                <Input type="number" value={data.balance.stabRight} onChange={e => updateField('balance.stabRight', +e.target.value)} />
                                <Input type="number" value={data.balance.stabLeft} onChange={e => updateField('balance.stabLeft', +e.target.value)} />
                            </div>
                        </div>
                        <Separator />
                        {/* Function */}
                        <div className="space-y-2">
                            <Label>Score Funcional (EFEP/Outros) 0-100</Label>
                            <Input type="number" value={data.functionScore} onChange={e => updateField('functionScore', +e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="plan">
            <Card>
                <CardHeader>
                    <CardTitle>Plano Terapêutico</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Selecione exercícios e orientações (Em breve).</p>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs >

    {/* 5. Radar Chart (Capabilities) */ }
    < Card >
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Modelo de Capacidades e Demandas
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Paciente" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card >

    {/* Save Button Floating */ }
    < div className="fixed bottom-6 right-6 z-50" >
        <Button size="lg" className="shadow-2xl gap-2 rounded-full px-8" onClick={() => onSave(data)}>
            <Save className="w-5 h-5" />
            Salvar Avaliação
        </Button>
    </div >
        </div >
    )
}
