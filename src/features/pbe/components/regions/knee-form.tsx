
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

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
        <div className="space-y-6">
            {/* 1. ROM & OBSERVAÇÃO */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Inspeção & Amplitude (ROM)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div className="space-y-3">
                            <Label>Alinhamento Estático</Label>
                            <Select
                                value={data.physicalExam?.observation?.alignment || ''}
                                onValueChange={(v) => updateField(`physicalExam.observation.alignment`, v)}
                            >
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="neutral">Neutro</SelectItem>
                                    <SelectItem value="valgus">Valgo (Joelhos para dentro)</SelectItem>
                                    <SelectItem value="varus">Varo (Joelhos para fora)</SelectItem>
                                    <SelectItem value="recurvatum">Recurvatum (Hiperextensão)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label>Edema / Derrame</Label>
                            <Select
                                value={data.physicalExam?.observation?.edema || ''}
                                onValueChange={(v) => updateField(`physicalExam.observation.edema`, v)}
                            >
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ausente</SelectItem>
                                    <SelectItem value="mild">Leve (Sinal da Tecla -)</SelectItem>
                                    <SelectItem value="moderate">Moderado (Sinal da Tecla +)</SelectItem>
                                    <SelectItem value="severe">Grave (Tensão visível)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                        {roms.map(m => (
                            <div key={m}>
                                <Label className="text-xs text-muted-foreground mb-1 block">{m} (Ativa)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Graus"
                                        value={data.physicalExam?.rom?.[m] || ''}
                                        onChange={(e) => updateField(`physicalExam.rom.${m}`, e.target.value)}
                                        className="h-9"
                                    />
                                    <span className="text-sm">°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 2. TESTES ESPECIAIS */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Testes Especiais (Ligamentar & Meniscal)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-3">
                        {tests.map(test => (
                            <div key={test.id} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-slate-50 p-1 rounded">
                                <Label className="cursor-pointer text-sm" htmlFor={test.id}>
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
                                        <SelectItem value="laxity_1">Frouxidão G1</SelectItem>
                                        <SelectItem value="laxity_2">Frouxidão G2</SelectItem>
                                        <SelectItem value="laxity_3">Frouxidão G3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 3. FUNCIONAL */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Avaliação Funcional do Joelho</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Step Down Test (Descida Degrau)</Label>
                            <Select
                                value={data.physicalExam?.functional?.stepDown || ''}
                                onValueChange={(v) => updateField(`physicalExam.functional.stepDown`, v)}
                            >
                                <SelectTrigger><SelectValue placeholder="Qualidade..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="good">Bom Alinhamento</SelectItem>
                                    <SelectItem value="medial_collapse">Colapso Medial (Valgo Dinâmico)</SelectItem>
                                    <SelectItem value="shaky">Tremor/Instabilidade</SelectItem>
                                    <SelectItem value="pain">Dor à execução</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Salto Unipodal (Single Leg Hop)</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Distância (cm)"
                                    value={data.physicalExam?.functional?.hopDistance || ''}
                                    onChange={(e) => updateField(`physicalExam.functional.hopDistance`, e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Comparar com o lado contralateral (LSI &gt; 90% ideal)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
