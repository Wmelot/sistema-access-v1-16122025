import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, ExternalLink, Clock, Send, AlertTriangle, CheckCircle, Activity, ChevronRight } from 'lucide-react'
import { Input } from "@/components/ui/input"

interface CervicalSpineFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function CervicalSpineForm({ data, updateField, readOnly }: CervicalSpineFormProps) {
    const roms = ['Flexão', 'Extensão', 'Inclinação D', 'Inclinação E', 'Rotação D', 'Rotação E', 'Retração']
    const tests = [
        { id: 'spurling', label: 'Spurling (Radiculopatia)', group: 'radiculo' },
        { id: 'distraction', label: 'Teste de Distração (Alívio)', group: 'radiculo' },
        { id: 'ultt', label: 'ULTT (Tensão Neural Membro Sup.)', group: 'neural' },
        { id: 'sharp_purser', label: 'Sharp-Purser (Instabilidade Atlas)', group: 'instability' },
        { id: 'alar_ligament', label: 'Teste Ligamento Alar', group: 'instability' },
        { id: 'ccft', label: 'Flexão Craniocervical (CCFT)', group: 'control' },
    ]

    // Simulação de dados vindos do módulo de questionários
    const patientOutcomeData = {
        startBack: { status: 'completed', score: 'Médio Risco', date: '02/01/2026' }, // Mantendo visual do user
        ndi: { status: 'completed', score: '15% (Leve)', date: '20/12/2025' }
    };

    return (
        <div className="space-y-6">
            {/* --- WIDGET DE INTEGRAÇÃO PROMS --- */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <FileText className="mr-2 text-indigo-500 h-5 w-5" />
                        Indicadores e Questionários
                    </h3>
                    <button className="text-indigo-600 text-sm font-semibold flex items-center hover:underline">
                        Ir para Módulo de Follow-up <ExternalLink size={14} className="ml-1" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: STarT Back (Visual conforme solicitado) */}
                    <div className="border rounded-lg p-4 bg-gray-50 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Triagem Psicossocial</span>
                            <div className="text-indigo-900 font-bold text-lg mt-1">STarT Back</div>
                        </div>
                        <div className="mt-3">
                            <div className="flex flex-col gap-1">
                                <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> {patientOutcomeData.startBack.score}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: NDI Cervical */}
                    <div className="border rounded-lg p-4 bg-gray-50 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Incapacidade Funcional</span>
                            <div className="text-indigo-900 font-bold text-lg">NDI Cervical</div>
                        </div>
                        <div className="mt-3">
                            {patientOutcomeData.ndi.status === 'completed' ? (
                                <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Activity className="w-3 h-3 mr-1" /> {patientOutcomeData.ndi.score}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Em: {patientOutcomeData.ndi.date}
                                    </p>
                                </div>
                            ) : (
                                <button className="w-full flex items-center justify-center px-3 py-1.5 border border-indigo-300 shadow-sm text-xs font-medium rounded text-indigo-700 bg-white hover:bg-indigo-50 transition-colors">
                                    <Send size={12} className="mr-1.5" /> Enviar solicitação
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Mecânica Cervical</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {roms.map(movement => (
                            <div key={movement} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{movement}</Label>
                                <Select
                                    value={data.physicalExam?.rom?.[movement] || ''}
                                    onValueChange={(v) => updateField(`physicalExam.rom.${movement}`, v)}
                                    disabled={readOnly}
                                >
                                    <SelectTrigger className="h-8"><SelectValue placeholder="-" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">Livre</SelectItem>
                                        <SelectItem value="limited">Limitado</SelectItem>
                                        <SelectItem value="pain">Dor Final ADM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Testes Especiais & Segurança</CardTitle></CardHeader>
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
