import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileText, ExternalLink, AlertTriangle, CheckCircle, Activity, Ruler, ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"

interface CervicalSpineFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function CervicalSpineForm({ data, updateField, readOnly }: CervicalSpineFormProps) {
    const roms = ['Flexão', 'Extensão', 'Inclinação D', 'Inclinação E', 'Rotação D', 'Rotação E', 'Retração']
    const tests = [
        { id: 'spurling', label: 'Spurling (Radiculopatia)', group: 'radiculo' },
        { id: 'distraction', label: 'Distração (Alívio)', group: 'radiculo' },
        { id: 'ultt', label: 'ULTT (Tensão Neural)', group: 'neural' },
        { id: 'sharp_purser', label: 'Sharp-Purser (Instabilidade)', group: 'instability' },
        { id: 'alar_ligament', label: 'Ligamento Alar', group: 'instability' },
        { id: 'ccft', label: 'Flexão Craniocervical (CCFT)', group: 'control' },
    ]

    // Simulação de dados vindos do módulo de questionários
    const patientOutcomeData = {
        startBack: { status: 'completed', score: 'Médio Risco', date: '02/01/2026' },
        ndi: { status: 'completed', score: '15% (Leve)', date: '20/12/2025' }
    };

    return (
        <div className="space-y-8">
            {/* --- WIDGET DE INTEGRAÇÃO PROMS --- */}
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        Indicadores & Questionários (PROMs)
                    </h3>
                    <button className="text-indigo-600 text-[10px] font-bold uppercase hover:underline flex items-center transition-colors">
                        Módulo de Follow-up <ExternalLink size={10} className="ml-1" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: STarT Back */}
                    <div className="border rounded bg-white p-3 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Triagem</span>
                            <span className="text-indigo-900 font-bold text-sm">STarT Back</span>
                        </div>
                        <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <AlertTriangle className="w-3 h-3 mr-1" /> {patientOutcomeData.startBack.score}
                            </span>
                        </div>
                    </div>

                    {/* Card 2: NDI Cervical */}
                    <div className="border rounded bg-white p-3 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Incapacidade</span>
                            <div className="text-indigo-900 font-bold text-sm">NDI Cervical</div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800 border border-green-200">
                                <Activity className="w-3 h-3 mr-1" /> {patientOutcomeData.ndi.score}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">{patientOutcomeData.ndi.date}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROM */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-500" /> Mecânica Cervical
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {roms.map(movement => (
                        <div key={movement} className="space-y-1 bg-slate-50/50 p-2 rounded border border-slate-100">
                            <Label className="text-[10px] text-slate-400 font-bold uppercase">{movement}</Label>
                            <Select
                                value={data.physicalExam?.rom?.[movement] || ''}
                                onValueChange={(v) => updateField(`physicalExam.rom.${movement}`, v)}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="h-7 text-xs bg-white"><SelectValue placeholder="-" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Livre</SelectItem>
                                    <SelectItem value="limited">Limitado</SelectItem>
                                    <SelectItem value="pain">Dor Final ADM</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>

            {/* SPECIAL TESTS */}
            <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" /> Testes Especiais & Segurança
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
                                <SelectContent>
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
