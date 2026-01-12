import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Ruler, Activity, Footprints } from 'lucide-react'
import { cn } from "@/lib/utils"

interface AnkleFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function AnkleForm({ data, updateField, readOnly }: AnkleFormProps) {
    const roms = ['Dorsiflexão (Ext)', 'Dorsiflexão (Flet)', 'Plantiflexão', 'Inversão', 'Eversão', 'Extensão Hálux']
    const tests = [
        { id: 'anterior_drawer', label: 'Gaveta Anterior (Talofibular)', group: 'ligament' },
        { id: 'talar_tilt', label: 'Talar Tilt (Calcaneofibular)', group: 'ligament' },
        { id: 'thompson', label: 'Thompson (Aquiles)', group: 'tendon' },
        { id: 'squeeze', label: 'Squeeze Test (Sindesmose)', group: 'syndesmosis' },
        { id: 'windlass', label: 'Windlass Test (Fascite)', group: 'fascia' },
        { id: 'tinel_tarsal', label: 'Tinel (Túnel do Tarso)', group: 'nerve' },
    ]

    return (
        <div className="space-y-8">
            {/* 1. ROM & LUNGE TEST */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-500" /> Mobilidade & Lunge Test
                </h4>

                <div className="mb-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100 grid md:grid-cols-2 gap-4 items-center">
                    <div>
                        <Label className="font-bold text-blue-900 text-xs uppercase mb-1 block">Weight-Bearing Lunge Test (WBLT)</Label>
                        <p className="text-[10px] text-blue-600/80">Distância Parede-Hálux</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 bg-white rounded border border-blue-200 px-2">
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={data.physicalExam?.functional?.lungeDistance || ''}
                                    onChange={(e) => updateField(`physicalExam.functional.lungeDistance`, e.target.value)}
                                    className="h-8 border-0 bg-transparent text-center font-bold text-blue-900 focus-visible:ring-0"
                                />
                                <span className="text-xs font-medium text-blue-400">cm</span>
                            </div>
                        </div>
                        <div className="flex-1 text-right">
                            <div className={cn("text-xs font-bold uppercase py-1 px-2 rounded inline-block",
                                (Number(data.physicalExam?.functional?.lungeDistance) || 0) >= 10 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            )}>
                                {(Number(data.physicalExam?.functional?.lungeDistance) || 0) >= 10 ? 'Normal (>10)' : 'Restrito (<10)'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {roms.map(m => (
                        <div key={m} className="bg-slate-50/50 border border-slate-100 rounded p-2">
                            <Label className="text-[10px] text-slate-400 font-bold mb-1 block uppercase truncate" title={m}>{m}</Label>
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={data.physicalExam?.rom?.[m] || ''}
                                    onChange={(e) => updateField(`physicalExam.rom.${m}`, e.target.value)}
                                    className="h-7 bg-white border-slate-200 text-xs font-mono"
                                />
                                <span className="text-xs text-slate-500">°</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. SPECIFIC TESTS */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" /> Testes Especiais
                </h4>

                <div className="grid md:grid-cols-2 gap-y-2 gap-x-6">
                    {tests.map((test, index) => (
                        <div key={test.id} className={cn("flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors", index % 2 === 0 ? "bg-white" : "bg-white")}>
                            <Label className="cursor-pointer text-xs font-medium text-slate-700 truncate mr-2" htmlFor={test.id} title={test.label}>
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
                                    <SelectItem value="pain">Dor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
