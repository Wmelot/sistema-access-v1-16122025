"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Brain, Zap, AlertCircle } from "lucide-react"

import { REFLEXES, MYOTOMES, NEURAL_TENSION_TESTS, suggestRootPathology } from './neurological-constants'
import { DermatomeMap } from './dermatome-map'
import { cn } from "@/lib/utils"

interface NeurologicalAssessmentProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
    region: 'cervical' | 'lumbar' | 'all'
}

export function NeurologicalAssessment({ data, updateField, readOnly, region }: NeurologicalAssessmentProps) {

    // Helper to access nested safe
    const neurology = data.neurological || {}

    // Determine active subsets based on region
    const activeReflexes = region === 'all'
        ? [...REFLEXES.cervical, ...REFLEXES.lumbar]
        : (region === 'cervical' ? REFLEXES.cervical : REFLEXES.lumbar)

    const activeMyotomes = region === 'all'
        ? [...MYOTOMES.cervical, ...MYOTOMES.lumbar]
        : (region === 'cervical' ? MYOTOMES.cervical : MYOTOMES.lumbar)

    const activeTensionTests = region === 'all'
        ? [...NEURAL_TENSION_TESTS.cervical, ...NEURAL_TENSION_TESTS.lumbar]
        : (region === 'cervical' ? NEURAL_TENSION_TESTS.cervical : NEURAL_TENSION_TESTS.lumbar)

    // Calculate suggestions
    const suggestions = useMemo(() => {
        if (region === 'all') return []
        return suggestRootPathology(data, region)
    }, [data, region])

    const handleDermatomeToggle = (id: string) => {
        const current = neurology.dermatomes || []
        const exists = current.includes(id)
        if (exists) {
            updateField('neurological.dermatomes', current.filter((d: string) => d !== id))
        } else {
            updateField('neurological.dermatomes', [...current, id])
        }
    }

    return (
        <Card className="border-indigo-100 bg-indigo-50/10">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-indigo-800">
                            <Brain className="w-5 h-5" /> Exame Neurológico
                        </CardTitle>
                        <CardDescription>Avaliação de reflexos, miótomos, dermátomos e tensão neural.</CardDescription>
                    </div>
                    {suggestions.length > 0 && (
                        <div className="flex flex-col items-end gap-1 animate-in fade-in slide-in-from-right duration-500">
                            <span className="text-xs font-bold uppercase text-slate-500">Raízes Suspeitas</span>
                            <div className="flex gap-1">
                                {suggestions.map(s => (
                                    <Badge key={s.root} className="bg-red-500 hover:bg-red-600">
                                        {s.root} ({s.score}pts)
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-8">

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: TESTS (50%) */}
                    <div className="space-y-6">

                        {/* 1. REFLEXES */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                                <Zap className="w-4 h-4 text-amber-500" /> Reflexos (Osteotendíneos)
                            </h4>
                            <div className="bg-white rounded-lg border p-3 grid gap-3">
                                {activeReflexes.map(reflex => (
                                    <div key={reflex.id} className="flex flex-col gap-1.5 pb-2 border-b last:border-0 last:pb-0">
                                        <div className="text-sm font-medium flex justify-between">
                                            <span>{reflex.label}</span>
                                            <span className="text-xs text-slate-400 font-normal">{reflex.root}</span>
                                        </div>
                                        <div className="w-full">
                                            <Select
                                                value={neurology.reflexes?.[reflex.id] || 'normal'}
                                                onValueChange={(v) => updateField(`neurological.reflexes.${reflex.id}`, v)}
                                                disabled={readOnly}
                                            >
                                                <SelectTrigger className="h-8 w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="normal">Normal (2+)</SelectItem>
                                                    <SelectItem value="hypo">Hipo (1+/0)</SelectItem>
                                                    <SelectItem value="hyper">Hiper (3+)</SelectItem>
                                                    <SelectItem value="clonus">Clônus (4+)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. MYOTOMES */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                                <Zap className="w-4 h-4 text-blue-500" /> Miótomos (Força/Déficit)
                            </h4>
                            <div className="bg-white rounded-lg border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr className="text-left text-xs text-slate-500 uppercase">
                                            <th className="p-2 pl-3">Raíz</th>
                                            <th className="p-2">Músculo Chave</th>
                                            <th className="p-2 text-center w-16">Alt.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {activeMyotomes.map(myo => {
                                            const isChecked = neurology.myotomes?.[myo.root]
                                            return (
                                                <tr key={myo.root} className={cn("hover:bg-slate-50 transition-colors", isChecked && "bg-red-50")}>
                                                    <td className="p-2 pl-3 font-bold text-slate-600">{myo.root}</td>
                                                    <td className="p-2">
                                                        <div className="font-medium text-slate-800">{myo.muscle}</div>
                                                        <div className="text-[10px] text-slate-400">{myo.action}</div>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={(c) => updateField(`neurological.myotomes.${myo.root}`, c)}
                                                            disabled={readOnly}
                                                            className="data-[state=checked]:bg-red-500 border-slate-300"
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>



                    </div>

                    {/* RIGHT COLUMN: MAP (50%) */}
                    <div className="flex flex-col h-full">
                        <div className="bg-white rounded-xl border p-4 shadow-sm h-full">
                            <h4 className="font-semibold text-sm text-center mb-4 text-slate-700">Dermátomos (Sensibilidade)</h4>
                            <DermatomeMap
                                selected={neurology.dermatomes || []}
                                onToggle={handleDermatomeToggle}
                                region={region}
                                readOnly={readOnly}
                            />
                            <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-500 border">
                                <p className="mb-1 font-bold">Instruções:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Clique nas áreas do mapa onde há alteração de sensibilidade (parestesia, hipostesia).</li>
                                    <li>Utilize a lógica combinada (Reflexos + Miótomos + Dermátomos) para identificar a raíz.</li>
                                </ul>
                            </div>

                            {/* 3. TENSION TESTS (Moved here) */}
                            <div className="mt-6 pt-6 border-t space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                                    <AlertCircle className="w-4 h-4 text-purple-500" /> Testes de Tensão Neural
                                </h4>
                                <div className="bg-slate-50 rounded-lg border p-3 grid sm:grid-cols-2 gap-2">
                                    {activeTensionTests.map(test => (
                                        <div key={test.id} className="flex items-center gap-2 p-2 border bg-white rounded hover:bg-slate-50 transition-colors shadow-sm">
                                            <Checkbox
                                                id={`nt-${test.id}`}
                                                checked={neurology.neuralTension?.[test.id]}
                                                onCheckedChange={(c) => updateField(`neurological.neuralTension.${test.id}`, c)}
                                                disabled={readOnly}
                                            />
                                            <Label htmlFor={`nt-${test.id}`} className="text-xs cursor-pointer">
                                                <span className="font-medium block">{test.label}</span>
                                                <span className="text-[10px] text-slate-400">{test.nerve}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
