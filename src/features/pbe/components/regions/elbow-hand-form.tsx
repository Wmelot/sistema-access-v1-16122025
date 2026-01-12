
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Ruler, Activity, AlertCircle } from 'lucide-react'

// Common movements for Elbow/Hand
const ROM_MOVEMENTS = [
    "Cotovelo: Flexão",
    "Cotovelo: Extensão",
    "Antebraço: Pronação",
    "Antebraço: Supinação",
    "Punho: Flexão",
    "Punho: Extensão",
    "Punho: Desvio Radial",
    "Punho: Desvio Ulnar"
]

const SPECIAL_TESTS = [
    { id: 'cozen', label: 'Teste de Cozen (Epicondilite Lateral)' },
    { id: 'mill', label: 'Teste de Mill (Epicondilite Lateral)' },
    { id: 'maudsley', label: 'Teste de Maudsley (Epicondilite Lateral)' },
    { id: 'golfersElbow', label: 'Teste de Cotovelo de Golfista (Epicondilite Medial)' },
    { id: 'phalen', label: 'Teste de Phalen (Túnel do Carpo)' },
    { id: 'reversePhalen', label: 'Phalen Invertido (Túnel do Carpo)' },
    { id: 'tinel', label: 'Sinal de Tinel (Nervo Mediano/Ulnar)' },
    { id: 'finkelstein', label: 'Teste de Finkelstein (De Quervain)' },
    { id: 'froment', label: 'Sinal de Froment (Nervo Ulnar)' },
    { id: 'valgusStressElbow', label: 'Estresse em Valgo (LCM)' },
    { id: 'varusStressElbow', label: 'Estresse em Varo (LCL)' },
]

interface ElbowHandFormProps {
    data: any
    updateField: (path: string, value: any) => void
    readOnly?: boolean
}

export function ElbowHandForm({ data, updateField, readOnly }: ElbowHandFormProps) {
    const handleRomChange = (movement: string, side: 'left' | 'right', value: string) => {
        updateField(`physicalExam.rom.${movement}.${side}`, value)
    }

    const handleTestChange = (testId: string, checked: boolean) => {
        updateField(`physicalExam.specialTests.${testId}`, checked)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. ROM Assessment */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                        <Ruler className="w-4 h-4" /> Amplitude de Movimento (ADM)
                    </CardTitle>
                    <CardDescription>
                        Compare bilateralmente. Valores ativos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-left">
                                    <th className="p-2 font-semibold text-slate-600">Movimento</th>
                                    <th className="p-2 font-semibold text-slate-600 w-24 text-center">Esquerda</th>
                                    <th className="p-2 font-semibold text-slate-600 w-24 text-center">Direita</th>
                                    <th className="p-2 font-semibold text-slate-600 w-32 text-right">Normal (Aprox)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ROM_MOVEMENTS.map((mov) => (
                                    <tr key={mov} className="border-b last:border-0 hover:bg-slate-50/50">
                                        <td className="p-2 font-medium text-slate-700">{mov}</td>
                                        <td className="p-2">
                                            <Input
                                                className="h-8 w-full text-center"
                                                placeholder="Esq"
                                                value={data.physicalExam?.rom?.[mov]?.left || ''}
                                                onChange={(e) => handleRomChange(mov, 'left', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                className="h-8 w-full text-center"
                                                placeholder="Dir"
                                                value={data.physicalExam?.rom?.[mov]?.right || ''}
                                                onChange={(e) => handleRomChange(mov, 'right', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="p-2 text-xs text-muted-foreground text-right italic">
                                            {mov.includes('Flexão') ? '140°/80°' :
                                                mov.includes('Extensão') ? '0°/70°' :
                                                    mov.includes('Pronação') ? '80-90°' : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Special Tests */}
            <Card className="border-indigo-100 bg-indigo-50/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
                        <Activity className="w-4 h-4" /> Testes Especiais
                    </CardTitle>
                    <CardDescription>
                        Marque apenas os testes com resultado POSITIVO (reprodução dos sintomas).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SPECIAL_TESTS.map((test) => (
                            <div
                                key={test.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                            >
                                <Checkbox
                                    id={test.id}
                                    checked={data.physicalExam?.specialTests?.[test.id] || false}
                                    onCheckedChange={(c) => handleTestChange(test.id, c as boolean)}
                                    disabled={readOnly}
                                    className="data-[state=checked]:bg-indigo-600 border-indigo-300"
                                />
                                <Label htmlFor={test.id} className="cursor-pointer text-sm text-slate-700 font-medium">
                                    {test.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 3. Palpation & Observation */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base text-slate-700">Palpação & Observações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Pontos Dolorosos / Deformidades / Edema</Label>
                        <Textarea
                            placeholder="Ex: Dor à palpação no epicôndilo lateral, cisto sinovial dorsal, atrofia tenar..."
                            value={data.physicalExam?.palpation || ''}
                            onChange={(e) => updateField('physicalExam.palpation', e.target.value)}
                            className="min-h-[80px]"
                            disabled={readOnly}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
