'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertCircle, Activity, Dumbbell, Ruler, HeartPulse } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STRENGTH_TESTS, FORCE_REFERENCES_BY_AGE } from '@/app/dashboard/[slug]/assessments/strength-references'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { generateAssessmentReport } from "@/actions/attendance"
import { EvolutionCharts } from '@/components/assessments/evolution-charts'
import { Bot, Loader2, Sparkles, FileText, CheckCircle, Printer, Camera, TrendingUp, Save, Zap, Plus, Trash2, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'


/**
 * Calculates Z-Score and returns classification properties
 */
function getForceClassification(value: number, weight: number, reference: { mean: number, std_dev: number } | undefined) {
    if (!value || !weight || !reference) return null

    const relForce = value / weight
    const zScore = (relForce - reference.mean) / reference.std_dev

    let label = 'Normal'
    let status: 'weak' | 'normal' | 'strong' = 'normal'

    if (zScore < -1) {
        label = 'Abaixo da Média'
        status = 'weak'
    } else if (zScore > 1) {
        label = 'Acima da Média'
        status = 'strong'
    } else {
        label = 'Na Média'
        status = 'normal'
    }

    return { relForce, zScore, label, status }
}

// KCAL Table for Sports (MET values converted to kcal/hour for 70kg person)
const KCAL_TABLE: Record<string, number> = { "Arremesso de Peso/Disco": 300, "Balé": 450, "Basquete": 650, "Beach Tênis": 550, "Bicicleta Ergométrica (Intensa)": 600, "Bike (Ciclismo de Estrada)": 500, "Boxe (Treino)": 800, "Caminhada (5 km/h)": 300, "Caminhada em Trilha (Hiking)": 450, "Capoeira": 650, "Corrida (10 km/h)": 900, "Crossfit": 700, "Dança de Salão": 350, "Danças Urbanas/Hip Hop": 500, "Escalada": 600, "Esgrima": 450, "Frescobol": 400, "Futebol": 800, "Futsal": 750, "Futevôlei": 600, "Ginástica Artística": 400, "Ginástica Laboral": 150, "Ginástica Olímpica": 500, "Golfe": 250, "Handebol": 700, "Hidroginástica": 400, "Jiu-Jitsu": 750, "Judô": 700, "Karatê": 650, "Kickboxing": 850, "Krav Maga": 700, "Musculação": 350, "Muay Thai": 800, "Natação (Crawl moderado)": 600, "Natação (Borboleta/Intenso)": 850, "Padel": 550, "Patinação": 500, "Pilates": 300, "Pular Corda (Rápido)": 950, "Remo": 600, "Rugby": 800, "Skate": 400, "Spinning": 700, "Squash": 900, "Surf": 350, "Tênis": 500, "Tênis de Mesa": 300, "Treino Funcional": 550, "Triatlo": 900, "Vôlei de Praia": 600, "Vôlei de Quadra": 400, "Yoga": 250, "Zumba": 550 };

// --- MODERN SIDEBAR COMPONENT ---
function ModernAssessmentSidebar({
    antro,
    cardio,
    mobility,
    vitals,
    stability,
    onStabilityChange
}: any) {
    const weight = Number(antro.weight) || 0;
    const heightCm = Number(antro.height) || 0;
    const heightM = heightCm / 100;
    const imc = heightM > 0 ? (weight / (heightM * heightM)).toFixed(1) : "0.0";

    // Body Fat Calculation (Pineau Protocol)
    const calculateBodyFat = () => {
        const thigh = Number(antro.thigh) || 0;
        const supra = Number(antro.suprailiac) || 0;
        const abd = Number(antro.abdominal) || 0;
        if (!thigh && !supra && !abd) return 0;

        const sum = thigh + supra + abd;
        let density = 0;

        if (antro.gender === 'male') {
            density = 1.18568 - (0.09062 * Math.log10(sum));
        } else {
            density = 1.13702 - (0.05742 * Math.log10(sum));
        }

        const fatPercent = (495 / density) - 450;
        return Math.max(0, fatPercent).toFixed(1);
    }
    const bodyFat = calculateBodyFat();

    // VO2 Max Calculation
    const calculateVO2Max = () => {
        const age = Number(antro.age) || 30;
        const genderVal = antro.gender === 'male' ? 1 : 0;

        if (cardio.method === 'rockport') {
            const time = Number(cardio.timeMin) || 0;
            const hr = Number(cardio.heartRate) || 0;
            if (!time || !hr || !weight) return 0;

            const weightLb = weight * 2.20462;
            const vo2 = 132.853 - (0.0769 * weightLb) - (0.3877 * age) + (6.315 * genderVal) - (3.2649 * time) - (0.1565 * hr);
            return Math.max(0, vo2).toFixed(1);
        } else {
            const dist = Number(cardio.distance) || 0;
            if (!dist) return 0;
            const vo2 = (dist - 504.9) / 44.73;
            return Math.max(0, vo2).toFixed(1);
        }
    }
    const vo2Max = calculateVO2Max();

    // Radar Data
    const radarData = useMemo(() => {
        const strengthScore = stability.isManual ? 80 : 40;
        const cardioScore = Number(vo2Max) > 40 ? 80 : (Number(vo2Max) > 0 ? 50 : 20);
        const mobilityScore = (Number(mobility.wells) || 0) > 20 ? 80 : 40;
        const compScore = (Number(imc) > 18.5 && Number(imc) < 25) ? 90 : 60;

        return [
            { subject: 'Força', A: strengthScore, fullMark: 100 },
            { subject: 'Cardio', A: cardioScore, fullMark: 100 },
            { subject: 'Mobilidade', A: mobilityScore, fullMark: 100 },
            { subject: 'Comp. Corporal', A: compScore, fullMark: 100 },
        ];
    }, [stability.isManual, vo2Max, mobility.wells, imc]);

    return (
        <Card className="bg-slate-900 text-white border-slate-800 shadow-xl overflow-hidden sticky top-6 h-fit">
            <CardHeader className="pb-4 border-b border-slate-800 bg-slate-950/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Dashboard Clínico
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">IMC Atual</div>
                        <div className="text-2xl font-black text-emerald-400">{imc}</div>
                        <div className="text-[10px] text-slate-500">kg/m²</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">% Gordura</div>
                        <div className="text-2xl font-black text-blue-400">{bodyFat}%</div>
                        <div className="text-[10px] text-slate-500">Estimado</div>
                    </div>
                    <div className="col-span-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700 flex justify-between items-center px-4">
                        <span className="text-[10px] uppercase text-slate-400 font-bold">VO2 Max (Est.)</span>
                        <span className="text-lg font-bold text-orange-400">{Number(vo2Max).toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">ml/kg/min</span></span>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-slate-950/30 rounded-xl p-2 border border-slate-800/50">
                    <div className="h-[220px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#334155" strokeOpacity={0.5} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Paciente"
                                    dataKey="A"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-300">Estabilidade Manual (Core)</Label>
                        <Switch
                            checked={stability.isManual}
                            onCheckedChange={(checked) => onStabilityChange('isManual', checked)}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                    {stability.isManual && (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 bg-slate-800/50 p-2 rounded-lg">
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase pl-1">Esq.</span>
                                <Input
                                    className="bg-slate-900 border-slate-700 h-8 text-xs text-white focus-visible:ring-emerald-500"
                                    placeholder="0-10"
                                    value={stability.left}
                                    onChange={(e) => onStabilityChange('left', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase pl-1">Dir.</span>
                                <Input
                                    className="bg-slate-900 border-slate-700 h-8 text-xs text-white focus-visible:ring-emerald-500"
                                    placeholder="0-10"
                                    value={stability.right}
                                    onChange={(e) => onStabilityChange('right', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="bg-slate-950/80 text-[10px] text-slate-600 justify-center py-2 uppercase tracking-widest font-bold">
                Axiom Clinical AI
            </CardFooter>
        </Card>
    );
}

// --- PROPS & STATE ---
interface PhysicalAssessmentFormV2Props {
    initialData?: any
    onSave?: (data: any) => void
    readOnly?: boolean
    patientId: string
}

export function PhysicalAssessmentFormV2({ initialData, onSave, readOnly = false, patientId }: PhysicalAssessmentFormV2Props) {
    // 1. Antropometria (Pineau Protocol)
    const [antro, setAntro] = useState(initialData?.antro || {
        gender: 'male', // 'male' | 'female'
        age: '', // Anos
        weight: '', // kg
        height: '', // cm
        thigh: '', // mm (Coxa)
        suprailiac: '', // mm (Suprailíaca)
        abdominal: '', // mm (Abdominal)
    })

    // 2. Cardio (VO2)
    const [cardio, setCardio] = useState(initialData?.cardio || {
        method: 'rockport', // 'rockport' | 'cooper'
        timeMin: '', // Rockport: Minutos para caminhar 1 milha
        heartRate: '', // Rockport: FC Final
        distance: '', // Cooper: Metros em 12min
    })

    // 3. Força (Dynamic State)
    const [strength, setStrength] = useState<Record<string, string>>(initialData?.strength || {})

    // 4. Mobilidade e Flexibilidade
    const [mobility, setMobility] = useState(initialData?.mobility || {
        wells: '', // cms
        legRaiseRight: '', // graus
        legRaiseLeft: '', // graus
        shoulderReachRight: '', // cm (Direito por cima)
        shoulderReachLeft: '', // cm (Esquerdo por cima)
    })

    // 5. Perimetria (Medidas)
    const [perimetry, setPerimetry] = useState(initialData?.perimetry || {
        armRelaxedRight: '',
        armContractedRight: '',
        chest: '',
        waist: '',
        hip: '',
        thighRight: '',
        calfRight: '',
        neck: '', // Perímetro do Pescoço
    })

    // 6. Anamnese & Vitals
    const [anamnesis, setAnamnesis] = useState(initialData?.anamnesis || {
        mainComplaint: '',
        history: '',
        trainingLevel: 'intermediate', // beginner, intermediate, advanced
        goal: 'hypertrophy', // hypertrophy, weight_loss, rehab, performance
    })

    const [vitals, setVitals] = useState(initialData?.vitals || {
        restingHeartRate: '',
        bloodPressureSys: '',
        bloodPressureDia: '',
    })

    // 7. Postural Assessment
    const [posture, setPosture] = useState(initialData?.posture || {
        observations: [] as string[],
        photos: {
            anterior: null,
            posterior: null,
            left: null,
            right: null
        }
    })

    // 8. Stability (New)
    const [stability, setStability] = useState(initialData?.stability || {
        isManual: false,
        left: '', // 0-10
        right: '' // 0-10
    })

    // 9. Sports Routine (IPAQ Logic)
    const [sports, setSports] = useState(initialData?.sports || [
        { type: "", freq: "", duration: "" }
    ])

    // Auto-save effect
    const [debouncedData] = useDebounce({
        antro,
        cardio,
        strength,
        mobility,
        perimetry,
        anamnesis,
        vitals,
        posture,
        stability,
        sports
    }, 2000)

    useEffect(() => {
        if (!readOnly && onSave && debouncedData) {
            onSave(debouncedData)
        }
    }, [debouncedData, onSave, readOnly])

    // --- HANDLERS ---
    const handleAntroChange = (f: string, v: string) => setAntro((prev: any) => ({ ...prev, [f]: v }))
    const handleCardioChange = (f: string, v: string) => setCardio((prev: any) => ({ ...prev, [f]: v }))
    const handleStrengthChange = (key: string, v: string) => setStrength(prev => ({ ...prev, [key]: v }))
    const handleMobilityChange = (f: string, v: string) => setMobility((prev: any) => ({ ...prev, [f]: v }))
    const handlePerimetryChange = (f: string, v: string) => setPerimetry((prev: any) => ({ ...prev, [f]: v }))
    const handleAnamnesisChange = (f: string, v: string) => setAnamnesis((prev: any) => ({ ...prev, [f]: v }))
    const handleVitalsChange = (f: string, v: string) => setVitals((prev: any) => ({ ...prev, [f]: v }))
    const handlePostureChange = (f: string, v: any) => setPosture((prev: any) => ({ ...prev, [f]: v }))
    const handleStabilityChange = (f: string, v: any) => setStability((prev: any) => ({ ...prev, [f]: v }))

    const handleSportsChange = (index: number, field: string, value: string) => {
        setSports((prev: any[]) => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }
    const addSport = () => setSports((prev: any[]) => [...prev, { type: "", freq: "", duration: "" }])
    const removeSport = (index: number) => setSports((prev: any[]) => prev.filter((_, i) => i !== index))

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" />
                        Avaliação Física Avançada V2
                    </h2>
                    <p className="text-muted-foreground">Protocolos: Pineau (US), Rockport/Cooper (VO2), Lafayette (Força)</p>
                </div>
                <Button onClick={() => toast.success('Salvo!')} variant="outline" className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar
                </Button>
            </div>

            {/* MAIN LAYOUT GRID (8/4 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* --- LEFT COLUMN: FORM (ACCORDION) --- */}
                <div className="lg:col-span-8 space-y-4">
                    <Accordion type="multiple" defaultValue={["anamnese", "antro", "cardio", "strength", "mobility"]} className="w-full space-y-4">

                        {/* [Item 1] Anamnese & Sinais Vitais */}
                        <AccordionItem value="anamnese" className="border rounded-lg bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Activity className="w-4 h-4 text-blue-500" /> Anamnese & Sinais Vitais</span></AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-4">
                                <div>
                                    <Label>Queixa Principal</Label>
                                    <Input value={anamnesis.mainComplaint} onChange={(e) => handleAnamnesisChange('mainComplaint', e.target.value)} placeholder="Descreva a queixa..." />
                                </div>
                                <div>
                                    <Label>História</Label>
                                    <Input value={anamnesis.history} onChange={(e) => handleAnamnesisChange('history', e.target.value)} placeholder="História da Moléstia Atual..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Nível de Treino</Label>
                                        <Select value={anamnesis.trainingLevel} onValueChange={(v) => handleAnamnesisChange('trainingLevel', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="beginner">Iniciante</SelectItem>
                                                <SelectItem value="intermediate">Intermediário</SelectItem>
                                                <SelectItem value="advanced">Avançado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Objetivo Principal</Label>
                                        <Select value={anamnesis.goal} onValueChange={(v) => handleAnamnesisChange('goal', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                                                <SelectItem value="weight_loss">Emagrecimento</SelectItem>
                                                <SelectItem value="rehab">Reabilitação</SelectItem>
                                                <SelectItem value="performance">Performance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase mb-3 block">Sinais Vitais</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label>FC Repouso (bpm)</Label>
                                            <Input type="number" value={vitals.restingHeartRate} onChange={(e) => handleVitalsChange('restingHeartRate', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>PA Sistólica</Label>
                                            <Input type="number" value={vitals.bloodPressureSys} onChange={(e) => handleVitalsChange('bloodPressureSys', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>PA Diastólica</Label>
                                            <Input type="number" value={vitals.bloodPressureDia} onChange={(e) => handleVitalsChange('bloodPressureDia', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* [Item 2] Antropometria */}
                        <AccordionItem value="antro" className="border rounded-lg bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Ruler className="w-4 h-4 text-orange-500" /> Antropometria (Pineau)</span></AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <Label>Gênero</Label>
                                        <Select value={antro.gender} onValueChange={(v) => handleAntroChange('gender', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Masculino</SelectItem>
                                                <SelectItem value="female">Feminino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Idade</Label>
                                        <Input type="number" value={antro.age} onChange={(e) => handleAntroChange('age', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Peso (kg)</Label>
                                        <Input type="number" value={antro.weight} onChange={(e) => handleAntroChange('weight', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Altura (cm)</Label>
                                        <Input type="number" value={antro.height} onChange={(e) => handleAntroChange('height', e.target.value)} />
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase mb-3 block">Dobras Cutâneas - Ultrassom</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label>Coxa (mm)</Label>
                                            <Input type="number" value={antro.thigh} onChange={(e) => handleAntroChange('thigh', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Suprailíaca (mm)</Label>
                                            <Input type="number" value={antro.suprailiac} onChange={(e) => handleAntroChange('suprailiac', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Abdomem (mm)</Label>
                                            <Input type="number" value={antro.abdominal} onChange={(e) => handleAntroChange('abdominal', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* [Item 3] Cardio */}
                        <AccordionItem value="cardio" className="border rounded-lg bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Heart className="w-4 h-4 text-red-500" /> Cardio (VO2 Max)</span></AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-4">
                                <div>
                                    <Label>Protocolo</Label>
                                    <Select value={cardio.method} onValueChange={(v) => handleCardioChange('method', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rockport">Rockport (Caminhada)</SelectItem>
                                            <SelectItem value="cooper">Cooper (Corrida)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {cardio.method === 'rockport' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Tempo (min)</Label>
                                            <Input type="number" value={cardio.timeMin} onChange={(e) => handleCardioChange('timeMin', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>FC Final (bpm)</Label>
                                            <Input type="number" value={cardio.heartRate} onChange={(e) => handleCardioChange('heartRate', e.target.value)} />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Label>Distância (m)</Label>
                                        <Input type="number" value={cardio.distance} onChange={(e) => handleCardioChange('distance', e.target.value)} />
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        {/* [Item 4] Força & Dinamometria */}
                        <AccordionItem value="strength" className="border rounded-lg bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Dumbbell className="w-4 h-4 text-purple-500" /> Força & Dinamometria</span></AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <Tabs defaultValue="upper" className="w-full">
                                    <TabsList className="w-full grid grid-cols-2 mb-4">
                                        <TabsTrigger value="upper">Membros Superiores</TabsTrigger>
                                        <TabsTrigger value="lower">Membros Inferiores</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="upper" className="space-y-2">
                                        {["Preensão Palmar", "Flexão Cotovelo", "Extensão Cotovelo", "Abdução Ombro"].map((ex) => (
                                            <div key={ex} className="flex items-center gap-4">
                                                <Label className="w-[150px] truncate" title={ex}>{ex}</Label>
                                                <Input placeholder="Dir" className="h-8 text-xs" value={strength[`${ex}_right`] || ''} onChange={(e) => handleStrengthChange(`${ex}_right`, e.target.value)} />
                                                <Input placeholder="Esq" className="h-8 text-xs" value={strength[`${ex}_left`] || ''} onChange={(e) => handleStrengthChange(`${ex}_left`, e.target.value)} />
                                            </div>
                                        ))}
                                    </TabsContent>
                                    <TabsContent value="lower" className="space-y-2">
                                        {["Extensão Joelho", "Flexão Joelho", "Dorsiflexão", "Flexão Plantar"].map((ex) => (
                                            <div key={ex} className="flex items-center gap-4">
                                                <Label className="w-[150px] truncate" title={ex}>{ex}</Label>
                                                <Input placeholder="Dir" className="h-8 text-xs" value={strength[`${ex}_right`] || ''} onChange={(e) => handleStrengthChange(`${ex}_right`, e.target.value)} />
                                                <Input placeholder="Esq" className="h-8 text-xs" value={strength[`${ex}_left`] || ''} onChange={(e) => handleStrengthChange(`${ex}_left`, e.target.value)} />
                                            </div>
                                        ))}
                                    </TabsContent>
                                </Tabs>
                            </AccordionContent>
                        </AccordionItem>

                        {/* [Item 5] Mobilidade e Perimetria */}
                        <AccordionItem value="mobility" className="border rounded-lg bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Zap className="w-4 h-4 text-yellow-500" /> Mobilidade e Perimetria</span></AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-6">
                                <div>
                                    <h4 className="font-semibold text-sm mb-3">Flexibilidade</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <Label className="w-[150px]">Banco de Wells (cm)</Label>
                                            <Input type="number" className="max-w-[120px]" value={mobility.wells} onChange={(e) => handleMobilityChange('wells', e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Label className="w-[150px]">Elevação Perna Reta</Label>
                                            <Input placeholder="Dir" className="max-w-[80px]" value={mobility.legRaiseRight} onChange={(e) => handleMobilityChange('legRaiseRight', e.target.value)} />
                                            <Input placeholder="Esq" className="max-w-[80px]" value={mobility.legRaiseLeft} onChange={(e) => handleMobilityChange('legRaiseLeft', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-3">Perimetria (cm)</h4>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        {["Braço Relaxado", "Braço Contraído", "Tórax", "Cintura", "Quadril", "Coxa", "Panturrilha"].map(part => (
                                            <div key={part} className="flex items-center justify-between">
                                                <Label className="text-xs">{part}</Label>
                                                <Input className="h-7 w-16" value={(perimetry as any)[part] || ''} onChange={(e) => handlePerimetryChange(part, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </div>

                {/* --- RIGHT COLUMN: MODERN SIDEBAR (STICKY 4 COLS) --- */}
                <div className="lg:col-span-4 relative h-full">
                    <ModernAssessmentSidebar
                        antro={antro}
                        cardio={cardio}
                        mobility={mobility}
                        vitals={vitals}
                        stability={stability}
                        onStabilityChange={handleStabilityChange}
                    />
                </div>

            </div>
        </div>
    )
}
