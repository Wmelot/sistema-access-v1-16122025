
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

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
        <div className="space-y-6">
            {/* 1. ROM */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Amplitude de Movimento (ROM)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {roms.map(m => (
                            <div key={m}>
                                <Label className="text-xs text-muted-foreground mb-1 block">{m}</Label>
                                <div className="flex bg-slate-50 rounded border p-1">
                                    <Input
                                        type="number"
                                        placeholder="Graus"
                                        value={data.physicalExam?.rom?.[m] || ''}
                                        onChange={(e) => updateField(`physicalExam.rom.${m}`, e.target.value)}
                                        className="h-8 bg-transparent border-0 focus-visible:ring-0 px-2"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <Label>Ritmo Escápulo-Umeral</Label>
                        <Select
                            value={data.physicalExam?.observation?.scapularRhythm || ''}
                            onValueChange={(v) => updateField(`physicalExam.observation.scapularRhythm`, v)}
                        >
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal (2:1)</SelectItem>
                                <SelectItem value="dyskinesis_1">Discinese Leve (Saliência ângulo inf.)</SelectItem>
                                <SelectItem value="dyskinesis_2">Discinese Moderada (Borda medial)</SelectItem>
                                <SelectItem value="dyskinesis_3">Discinese Grave (Borda superior/total)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 2. SPECIFIC TESTS */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Testes Especiais (Manguito & Labrum)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                        {tests.map(test => (
                            <div key={test.id} className="flex items-center justify-between border-b pb-1 last:border-0 p-1 hover:bg-slate-50">
                                <Label className="cursor-pointer text-sm font-medium text-slate-700" htmlFor={test.id}>
                                    {test.label}
                                </Label>
                                <Select
                                    value={data.physicalExam?.specialTests?.[test.id] || ''}
                                    onValueChange={(v) => updateField(`physicalExam.specialTests.${test.id}`, v)}
                                    disabled={readOnly}
                                >
                                    <SelectTrigger className="w-[110px] h-8 bg-white"><SelectValue placeholder="Result." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="negative" className="text-green-600">Negativo</SelectItem>
                                        <SelectItem value="positive" className="text-red-600 font-bold">Positivo (+)</SelectItem>
                                        <SelectItem value="pain">Apenas Dor</SelectItem>
                                        <SelectItem value="weakness">Fraqueza</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
