import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Footprints, Scale, Ruler, Move, Zap, RotateCcw, Shield, Activity,
    Check, ChevronsUpDown, Trash2
} from "lucide-react"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
// Recharts for Gauge
// Note: We can simplify the Gauge or import it if needed. 
// For now, I'll copy the SVG minimal gauge.

import { SHOE_DATABASE, getRecommendedShoes } from '@/app/dashboard/assessments/shoe-database'

interface ShoeAnalysisStepProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
    minimalismIndex: number
    recommendations: any[]
    smartRecommendation: any
}

export function ShoeAnalysisStep({ data, updateField, readOnly, minimalismIndex, recommendations, smartRecommendation }: ShoeAnalysisStepProps) {
    const [openShoeCombo, setOpenShoeCombo] = useState(false)

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

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-blue-500" />
                        Análise de Calçados
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Selector (Combobox) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Selecionar Calçado</Label>
                            {!readOnly && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                        updateField('currentShoe.specs', { weight: 250, drop: 8, stack: 20, flexLong: 'medium', flexTor: 'medium', stability: false })
                                        updateField('currentShoe.model', '')
                                        updateField('currentShoe.selectionId', '')
                                    }}
                                >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Limpar
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Popover open={openShoeCombo} onOpenChange={setOpenShoeCombo}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openShoeCombo}
                                        className="w-full justify-between"
                                        disabled={readOnly}
                                    >
                                        {data.currentShoe.selectionId
                                            ? SHOE_DATABASE.find((shoe) => shoe.id === data.currentShoe.selectionId)?.model || data.currentShoe.model
                                            : "Buscar modelo..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar marca ou modelo..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum calçado encontrado.</CommandEmpty>
                                            <CommandGroup heading="Sugestões">
                                                {SHOE_DATABASE.map((shoe) => (
                                                    <CommandItem
                                                        key={shoe.id}
                                                        value={`${shoe.brand} ${shoe.model}`}
                                                        onSelect={() => {
                                                            selectShoe(shoe.id)
                                                            setOpenShoeCombo(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                data.currentShoe.selectionId === shoe.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{shoe.brand} {shoe.model}</span>
                                                            <span className="text-xs text-muted-foreground capitalize">{shoe.type} - IM: {shoe.minimalismIndex}%</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Input
                            value={data.currentShoe.model}
                            onChange={e => updateField('currentShoe.model', e.target.value)}
                            placeholder="Ou digite o nome do modelo manualmente..."
                            className="mt-2"
                            disabled={readOnly}
                        />
                    </div>

                    {/* Specs Display */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Scale className="w-4 h-4" /> Peso (g)</div>
                            <Input type="number" value={data.currentShoe.specs.weight} onChange={e => updateField('currentShoe.specs.weight', +e.target.value)} className="text-center h-8" disabled={readOnly} />
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Ruler className="w-4 h-4" /> Drop (mm)</div>
                            <Input type="number" value={data.currentShoe.specs.drop} onChange={e => updateField('currentShoe.specs.drop', +e.target.value)} className="text-center h-8" disabled={readOnly} />
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm"><Move className="w-4 h-4" /> Stack (mm)</div>
                            <Input type="number" value={data.currentShoe.specs.stack} onChange={e => updateField('currentShoe.specs.stack', +e.target.value)} className="text-center h-8" disabled={readOnly} />
                        </div>

                        {/* Flex Long */}
                        <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col items-center gap-4 col-span-2 md:col-span-1">
                            <div className="flex flex-col items-center gap-1">
                                <Zap className="w-5 h-5 text-slate-400" />
                                <span className="font-semibold text-slate-600 text-center leading-tight">Flexibilidade<br />Longitudinal</span>
                            </div>
                            <div className="flex justify-center gap-2 flex-wrap">
                                {[0, 1, 2, 3, 4, 5].map((val) => (
                                    <div key={val} className="flex flex-col items-center gap-1">
                                        <button
                                            type="button"
                                            className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-medium transition-all ${data.currentShoe.minScoreData.flexLong === val ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            onClick={() => !readOnly && updateField('currentShoe.minScoreData.flexLong', val)}
                                            disabled={readOnly}
                                        >
                                            {val * 0.5}
                                        </button>
                                        <span className="text-[10px] text-slate-400">{val * 0.5} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Flex Tor */}
                        <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col items-center gap-4 col-span-2 md:col-span-1">
                            <div className="flex flex-col items-center gap-1">
                                <RotateCcw className="w-5 h-5 text-slate-400" />
                                <span className="font-semibold text-slate-600 text-center leading-tight">Flexibilidade<br />Torsional</span>
                            </div>
                            <div className="flex justify-center gap-2 flex-wrap">
                                {[0, 1, 2, 3, 4, 5].map((val) => (
                                    <div key={val} className="flex flex-col items-center gap-1">
                                        <button
                                            type="button"
                                            className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-medium transition-all ${data.currentShoe.minScoreData.flexTor === val ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            onClick={() => !readOnly && updateField('currentShoe.minScoreData.flexTor', val)}
                                            disabled={readOnly}
                                        >
                                            {val * 0.5}
                                        </button>
                                        <span className="text-[10px] text-slate-400">{val} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stability */}
                        <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col items-center gap-4 col-span-2 md:col-span-1">
                            <div className="flex flex-col items-center gap-1">
                                <Shield className="w-5 h-5 text-slate-400" />
                                <span className="font-semibold text-slate-600 text-center leading-tight">Estabilidade<br />(Dispositivos)</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {[5, 4, 3, 2, 1, 0].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold transition-all ${data.currentShoe.minScoreData.stability === val ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            onClick={() => !readOnly && updateField('currentShoe.minScoreData.stability', val)}
                                            disabled={readOnly}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-slate-500 font-medium mt-1">
                                    {data.currentShoe.minScoreData.stability === 5 ? 'Nenhum' :
                                        data.currentShoe.minScoreData.stability === 0 ? '5 ou + Dispositivos' :
                                            `${5 - data.currentShoe.minScoreData.stability} Dispositivos`}
                                </span>
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

                    {/* Smart Recommendation */}
                    <div className="bg-slate-800 p-4 rounded-lg text-left space-y-2 border border-slate-700">
                        <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-xs tracking-wider">
                            <Activity className="w-3 h-3" />
                            Sugestão Clínica (IA)
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {smartRecommendation.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-slate-900 border-slate-600 text-slate-300">
                                Índice {smartRecommendation.indexRange[0]}-{smartRecommendation.indexRange[1]}%
                            </Badge>
                            {smartRecommendation.traits.map((t: string) => (
                                <Badge key={t} variant="outline" className="text-xs bg-slate-900 border-slate-600 text-slate-300">
                                    {t}
                                </Badge>
                            ))}
                        </div>
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
        </div>
    )
}
