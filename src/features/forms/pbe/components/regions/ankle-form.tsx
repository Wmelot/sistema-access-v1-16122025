
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface AnkleFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function AnkleForm({ data, updateField, readOnly }: AnkleFormProps) {
    const roms = ['Dorsiflexão (Joelhos estendidos)', 'Dorsiflexão (Joelhos fletidos)', 'Plantiflexão', 'Inversão', 'Eversão', 'Extensão Hálux']
    const tests = [
        { id: 'anterior_drawer', label: 'Gaveta Anterior (Talofibular Ant)', group: 'ligament' },
        { id: 'talar_tilt', label: 'Talar Tilt (Calcaneofibular)', group: 'ligament' },
        { id: 'thompson', label: 'Thompson (Aquiles)', group: 'tendon' },
        { id: 'squeeze', label: 'Squeeze Test (Sindesmose)', group: 'syndesmosis' },
        { id: 'windlass', label: 'Windlass Test (Fascite)', group: 'fascia' },
        { id: 'tinel_tarsal', label: 'Tinel (Túnel do Tarso)', group: 'nerve' },
    ]

    return (
        <div className="space-y-6">
            {/* 1. ROM & LUNGE TEST */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Mobilidade & Dorsiflexão</CardTitle></CardHeader>
                <CardContent>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <Label className="font-bold text-blue-900 mb-2 block">Weight-Bearing Lunge Test (WBLT)</Label>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <Label className="text-xs">Distância Parede-Hálux (cm)</Label>
                                <Input
                                    type="number"
                                    placeholder="cm"
                                    value={data.physicalExam?.functional?.lungeDistance || ''}
                                    onChange={(e) => updateField(`physicalExam.functional.lungeDistance`, e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="flex-1">
                                <Label className="text-xs">Classificação</Label>
                                <div className="text-sm font-bold text-slate-600 mt-2">
                                    {(Number(data.physicalExam?.functional?.lungeDistance) || 0) >= 10 ? 'Normal (>10cm)' : 'Restrito (<10cm)'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {roms.map(m => (
                            <div key={m}>
                                <Label className="text-xs text-muted-foreground mb-1 block truncate" title={m}>{m}</Label>
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
                </CardContent>
            </Card>

            {/* 2. SPECIFIC TESTS */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Testes Especiais</CardTitle></CardHeader>
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
                                        <SelectItem value="pain">Dor</SelectItem>
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
