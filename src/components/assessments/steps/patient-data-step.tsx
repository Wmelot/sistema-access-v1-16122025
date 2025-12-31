"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Activity, FileText, Shield, RotateCcw
} from "lucide-react"
import { PREV_TREATMENTS, PHYSICAL_ACTIVITIES } from '../biomechanics-constants'

interface PatientDataStepProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function PatientDataStep({ data, updateField, readOnly }: PatientDataStepProps) {
    const [activeTab, setActiveTab] = useState("anamnese")

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 whitespace-nowrap overflow-x-auto text-[10px] md:text-sm">
                <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                <TabsTrigger value="history">História Pregressa</TabsTrigger>
                <TabsTrigger value="objectives">Objetivos</TabsTrigger>
            </TabsList>

            {/* TAB 1: ANAMNESE */}
            <TabsContent value="anamnese" className="mt-6">
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
                                        disabled={readOnly}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>História da Moléstia Atual (HMA)</Label>
                                    <Textarea
                                        value={data.hma}
                                        onChange={e => updateField('hma', e.target.value)}
                                        placeholder="Detalhes da história..."
                                        className="min-h-[100px]"
                                        disabled={readOnly}
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
                                        disabled={readOnly}
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
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {/* EFEP SECTION */}
                        <div className="space-y-4">
                            <div className="flex actions-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                <h3 className="font-semibold text-sm uppercase text-slate-500">Funcionalidade (EFEP/PSFS)</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Identifique 3 atividades importantes com dificuldade. (0=Incapaz, 10=Capaz).
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
                                                placeholder={`Ex: Subir escadas...`}
                                                value={item.activity}
                                                onChange={e => updateField(`efep.items.${idx}.activity`, e.target.value)}
                                                className="bg-white"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-3">
                                            <Select
                                                value={String(item.score)}
                                                onValueChange={v => updateField(`efep.items.${idx}.score`, +v)}
                                                disabled={readOnly}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 11 }, (_, i) => (
                                                        <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 flex justify-end items-center gap-4 border-t border-slate-200 mt-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Score Funcional</span>
                                    <span className="font-bold text-lg text-blue-600 bg-white px-3 py-1 rounded border">
                                        {((data.efep?.items.reduce((acc: number, it: any) => acc + (+it.score || 0), 0) / 3) * 10).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 2: HISTÓRIA PREGRESSA */}
            <TabsContent value="history" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-orange-500" />
                            História Pregressa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>HP (História Pregressa)</Label>
                            <Textarea
                                value={data.history?.hp || ''}
                                onChange={e => updateField('history.hp', e.target.value)}
                                placeholder="Texto longo..."
                                className="min-h-[100px]"
                                disabled={readOnly}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Medicação em uso</Label>
                            <Input
                                value={data.history?.medication || ''}
                                onChange={e => updateField('history.medication', e.target.value)}
                                placeholder="Texto..."
                                disabled={readOnly}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="font-semibold text-sm">Tratamento Prévio</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {PREV_TREATMENTS.map(item => (
                                    <div key={item} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`treat-${item}`}
                                            checked={data.history?.prevTreatment?.includes(item)}
                                            onCheckedChange={(checked) => {
                                                if (readOnly) return
                                                const current = data.history?.prevTreatment || []
                                                const updated = checked
                                                    ? [...current, item]
                                                    : current.filter((i: string) => i !== item)
                                                updateField('history.prevTreatment', updated)
                                            }}
                                            disabled={readOnly}
                                        />
                                        <Label htmlFor={`treat-${item}`} className="text-sm font-normal">{item}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="font-semibold text-sm">Atividade Física Regular</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                                {PHYSICAL_ACTIVITIES.map(item => (
                                    <div key={item} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`phys-${item}`}
                                            checked={data.history?.physicalActivity?.includes(item)}
                                            onCheckedChange={(checked) => {
                                                if (readOnly) return
                                                const current = data.history?.physicalActivity || []
                                                const updated = checked
                                                    ? [...current, item]
                                                    : current.filter((i: string) => i !== item)
                                                updateField('history.physicalActivity', updated)
                                            }}
                                            disabled={readOnly}
                                        />
                                        <Label htmlFor={`phys-${item}`} className="text-xs font-normal">{item}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-semibold text-sm">Frequência Atividade Física</Label>
                            <RadioGroup
                                value={data.history?.activityFrequency || 'sedentary'}
                                onValueChange={(v) => !readOnly && updateField('history.activityFrequency', v)}
                                className="flex flex-wrap gap-4"
                                disabled={readOnly}
                            >
                                <div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="freq-sed" /><Label htmlFor="freq-sed">Sedentário</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="1x" id="freq-1x" /><Label htmlFor="freq-1x">1x por semana</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="2x" id="freq-2x" /><Label htmlFor="freq-2x">2x por semana</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="3x" id="freq-3x" /><Label htmlFor="freq-3x">3x por semana</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="4x" id="freq-4x" /><Label htmlFor="freq-4x">4x por semana</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="5x" id="freq-5x" /><Label htmlFor="freq-5x">5x ou mais</Label></div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 3: OBJETIVOS */}
            <TabsContent value="objectives" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-500" />
                            Objetivos & Nível
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-3">
                            <Label className="font-semibold text-sm text-slate-500 uppercase">Objetivos</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {['Reduzir Dor', 'Performance', 'Conforto', 'Transição', 'Estabilidade'].map(goal => (
                                    <div key={goal} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`goal-${goal}`}
                                            checked={data.patientProfile?.goals?.includes(goal)}
                                            onCheckedChange={(checked) => {
                                                if (readOnly) return
                                                const current = data.patientProfile?.goals || []
                                                const updated = checked
                                                    ? [...current, goal]
                                                    : current.filter((g: string) => g !== goal)
                                                updateField('patientProfile.goals', updated)
                                            }}
                                            disabled={readOnly}
                                        />
                                        <Label htmlFor={`goal-${goal}`}>{goal}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-semibold text-sm text-slate-500 uppercase">Nível de Experiência</Label>
                            <RadioGroup
                                value={data.patientProfile?.experience || 'recreational'}
                                onValueChange={(v) => !readOnly && updateField('patientProfile.experience', v)}
                                className="grid md:grid-cols-3 gap-4"
                                disabled={readOnly}
                            >
                                <div className="flex items-center space-x-2"><RadioGroupItem value="beginner" id="exp-beg" /><Label htmlFor="exp-beg">Iniciante (&lt; 6 meses)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="recreational" id="exp-rec" /><Label htmlFor="exp-rec">Recreacional (&gt; 6 meses)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="competitive" id="exp-comp" /><Label htmlFor="exp-comp">Competitivo / Elite</Label></div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-semibold text-sm text-slate-500 uppercase">Status da Lesão</Label>
                            <RadioGroup
                                value={data.patientProfile?.injuryStatus || 'none'}
                                onValueChange={(v) => !readOnly && updateField('patientProfile.injuryStatus', v)}
                                className="grid md:grid-cols-4 gap-4"
                                disabled={readOnly}
                            >
                                <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="inj-none" /><Label htmlFor="inj-none">Não Lesionado</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="acute" id="inj-acute" /><Label htmlFor="inj-acute">Aguda (&lt; 3 sem)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="persistent" id="inj-persistent" /><Label htmlFor="inj-persistent">Persistente (&gt; 3 meses)</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="return" id="inj-return" /><Label htmlFor="inj-return">Retorno ao Esporte</Label></div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
