import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Ruler, Activity, CheckCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

interface ShoulderFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function ShoulderForm({ data, updateField, readOnly }: ShoulderFormProps) {
    const roms = ['Flexão', 'Abdução', 'Rotação Externa', 'Rotação Interna', 'Extensão']
    const tests = [
        { id: 'neer', label: 'Neer (Impacto)', group: 'impingement' },
        { id: 'hawkins', label: 'Hawkins-Kennedy (Impacto)', group: 'impingement' },
        { id: 'jobe', label: 'Jobe / Empty Can (Supra)', group: 'cuff' },
        { id: 'patte', label: 'Patte / Rot. Ext (Infra)', group: 'cuff' },
        { id: 'lift_off', label: 'Lift Off / Gerber (Subescap)', group: 'cuff' },
        { id: 'speed', label: 'Speed Test (Bíceps)', group: 'biceps' },
        { id: 'yergason', label: 'Yergason (Bíceps)', group: 'biceps' },
        { id: 'apprehension', label: 'Apreensão Anterior', group: 'instability' },
        { id: 'relocation', label: 'Relocation (Jobe Relocation)', group: 'instability' },
    ]

    return (
        <div className="space-y-8">
            {/* 1. ROM */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-500" /> Amplitude de Movimento (ROM)
                </h4>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {roms.map(m => (
                        <div key={m} className="bg-slate-50 rounded border border-slate-100 p-2">
                            <Label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">{m}</Label>
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={data.physicalExam?.rom?.[m] || ''}
                                    onChange={(e) => updateField(`physicalExam.rom.${m}`, e.target.value)}
                                    className="h-7 bg-white text-xs font-mono border-slate-200"
                                />
                                <span className="text-xs text-slate-500 font-medium">°</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <Label className="text-xs font-bold text-blue-800 mb-1 block">Ritmo Escápulo-Umeral</Label>
                    <Select
                        value={data.physicalExam?.observation?.scapularRhythm || ''}
                        onValueChange={(v) => updateField(`physicalExam.observation.scapularRhythm`, v)}
                    >
                        <SelectTrigger className="bg-white border-blue-200 h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="normal">Normal (2:1)</SelectItem>
                            <SelectItem value="dyskinesis_1">Discinese Leve (Saliência ângulo inf.)</SelectItem>
                            <SelectItem value="dyskinesis_2">Discinese Moderada (Borda medial)</SelectItem>
                            <SelectItem value="dyskinesis_3">Discinese Grave (Borda superior/total)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 2. SPECIFIC TESTS */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" /> Testes Especiais (Manguito & Labrum)
                </h4>

                <div className="grid md:grid-cols-2 gap-x-2 gap-y-2">
                    {tests.map((test, idx) => (
                        <div key={test.id} className={cn("flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-white")}>
                            <Label className="cursor-pointer text-xs font-medium text-slate-700" htmlFor={test.id}>
                                {test.label}
                            </Label>
                            <Select
                                value={data.physicalExam?.specialTests?.[test.id] || ''}
                                onValueChange={(v) => updateField(`physicalExam.specialTests.${test.id}`, v)}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="w-[110px] h-7 text-[10px] bg-white"><SelectValue placeholder="Result." /></SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="negative" className="text-green-600">Negativo</SelectItem>
                                    <SelectItem value="positive" className="text-red-600 font-bold">Positivo (+)</SelectItem>
                                    <SelectItem value="pain">Apenas Dor</SelectItem>
                                    <SelectItem value="weakness">Fraqueza</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
