"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Save, Baby, HeartPulse, Activity, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface WomensHealthFormProps {
    initialData?: any
    patientId: string
    onSave: (data: any) => void
    readOnly?: boolean
}

const TABS = ['history', 'symptoms', 'physical']

export function WomensHealthForm({ initialData, patientId, onSave, readOnly }: WomensHealthFormProps) {
    const DEFAULT_DATA = {
        // A. OBSTETRIC HISTORY
        obstetric: {
            gestations: 0,
            births: 0,
            birthType: 'vaginal', // vaginal, c_section, mixed
            abortions: 0,
            episiotomy: false,
            menopause: false
        },
        // B. FUNCTIONAL COMPLAINTS
        complaints: {
            stressUrinaryIncontinence: false,
            urgeIncontinence: false,
            nocturia: false,
            prolapseSensation: false,
            constipation: false,
            dyspareunia: false
        },
        // C. RED FLAGS (PREGNANCY)
        redFlags: {
            vaginalBleeding: false,
            amnioticFluidLeak: false,
            severeHeadache: false,
            reducedFetalMovement: false
        },
        // D. PHYSICAL EXAM (PERFECT)
        perfect: {
            power: 0,
            endurance: 0,
            repetitions: 0,
            fast: 0,
            diastasis: false
        }
    }

    const [data, setData] = useState(initialData ? { ...DEFAULT_DATA, ...initialData } : DEFAULT_DATA)
    const [activeTab, setActiveTab] = useState("history")

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

    const hasRedFlags = Object.values(data.redFlags || {}).some(Boolean)

    // Derived Protocol Tags for Backend
    // Logic: If Stress UI -> SUI_FEMALE, If Urge -> OAB_URGE
    // Ideally this logic sits in the backend or 'onSave' handling, but we store it in data structure if needed directly.
    // For now we just gather data.

    return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-pink-900">Saúde da Mulher & Pélvica</h2>
                    <p className="text-pink-600/80 flex items-center gap-2 font-medium">
                        <HeartPulse className="w-4 h-4" />
                        Avaliação Especializada (Uroginecologia)
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={() => onSave(data)} className="bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-100 ring-offset-2 focus:ring-2 ring-pink-500">
                        <Save className="w-4 h-4 mr-2" /> Salvar Avaliação
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-pink-50/50 mb-8 rounded-xl border border-pink-100">
                    <TabsTrigger value="history" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                        <Baby className="w-5 h-5 mb-1" />
                        <span className="font-semibold">1. História Obstétrica</span>
                    </TabsTrigger>
                    <TabsTrigger value="symptoms" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                        <Activity className="w-5 h-5 mb-1" />
                        <span className="font-semibold">2. Queixas & Sintomas</span>
                    </TabsTrigger>
                    <TabsTrigger value="physical" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                        <Brain className="w-5 h-5 mb-1" />
                        <span className="font-semibold">3. Exame Físico (PERFECT)</span>
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: HISTORY --- */}
                <TabsContent value="history" className="space-y-6 animate-in fade-in slide-in-from-left-4">
                    <Card>
                        <CardHeader><CardTitle className="text-pink-900">Histórico Obstétrico & Ginecológico</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label>Gestações (G)</Label>
                                        <Input type="number" min={0} value={data.obstetric?.gestations} onChange={e => updateField('obstetric.gestations', +e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Partos (P)</Label>
                                        <Input type="number" min={0} value={data.obstetric?.births} onChange={e => updateField('obstetric.births', +e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Abortos (A)</Label>
                                        <Input type="number" min={0} value={data.obstetric?.abortions} onChange={e => updateField('obstetric.abortions', +e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Tipo de Parto Predominante</Label>
                                    <Select value={data.obstetric?.birthType} onValueChange={v => updateField('obstetric.birthType', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vaginal">Vaginal</SelectItem>
                                            <SelectItem value="c_section">Cesárea</SelectItem>
                                            <SelectItem value="mixed">Misto</SelectItem>
                                            <SelectItem value="null">Nenhum</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-4 pt-1">
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-pink-50/30 border-pink-100">
                                    <Checkbox
                                        id="episiotomy"
                                        checked={data.obstetric?.episiotomy}
                                        onCheckedChange={c => updateField('obstetric.episiotomy', c)}
                                        className="data-[state=checked]:bg-pink-600 border-pink-300 mt-0.5"
                                    />
                                    <div>
                                        <Label htmlFor="episiotomy" className="font-semibold text-pink-900 cursor-pointer">Histórico de Episiotomia / Laceração?</Label>
                                        <p className="text-xs text-pink-700/70">Cicatrizes perineais podem influenciar na função muscular.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50 border-slate-200">
                                    <Checkbox
                                        id="menopause"
                                        checked={data.obstetric?.menopause}
                                        onCheckedChange={c => updateField('obstetric.menopause', c)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <Label htmlFor="menopause" className="font-semibold text-slate-900 cursor-pointer">Menopausa / Climatério?</Label>
                                        <p className="text-xs text-slate-500">Alterações hormonais (hipoestrogenismo) afetam tecidos.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: SYMPTOMS & TRIAGE --- */}
                <TabsContent value="symptoms" className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    {/* RED FLAGS */}
                    <Card className={cn("border-l-4 shadow-sm", hasRedFlags ? "border-l-red-500 bg-red-50/40 border-red-200" : "border-l-slate-300")}>
                        <CardHeader className="pb-3">
                            <CardTitle className={cn("flex items-center gap-2 text-lg", hasRedFlags ? "text-red-700" : "text-slate-700")}>
                                <AlertTriangle className="w-5 h-5" />
                                Triagem Gestante (Red Flags)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-3">
                                {[
                                    { id: 'vaginalBleeding', label: 'Sangramento Vaginal Recente' },
                                    { id: 'amnioticFluidLeak', label: 'Perda de Líquido Amniótico' },
                                    { id: 'severeHeadache', label: 'Dor de Cabeça Severa / Visão Turva (Pré-Eclâmpsia)' },
                                    { id: 'reducedFetalMovement', label: 'Redução Nítida de Movimentos Fetais' },
                                ].map((flag) => (
                                    <div key={flag.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", data.redFlags?.[flag.id] ? "bg-red-100 border-red-300" : "bg-white border-slate-100")}>
                                        <Checkbox
                                            id={flag.id}
                                            checked={data.redFlags?.[flag.id]}
                                            onCheckedChange={(checked) => updateField(`redFlags.${flag.id}`, checked)}
                                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                        />
                                        <Label htmlFor={flag.id} className="cursor-pointer font-medium text-sm leading-tight text-slate-700">
                                            {flag.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* FUNCTIONAL COMPLAINTS */}
                    <Card>
                        <CardHeader><CardTitle className="text-pink-900">Queixas Funcionais</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                <ComplaintCheck id="stressUrinaryIncontinence" label="Perda de Urina aos Esforços (Tossir/Espirrar)" data={data} update={updateField} />
                                <ComplaintCheck id="urgeIncontinence" label="Urgência Miccional (Não segura até o banheiro)" data={data} update={updateField} />
                                <ComplaintCheck id="nocturia" label="Noctúria (Acorda >2x à noite)" data={data} update={updateField} />
                                <ComplaintCheck id="prolapseSensation" label="Sensação de Peso/Bola na Vagina (Prolapso)" data={data} update={updateField} />
                                <ComplaintCheck id="constipation" label="Constipação Intestinal / Força p/ Evacuar" data={data} update={updateField} />
                                <ComplaintCheck id="dyspareunia" label="Dor na Relação Sexual (Dispareunia)" data={data} update={updateField} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 3: PHYSICAL --- */}
                <TabsContent value="physical" className="space-y-6">
                    <Card className="border-pink-200">
                        <CardHeader className="bg-pink-50/30 border-b border-pink-100">
                            <CardTitle className="text-pink-900 flex items-center justify-between">
                                Exame Físico Pélvico (Escala PERFECT)
                                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-200 ml-2">Oxford Modificada</Badge>
                            </CardTitle>
                            <CardDescription>Avaliação da musculatura do assoalho pélvico (MAP).</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border text-center">
                                    <Label className="text-lg font-bold text-pink-700 block">P</Label>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Power (Força)</span>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Input
                                            type="number"
                                            min={0} max={5}
                                            className="text-center font-bold text-lg h-12 w-20"
                                            value={data.perfect?.power}
                                            onChange={e => updateField('perfect.power', +e.target.value)}
                                        />
                                        <span className="text-slate-400 font-medium">/ 5</span>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border text-center">
                                    <Label className="text-lg font-bold text-pink-700 block">E</Label>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Endurance (s)</span>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            className="text-center font-bold text-lg h-12 w-20"
                                            value={data.perfect?.endurance}
                                            onChange={e => updateField('perfect.endurance', +e.target.value)}
                                        />
                                        <span className="text-slate-400 font-medium">seg</span>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border text-center">
                                    <Label className="text-lg font-bold text-pink-700 block">R</Label>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Repetitions</span>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            className="text-center font-bold text-lg h-12 w-20"
                                            value={data.perfect?.repetitions}
                                            onChange={e => updateField('perfect.repetitions', +e.target.value)}
                                        />
                                        <span className="text-slate-400 font-medium">rep</span>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border text-center">
                                    <Label className="text-lg font-bold text-pink-700 block">F</Label>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Fast (10s)</span>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            className="text-center font-bold text-lg h-12 w-20"
                                            value={data.perfect?.fast}
                                            onChange={e => updateField('perfect.fast', +e.target.value)}
                                        />
                                        <span className="text-slate-400 font-medium">cont</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="diastasis"
                                        checked={data.perfect?.diastasis}
                                        onCheckedChange={c => updateField('perfect.diastasis', c)}
                                        className="data-[state=checked]:bg-yellow-600 border-yellow-400"
                                    />
                                    <div>
                                        <Label htmlFor="diastasis" className="font-bold text-yellow-900 cursor-pointer">Diástase Abdominal Presente?</Label>
                                        <p className="text-xs text-yellow-700">Separação dos retos abdominais (Supra ou Infra-umbilical &gt; 2cm).</p>
                                    </div>
                                </div>
                                <Activity className="text-yellow-400 w-8 h-8 opacity-50" />
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ComplaintCheck({ id, label, data, update }: any) {
    return (
        <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", data.complaints?.[id] ? "bg-pink-50 border-pink-200" : "bg-white hover:bg-slate-50 border-slate-200")}>
            <Checkbox
                id={id}
                checked={data.complaints?.[id]}
                onCheckedChange={(c) => update(`complaints.${id}`, c)}
                className="data-[state=checked]:bg-pink-600 border-pink-200"
            />
            <Label htmlFor={id} className="cursor-pointer text-sm text-slate-700 font-medium leading-tight">{label}</Label>
        </div>
    )
}
