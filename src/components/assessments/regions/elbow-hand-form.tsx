import React from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Ruler, Activity, AlertCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

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
    { id: 'cozen', label: 'Cozen (Epicondilite Lat.)' },
    { id: 'mill', label: 'Mill (Epicondilite Lat.)' },
    { id: 'maudsley', label: 'Maudsley (Epicondilite Lat.)' },
    { id: 'golfersElbow', label: 'Cotovelo Golfista (Ep. Medial)' },
    { id: 'phalen', label: 'Phalen (Túnel Carpo)' },
    { id: 'reversePhalen', label: 'Phalen Invertido' },
    { id: 'tinel', label: 'Tinel (Nervo Med./Ulnar)' },
    { id: 'finkelstein', label: 'Finkelstein (De Quervain)' },
    { id: 'froment', label: 'Froment (Nervo Ulnar)' },
    { id: 'valgusStressElbow', label: 'Estresse Valgo' },
    { id: 'varusStressElbow', label: 'Estresse Varo' },
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. ROM Assessment */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-700" /> Amplitude de Movimento (ADM)
                </h4>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-left">
                                <th className="p-2 font-bold text-slate-500 uppercase text-[10px]">Movimento</th>
                                <th className="p-2 font-bold text-slate-500 uppercase text-[10px] w-24 text-center">Esquerda</th>
                                <th className="p-2 font-bold text-slate-500 uppercase text-[10px] w-24 text-center">Direita</th>
                                <th className="p-2 font-bold text-slate-500 uppercase text-[10px] w-32 text-right">Ref.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ROM_MOVEMENTS.map((mov) => (
                                <tr key={mov} className="border-b last:border-0 hover:bg-slate-50/50">
                                    <td className="p-2 font-medium text-xs text-slate-700">{mov}</td>
                                    <td className="p-2">
                                        <Input
                                            className="h-7 w-full text-center text-xs bg-slate-50 border-transparent focus:bg-white focus:border-slate-300 transition-all font-mono"
                                            placeholder="Des"
                                            value={data.physicalExam?.rom?.[mov]?.left || ''}
                                            onChange={(e) => handleRomChange(mov, 'left', e.target.value)}
                                            disabled={readOnly}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            className="h-7 w-full text-center text-xs bg-slate-50 border-transparent focus:bg-white focus:border-slate-300 transition-all font-mono"
                                            placeholder="Des"
                                            value={data.physicalExam?.rom?.[mov]?.right || ''}
                                            onChange={(e) => handleRomChange(mov, 'right', e.target.value)}
                                            disabled={readOnly}
                                        />
                                    </td>
                                    <td className="p-2 text-[10px] text-slate-400 text-right font-mono">
                                        {mov.includes('Flexão') ? '140°' :
                                            mov.includes('Extensão') ? '0°/70°' :
                                                mov.includes('Pronação') ? '85°' : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. Special Tests */}
            <div className="bg-indigo-50/30 p-4 rounded-lg border border-indigo-100/50">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Testes Especiais
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                    {SPECIAL_TESTS.map((test) => (
                        <div
                            key={test.id}
                            className={cn("flex items-center gap-3 p-2 rounded transition-all", data.physicalExam?.specialTests?.[test.id] ? "bg-indigo-100" : "hover:bg-indigo-100/50")}
                        >
                            <Checkbox
                                id={test.id}
                                checked={data.physicalExam?.specialTests?.[test.id] || false}
                                onCheckedChange={(c) => handleTestChange(test.id, c as boolean)}
                                disabled={readOnly}
                                className="data-[state=checked]:bg-indigo-600 border-indigo-300"
                            />
                            <Label htmlFor={test.id} className={cn("cursor-pointer text-xs font-medium", data.physicalExam?.specialTests?.[test.id] ? "text-indigo-900 font-bold" : "text-slate-600")}>
                                {test.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Palpation & Observation */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    Palpação & Observações
                </h4>
                <Textarea
                    placeholder="Descrição de achados..."
                    value={data.physicalExam?.palpation || ''}
                    onChange={(e) => updateField('physicalExam.palpation', e.target.value)}
                    className="min-h-[80px] bg-white border-slate-200 text-sm"
                    disabled={readOnly}
                />
            </div>
        </div>
    )
}
