import React from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Activity, Ruler, Microscope } from 'lucide-react'
import { cn } from "@/lib/utils"

interface KneeFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function KneeForm({ data, updateField, readOnly }: KneeFormProps) {
    const roms = ['Flexão', 'Extensão']
    const tests = [
        { id: 'lachman', label: 'Lachman (LCA)', group: 'ligament' },
        { id: 'anterior_drawer', label: 'Gaveta Anterior (LCA)', group: 'ligament' },
        { id: 'posterior_drawer', label: 'Gaveta Posterior (LCP)', group: 'ligament' },
        { id: 'valgus_stress', label: 'Estresse em Valgo (LCM)', group: 'ligament' },
        { id: 'varus_stress', label: 'Estresse em Varo (LCL)', group: 'ligament' },
        { id: 'mcmurray', label: 'McMurray (Menisco)', group: 'meniscus' },
        { id: 'thessaly', label: 'Thessaly (Menisco)', group: 'meniscus' },
        { id: 'patellar_apprehension', label: 'Apreensão Patelar', group: 'patella' },
        { id: 'clarke', label: 'Sinal de Clarke/Rabot', group: 'patella' },
        { id: 'noble', label: 'Noble (Trato Iliotibial)', group: 'other' },
    ]

    return (
        <div className="space-y-8">
            {/* 1. ROM & OBSERVAÇÃO */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-500" /> Inspeção & Amplitude (ROM)
                </h4>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-bold text-slate-500">Alinhamento Estático</Label>
                        <Select
                            value={data.physicalExam?.observation?.alignment || ''}
                            onValueChange={(v) => updateField(`physicalExam.observation.alignment`, v)}
                        >
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="neutral">Neutro</SelectItem>
                                <SelectItem value="valgus">Valgo (Joelhos para dentro)</SelectItem>
                                <SelectItem value="varus">Varo (Joelhos para fora)</SelectItem>
                                <SelectItem value="recurvatum">Recurvatum (Hiperextensão)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-bold text-slate-500">Edema / Derrame</Label>
                        <Select
                            value={data.physicalExam?.observation?.edema || ''}
                            onValueChange={(v) => updateField(`physicalExam.observation.edema`, v)}
                        >
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ausente</SelectItem>
                                <SelectItem value="mild">Leve (Sinal da Tecla -)</SelectItem>
                                <SelectItem value="moderate">Moderado (Sinal da Tecla +)</SelectItem>
                                <SelectItem value="severe">Grave (Tensão visível)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {roms.map(m => (
                        <div key={m}>
                            <Label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">{m} (Ativa)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Graus"
                                    value={data.physicalExam?.rom?.[m] || ''}
                                    onChange={(e) => updateField(`physicalExam.rom.${m}`, e.target.value)}
                                    className="h-9 font-mono"
                                />
                                <span className="text-sm text-slate-500 font-medium">°</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. TESTES ESPECIAIS */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-purple-500" /> Testes Especiais
                </h4>

                <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                    {tests.map((test, index) => (
                        <div key={test.id} className={cn("flex items-center justify-between py-2 px-2 rounded hover:bg-slate-50", index % 2 === 0 ? "bg-white" : "bg-white")}>
                            <Label className="cursor-pointer text-xs font-medium text-slate-700" htmlFor={test.id}>
                                {test.label}
                            </Label>
                            <Select
                                value={data.physicalExam?.specialTests?.[test.id] || ''}
                                onValueChange={(v) => updateField(`physicalExam.specialTests.${test.id}`, v)}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="w-[120px] h-7 text-[10px] bg-white"><SelectValue placeholder="Result." /></SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="negative" className="text-green-600">Negativo</SelectItem>
                                    <SelectItem value="positive" className="text-red-600 font-bold">Positivo (+)</SelectItem>
                                    <SelectItem value="laxity_1">Frouxidão G1</SelectItem>
                                    <SelectItem value="laxity_2">Frouxidão G2</SelectItem>
                                    <SelectItem value="laxity_3">Frouxidão G3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. FUNCIONAL */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" /> Avaliação Funcional
                </h4>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 bg-orange-50/50 p-3 rounded border border-orange-100/50">
                        <Label className="text-xs font-bold text-orange-800">Step Down Test</Label>
                        <Select
                            value={data.physicalExam?.functional?.stepDown || ''}
                            onValueChange={(v) => updateField(`physicalExam.functional.stepDown`, v)}
                        >
                            <SelectTrigger className="bg-white border-orange-200 text-xs"><SelectValue placeholder="Qualidade do movimento..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="good">Bom Alinhamento</SelectItem>
                                <SelectItem value="medial_collapse">Colapso Medial (Valgo)</SelectItem>
                                <SelectItem value="shaky">Tremor/Instabilidade</SelectItem>
                                <SelectItem value="pain">Dor à execução</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-100">
                        <Label className="text-xs font-bold text-slate-700">Salto Unipodal (Single Leg Hop)</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="0"
                                className="h-9 w-full"
                                type="number"
                                value={data.physicalExam?.functional?.hopDistance || ''}
                                onChange={(e) => updateField(`physicalExam.functional.hopDistance`, e.target.value)}
                            />
                            <span className="text-xs text-slate-500">cm</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Objetivo: LSI &gt; 90% (Comparar lados)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
