import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Ruler, Activity } from 'lucide-react'
import { cn } from "@/lib/utils"

interface HipFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function HipForm({ data, updateField, readOnly }: HipFormProps) {
    const roms = ['Flexão', 'Extensão', 'Abdução', 'Adução', 'Rot. Interna', 'Rot. Externa']
    const tests = [
        { id: 'fadir', label: 'FADIR (Impacto)', group: 'fai' },
        { id: 'faber', label: 'FABER (Patrick)', group: 'joint' },
        { id: 'thomas', label: 'Teste Thomas (Iliopsoas)', group: 'muscle' },
        { id: 'ober', label: 'Teste Ober (TFL)', group: 'muscle' },
        { id: 'trendelenburg', label: 'Trendelenburg (Glúteo Médio)', group: 'control' },
        { id: 'scour', label: 'Scour Test (Labrum)', group: 'joint' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-500" /> Mecânica do Quadril (ROM)
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {roms.map(movement => (
                        <div key={movement} className="space-y-1 bg-slate-50/50 p-2 rounded border border-slate-100">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">{movement}</Label>
                            <Select
                                value={data.physicalExam?.rom?.[movement] || ''}
                                onValueChange={(v) => updateField(`physicalExam.rom.${movement}`, v)}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="-" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Livre</SelectItem>
                                    <SelectItem value="limited_mild">Limitação Leve</SelectItem>
                                    <SelectItem value="limited_mod">Limitação Moderada</SelectItem>
                                    <SelectItem value="blocked">Bloqueado/Dor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" /> Testes Especiais
                </h4>

                <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
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
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
