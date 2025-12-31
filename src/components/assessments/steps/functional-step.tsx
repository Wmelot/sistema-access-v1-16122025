import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
    Footprints, Ruler, Scale, Activity, FileText, CheckCircle2,
    Move, AlertCircle, RotateCcw, Zap, Shield
} from "lucide-react"

import { ImagePasteUploader } from '@/components/inputs/image-paste-uploader'
import { InfoLabel, AverageInput } from '../assessment-utils'
import { cn } from "@/lib/utils"
// Recharts imported for DFI Graph
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts'
import { EXERCISE_LIST } from './constants'

interface FunctionalStepProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
    fpiLeft: { score: number, label: string }
    fpiRight: { score: number, label: string }
}

export function FunctionalStep({ data, updateField, readOnly, fpiLeft, fpiRight }: FunctionalStepProps) {
    const [activeTab, setActiveTab] = useState("ortostatismo")

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap mb-6">
                <TabsTrigger value="ortostatismo" className="gap-2"><Footprints className="w-4 h-4" /> Ortostatismo</TabsTrigger>
                <TabsTrigger value="dorsal" className="gap-2"><Ruler className="w-4 h-4" /> Decúbito Dorsal</TabsTrigger>
                <TabsTrigger value="ventral" className="gap-2"><Scale className="w-4 h-4" /> Decúbito Ventral</TabsTrigger>
                <TabsTrigger value="dynamic" className="gap-2"><Activity className="w-4 h-4" /> Dinâmica</TabsTrigger>
                <TabsTrigger value="exams" className="gap-2"><FileText className="w-4 h-4" /> Exames</TabsTrigger>
                <TabsTrigger value="plan" className="gap-2"><CheckCircle2 className="w-4 h-4" /> Plano & Exercícios</TabsTrigger>
            </TabsList>

            {/* TAB 1: ORTOSTATISMO (Functional Part) */}
            <TabsContent value="ortostatismo" className="space-y-6">
                {/* FPI - Foot Posture Index */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Foot Posture Index (FPI-6)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-xs uppercase font-bold text-slate-500">Pé Esquerdo</Label>
                                    <Badge variant="outline">{fpiLeft.score}</Badge>
                                </div>
                                <div className="grid grid-cols-6 gap-1">
                                    {data.fpi.left.map((val: number, i: number) => (
                                        <Input
                                            key={i}
                                            type="number"
                                            min={-2} max={2}
                                            value={val}
                                            onChange={e => { const n = [...data.fpi.left]; n[i] = +e.target.value; updateField('fpi.left', n) }}
                                            className="h-8 text-center p-0"
                                            disabled={readOnly}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-xs uppercase font-bold text-slate-500">Pé Direito</Label>
                                    <Badge variant="outline">{fpiRight.score}</Badge>
                                </div>
                                <div className="grid grid-cols-6 gap-1">
                                    {data.fpi.right.map((val: number, i: number) => (
                                        <Input
                                            key={i}
                                            type="number"
                                            min={-2} max={2}
                                            value={val}
                                            onChange={e => { const n = [...data.fpi.right]; n[i] = +e.target.value; updateField('fpi.right', n) }}
                                            className="h-8 text-center p-0"
                                            disabled={readOnly}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tests: Lunge, Jack, Y-Balance */}
                <Card>
                    <CardHeader><CardTitle>Testes Funcionais (Ortostatismo)</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {/* Jack Test */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-600 uppercase flex items-center gap-2">
                                <Move className="w-4 h-4" /> Jack Test (Mecanismo de Molinete)
                            </Label>
                            <div className="grid md:grid-cols-2 gap-8">
                                {['left', 'right'].map((side) => (
                                    <div key={side} className="space-y-2">
                                        <div className="flex justify-between text-xs uppercase font-bold text-slate-500">
                                            <span>{side === 'left' ? 'Esquerdo' : 'Direito'}</span>
                                            <span className={cn("text-lg", (data.flexibility as any)[side === 'left' ? 'jackLeft' : 'jackRight'] < 0 ? "text-red-500" : "text-green-500")}>{(data.flexibility as any)[side === 'left' ? 'jackLeft' : 'jackRight']}</span>
                                        </div>
                                        <Slider
                                            min={-5} max={5} step={1}
                                            value={[(data.flexibility as any)[side === 'left' ? 'jackLeft' : 'jackRight']]}
                                            onValueChange={([v]) => updateField(`flexibility.${side === 'left' ? 'jackLeft' : 'jackRight'}`, v)}
                                            className="py-2"
                                            disabled={readOnly}
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>-5 (Bloqueado)</span>
                                            <span>0</span>
                                            <span>+5 (Livre)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        {/* Lunge Test */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Lunge Test (E) º</Label>
                                <Input type="number" value={data.flexibility.lungeLeft} onChange={e => updateField('flexibility.lungeLeft', +e.target.value)} disabled={readOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>Lunge Test (D) º</Label>
                                <Input type="number" value={data.flexibility.lungeRight} onChange={e => updateField('flexibility.lungeRight', +e.target.value)} disabled={readOnly} />
                            </div>
                        </div>
                        <Separator />
                        {/* Y-Balance */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-600 uppercase flex items-center justify-between">
                                <span>Y-Balance Test</span>
                                <div className="flex gap-4 text-xs font-normal normal-case">
                                    {['l', 'r'].map(side => {
                                        const isManual = data.yBalance?.isManualStability
                                        const manualScore = data.yBalance?.manualStability?.[side] || 0
                                        const ant = data.yBalance?.anterior?.[side] || 0
                                        const pm = data.yBalance?.posteromedial?.[side] || 0
                                        const pl = data.yBalance?.posterolateral?.[side] || 0
                                        const limb = data.yBalance?.limbLength?.[side] || 0
                                        const yBalanceScore = limb > 0 ? ((ant + pm + pl) / (3 * limb)) * 100 : 0
                                        const finalScore = isManual ? (manualScore * 10) : yBalanceScore

                                        return (
                                            <span key={side} className="flex gap-1 items-center">
                                                <span className="font-bold uppercase">{side === 'l' ? 'Esq' : 'Dir'}:</span>
                                                <Badge variant="outline" className={cn(finalScore > 0 ? "bg-slate-100" : "")}>
                                                    {finalScore > 0 ? finalScore.toFixed(1) + '%' : '-'}
                                                </Badge>
                                            </span>
                                        )
                                    })}
                                </div>
                            </Label>

                            {/* Dominant Leg */}
                            <div className="flex gap-6 justify-center bg-slate-50 p-2 rounded-md border text-sm mb-2">
                                <span className="font-semibold text-slate-500 uppercase text-xs self-center">Perna Dominante:</span>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="dom-left"
                                        checked={data.yBalance?.dominantLeg === 'left'}
                                        onCheckedChange={(c) => c && updateField('yBalance.dominantLeg', 'left')}
                                        disabled={readOnly}
                                    />
                                    <label htmlFor="dom-left" className="text-sm font-medium">Esquerda</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="dom-right"
                                        checked={data.yBalance?.dominantLeg === 'right'}
                                        onCheckedChange={(c) => c && updateField('yBalance.dominantLeg', 'right')}
                                        disabled={readOnly}
                                    />
                                    <label htmlFor="dom-right" className="text-sm font-medium">Direita</label>
                                </div>
                            </div>

                            {/* Manual Toggle */}
                            <div className="flex items-center space-x-2 pb-2">
                                <Switch
                                    id="manual-stability"
                                    checked={data.yBalance?.isManualStability || false}
                                    onCheckedChange={(checked) => updateField('yBalance.isManualStability', checked)}
                                    disabled={readOnly}
                                />
                                <Label htmlFor="manual-stability" className="text-sm font-normal text-slate-600">
                                    Avaliação Manual de Estabilidade (Idosos/Limitação)
                                </Label>
                            </div>

                            {/* Logic for Manual vs Y-Balance Inputs... (Abbreviated for Step logic, fully implemented below) */}
                            {data.yBalance?.isManualStability ? (
                                <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-yellow-800 uppercase">Estabilidade Esquerda (0-10)</Label>
                                        <Input type="number" min={0} max={10} value={data.yBalance?.manualStability?.l || ''} onChange={e => updateField('yBalance.manualStability.l', +e.target.value)} disabled={readOnly} className="bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-yellow-800 uppercase">Estabilidade Direita (0-10)</Label>
                                        <Input type="number" min={0} max={10} value={data.yBalance?.manualStability?.r || ''} onChange={e => updateField('yBalance.manualStability.r', +e.target.value)} disabled={readOnly} className="bg-white" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-slate-500">Comprimento MIE (cm)</Label>
                                            <Input type="number" value={data.yBalance?.limbLength?.l} onChange={e => updateField('yBalance.limbLength.l', +e.target.value)} disabled={readOnly} className="bg-white h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-slate-500">Comprimento MID (cm)</Label>
                                            <Input type="number" value={data.yBalance?.limbLength?.r} onChange={e => updateField('yBalance.limbLength.r', +e.target.value)} disabled={readOnly} className="bg-white h-8" />
                                        </div>
                                    </div>
                                    {/* Y-Balance Grid Implementation */}
                                    <div className="space-y-6">
                                        {/* Left Side */}
                                        <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-4 items-start">
                                            <div className="flex flex-col items-center justify-center h-full pt-1"><Badge variant="outline" className="bg-slate-100 border-none w-full justify-center">ESQ</Badge></div>
                                            <AverageInput value={data.yBalance?.anterior?.l} onChange={val => updateField('yBalance.anterior.l', val)} trials={data.yBalance?.trials?.anterior?.l} onTrialsChange={t => updateField('yBalance.trials.anterior.l', t)} />
                                            <AverageInput value={data.yBalance?.posteromedial?.l} onChange={val => updateField('yBalance.posteromedial.l', val)} trials={data.yBalance?.trials?.posteromedial?.l} onTrialsChange={t => updateField('yBalance.trials.posteromedial.l', t)} />
                                            <AverageInput value={data.yBalance?.posterolateral?.l} onChange={val => updateField('yBalance.posterolateral.l', val)} trials={data.yBalance?.trials?.posterolateral?.l} onTrialsChange={t => updateField('yBalance.trials.posterolateral.l', t)} />
                                        </div>
                                        {/* Right Side */}
                                        <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-4 items-start">
                                            <div className="flex flex-col items-center justify-center h-full pt-1"><Badge variant="outline" className="bg-slate-100 border-none w-full justify-center">DIR</Badge></div>
                                            <AverageInput value={data.yBalance?.anterior?.r} onChange={val => updateField('yBalance.anterior.r', val)} trials={data.yBalance?.trials?.anterior?.r} onTrialsChange={t => updateField('yBalance.trials.anterior.r', t)} />
                                            <AverageInput value={data.yBalance?.posteromedial?.r} onChange={val => updateField('yBalance.posteromedial.r', val)} trials={data.yBalance?.trials?.posteromedial?.r} onTrialsChange={t => updateField('yBalance.trials.posteromedial.r', t)} />
                                            <AverageInput value={data.yBalance?.posterolateral?.r} onChange={val => updateField('yBalance.posterolateral.r', val)} trials={data.yBalance?.trials?.posterolateral?.r} onTrialsChange={t => updateField('yBalance.trials.posterolateral.r', t)} />
                                        </div>
                                    </div>
                                    {/* Analysis Alert */}
                                    {(() => {
                                        const la = data.yBalance?.anterior?.l || 0
                                        const ra = data.yBalance?.anterior?.r || 0
                                        const diff = Math.abs(la - ra)
                                        if (diff > 4 && la > 0 && ra > 0) {
                                            return (
                                                <Alert variant="destructive" className="mt-4">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Risco de Lesão</AlertTitle>
                                                    <AlertDescription>
                                                        Diferença Anterior de {diff.toFixed(1)}cm (&gt;4cm).
                                                    </AlertDescription>
                                                </Alert>
                                            )
                                        }
                                        return null
                                    })()}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 2: DORSAL */}
            <TabsContent value="dorsal" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Thomas & Isquios</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Thomas Test</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Esq (Graus)" type="number" value={data.flexibility.thomasLeft} onChange={e => updateField('flexibility.thomasLeft', +e.target.value)} disabled={readOnly} />
                                <Input placeholder="Dir (Graus)" type="number" value={data.flexibility.thomasRight} onChange={e => updateField('flexibility.thomasRight', +e.target.value)} disabled={readOnly} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Isquios (Graus)</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Esq (Graus)" type="number" value={data.flexibility.hamstringLeft} onChange={e => updateField('flexibility.hamstringLeft', +e.target.value)} disabled={readOnly} />
                                <Input placeholder="Dir (Graus)" type="number" value={data.flexibility.hamstringRight} onChange={e => updateField('flexibility.hamstringRight', +e.target.value)} disabled={readOnly} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Mobilidade</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase text-slate-500">Mobilidade dos Raios</Label>
                            {['left', 'right'].map((side) => (
                                <div key={side} className="space-y-1">
                                    <div className="flex justify-between text-xs"><span>{side === 'left' ? 'Esq' : 'Dir'}</span><span>{(data.flexibility as any)[side === 'left' ? 'mobilityRaysLeft' : 'mobilityRaysRight']}</span></div>
                                    <Slider min={-5} max={5} step={1} value={[(data.flexibility as any)[side === 'left' ? 'mobilityRaysLeft' : 'mobilityRaysRight']]} onValueChange={([v]) => updateField(`flexibility.${side === 'left' ? 'mobilityRaysLeft' : 'mobilityRaysRight'}`, v)} disabled={readOnly} />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase text-slate-500">Mobilidade do Mediopé</Label>
                            {['left', 'right'].map((side) => (
                                <div key={side} className="space-y-1">
                                    <div className="flex justify-between text-xs"><span>{side === 'left' ? 'Esq' : 'Dir'}</span><span>{(data.flexibility as any)[side === 'left' ? 'mobilityRearLeft' : 'mobilityRearRight']}</span></div>
                                    <Slider min={-5} max={5} step={1} value={[(data.flexibility as any)[side === 'left' ? 'mobilityRearLeft' : 'mobilityRearRight']]} onValueChange={([v]) => updateField(`flexibility.${side === 'left' ? 'mobilityRearLeft' : 'mobilityRearRight'}`, v)} disabled={readOnly} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 3: VENTRAL */}
            <TabsContent value="ventral" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Medidas, Anteversão e Rotação</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase text-slate-500">Medidas Retropé e Antepé</Label>
                            <div className="space-y-3">
                                <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-4 items-center">
                                    <Badge variant="outline" className="justify-center">ESQ</Badge>
                                    <Input placeholder="Retropé" type="number" value={data.measurements?.retrope?.left} onChange={e => updateField('measurements.retrope.left', +e.target.value)} className="h-8 text-center" disabled={readOnly} />
                                    <Input placeholder="Antepé" type="number" value={data.measurements?.antepe?.left} onChange={e => updateField('measurements.antepe.left', +e.target.value)} className="h-8 text-center" disabled={readOnly} />
                                    <Input placeholder="APA" type="number" value={data.measurements?.apa?.left} onChange={e => updateField('measurements.apa.left', +e.target.value)} className="h-8 text-center" disabled={readOnly} />
                                </div>
                                <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-4 items-center">
                                    <Badge variant="outline" className="justify-center">DIR</Badge>
                                    <Input placeholder="Retropé" type="number" value={data.measurements?.retrope?.right} onChange={e => updateField('measurements.retrope.right', +e.target.value)} className="h-8 text-center" disabled={readOnly} />
                                    <Input placeholder="Antepé" type="number" value={data.measurements?.antepe?.right} onChange={e => updateField('measurements.antepe.right', +e.target.value)} className="h-8 text-center" disabled={readOnly} />
                                    <Input placeholder="APA" type="number" value={data.measurements?.apa?.right} onChange={e => updateField('measurements.apa.right', +e.target.value)} className="h-8 text-center" disabled={readOnly} />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Anteversão (Craig) º</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Esq" type="number" value={data.anteversion?.left} onChange={e => updateField('anteversion.left', +e.target.value)} disabled={readOnly} />
                                    <Input placeholder="Dir" type="number" value={data.anteversion?.right} onChange={e => updateField('anteversion.right', +e.target.value)} disabled={readOnly} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Rotadores (Graus)</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Esq" type="number" value={data.rotation?.left} onChange={e => updateField('rotation.left', +e.target.value)} disabled={readOnly} />
                                    <Input placeholder="Dir" type="number" value={data.rotation?.right} onChange={e => updateField('rotation.right', +e.target.value)} disabled={readOnly} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Força Muscular (Glúteos)</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Glúteo Médio (0-10)</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Esq" type="number" min={0} max={10} value={data.strength?.gluteMedLeft} onChange={e => updateField('strength.gluteMedLeft', +e.target.value)} disabled={readOnly} />
                                    <Input placeholder="Dir" type="number" min={0} max={10} value={data.strength?.gluteMedRight} onChange={e => updateField('strength.gluteMedRight', +e.target.value)} disabled={readOnly} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Glúteo Máximo (0-10)</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Esq" type="number" min={0} max={10} value={data.strength?.gluteMaxLeft} onChange={e => updateField('strength.gluteMaxLeft', +e.target.value)} disabled={readOnly} />
                                    <Input placeholder="Dir" type="number" min={0} max={10} value={data.strength?.gluteMaxRight} onChange={e => updateField('strength.gluteMaxRight', +e.target.value)} disabled={readOnly} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 4: DINÂMICA */}
            <TabsContent value="dynamic" className="space-y-6">
                {/* Single Leg Squat */}
                <Card>
                    <CardHeader><CardTitle>Agachamento Unipodal</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-12">
                        {/* Pelvic Drop */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase text-slate-500">Queda Pélvica</Label>
                            {['left', 'right'].map((side) => (
                                <div key={side} className="space-y-3">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span>{side === 'left' ? 'Esquerda' : 'Direita'}</span>
                                        <span className={cn("text-lg", (data.singleLegSquat?.pelvicDrop?.[side] ?? 0) < 0 ? "text-red-500" : "text-green-500")}>{data.singleLegSquat?.pelvicDrop?.[side] ?? 0}</span>
                                    </div>
                                    <Slider min={-5} max={5} step={1} value={[data.singleLegSquat?.pelvicDrop?.[side] ?? 0]} onValueChange={([v]) => updateField(`singleLegSquat.pelvicDrop.${side}`, v)} disabled={readOnly} />
                                </div>
                            ))}
                        </div>
                        {/* Dynamic Valgus */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase text-slate-500">Valgo Dinâmico</Label>
                            {['left', 'right'].map((side) => (
                                <div key={side} className="space-y-3">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span>{side === 'left' ? 'Esquerdo' : 'Direito'}</span>
                                        <span className={cn("text-lg", (data.singleLegSquat?.dynamicValgus?.[side] ?? 0) < 0 ? "text-red-500" : "text-green-500")}>{data.singleLegSquat?.dynamicValgus?.[side] ?? 0}</span>
                                    </div>
                                    <Slider min={-5} max={5} step={1} value={[data.singleLegSquat?.dynamicValgus?.[side] ?? 0]} onValueChange={([v]) => updateField(`singleLegSquat.dynamicValgus.${side}`, v)} disabled={readOnly} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* DFI */}
                <Card>
                    <CardHeader><CardTitle>Dynamic Foot Index (DFI)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-xs uppercase text-slate-500 font-semibold"><tr><th className="p-2">Fase</th><th className="p-2">Esq</th><th className="p-2">Dir</th></tr></thead>
                                    <tbody className="divide-y">
                                        {['initial', 'loading', 'propulsion'].map((phase) => (
                                            <tr key={phase} className="bg-white">
                                                <td className="p-2 font-medium capitalize">{phase === 'initial' ? 'Contato Inicial' : phase === 'loading' ? 'Resp. Carga' : 'Impulsão'}</td>
                                                <td className="p-2">
                                                    <Select value={String(data.dfi.left[phase])} onValueChange={(v) => updateField(`dfi.left.${phase}`, parseInt(v))} disabled={readOnly}>
                                                        <SelectTrigger className="h-7 text-xs border-none bg-transparent shadow-none"><SelectValue /></SelectTrigger>
                                                        <SelectContent><SelectItem value="-2">-2</SelectItem><SelectItem value="-1">-1</SelectItem><SelectItem value="0">0</SelectItem><SelectItem value="1">+1</SelectItem><SelectItem value="2">+2</SelectItem></SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-2">
                                                    <Select value={String(data.dfi.right[phase])} onValueChange={(v) => updateField(`dfi.right.${phase}`, parseInt(v))} disabled={readOnly}>
                                                        <SelectTrigger className="h-7 text-xs border-none bg-transparent shadow-none"><SelectValue /></SelectTrigger>
                                                        <SelectContent><SelectItem value="-2">-2</SelectItem><SelectItem value="-1">-1</SelectItem><SelectItem value="0">0</SelectItem><SelectItem value="1">+1</SelectItem><SelectItem value="2">+2</SelectItem></SelectContent>
                                                    </Select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="h-[200px] w-full border rounded-lg p-2 bg-slate-50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[
                                        { stage: 'C. Ini', L: data.dfi.left.initial, R: data.dfi.right.initial },
                                        { stage: 'Carga', L: data.dfi.left.loading, R: data.dfi.right.loading },
                                        { stage: 'Impul', L: data.dfi.left.propulsion, R: data.dfi.right.propulsion },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[-2.5, 2.5]} tick={{ fontSize: 10 }} />
                                        <Line type="monotone" dataKey="L" stroke="#2563eb" strokeWidth={2} dot />
                                        <Line type="monotone" dataKey="R" stroke="#d97706" strokeWidth={2} dot />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <ImagePasteUploader label="C. Inicial (E)" value={data.dfiImages.initial.left} onChange={v => updateField('dfiImages.initial.left', v)} readOnly={readOnly} />
                            <ImagePasteUploader label="C. Inicial (D)" value={data.dfiImages.initial.right} onChange={v => updateField('dfiImages.initial.right', v)} readOnly={readOnly} />
                            <ImagePasteUploader label="Carga (E)" value={data.dfiImages.loading.left} onChange={v => updateField('dfiImages.loading.left', v)} readOnly={readOnly} />
                            <ImagePasteUploader label="Carga (D)" value={data.dfiImages.loading.right} onChange={v => updateField('dfiImages.loading.right', v)} readOnly={readOnly} />
                            <ImagePasteUploader label="Impulsão (E)" value={data.dfiImages.propulsion.left} onChange={v => updateField('dfiImages.propulsion.left', v)} readOnly={readOnly} />
                            <ImagePasteUploader label="Impulsão (D)" value={data.dfiImages.propulsion.right} onChange={v => updateField('dfiImages.propulsion.right', v)} readOnly={readOnly} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 5: EXAMES */}
            <TabsContent value="exams" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Exames Complementares</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Descreva os exames apresentados..."
                            value={data.exams}
                            onChange={e => updateField('exams', e.target.value)}
                            className="min-h-[200px]"
                            disabled={readOnly}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 6: PLANO */}
            <TabsContent value="plan" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Plano Terapêutico</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Exercícios Sugeridos</Label>
                            <div className="grid md:grid-cols-2 gap-2">
                                {EXERCISE_LIST.map((ex, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-slate-50">
                                        <Checkbox
                                            id={`ex-${i}`}
                                            checked={data.exercises?.includes(ex)}
                                            onCheckedChange={(checked) => {
                                                if (readOnly) return
                                                const current = data.exercises || []
                                                if (checked) updateField('exercises', [...current, ex])
                                                else updateField('exercises', current.filter((e: string) => e !== ex))
                                            }}
                                            disabled={readOnly}
                                        />
                                        <Label htmlFor={`ex-${i}`} className="text-sm cursor-pointer leading-tight">{ex}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Orientações ao Paciente</Label>
                            <Textarea
                                value={data.orientations}
                                onChange={e => updateField('orientations', e.target.value)}
                                placeholder="Orientações adicionais..."
                                className="h-32"
                                disabled={readOnly}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
