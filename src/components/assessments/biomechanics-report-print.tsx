
import React from 'react'
import { AssessmentRadar } from './assessment-radar'
import { calculateRadarData, calculateMinimalismIndex, calculateSmartRecommendation, getFpiClass } from './biomechanics-calculations'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Footprints, Activity, Ruler, Scaling, User, AlertCircle } from 'lucide-react'

interface BiomechanicsReportPrintProps {
    data: any
    patient?: any
    professionalName?: string
    date?: string
}

export function BiomechanicsReportPrint({ data, patient, professionalName, date }: BiomechanicsReportPrintProps) {
    if (!data) return null

    // Calculations
    const radarData = calculateRadarData(data)
    const minimalismIndex = calculateMinimalismIndex(data.currentShoe || { specs: { weight: 0, drop: 0, stack: 0 }, minScoreData: { flexLong: 0, flexTor: 0, stability: 0 } })
    const smartRec = calculateSmartRecommendation(data.patientProfile, data.painPoints)
    const fpiRight = getFpiClass(data.fpi?.right || [0, 0, 0, 0, 0, 0])
    const fpiLeft = getFpiClass(data.fpi?.left || [0, 0, 0, 0, 0, 0])

    // Format helpers
    const fmt = (n: any) => typeof n === 'number' ? n.toFixed(1) : '-'

    return (
        <div className="w-full bg-white text-slate-900 p-8 max-w-[210mm] mx-auto min-h-screen">
            {/* Header */}
            <div className="border-b pb-6 mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Avaliação Biomecânica</h1>
                    <p className="text-slate-500 text-lg">Análise de Marcha e Prescrição de Palmilhas</p>
                </div>
                <div className="text-right text-sm text-slate-600">
                    <p className="font-bold text-slate-900">{patient?.name || 'Paciente'}</p>
                    <p>{date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                    <p className="text-xs mt-1">{professionalName || 'Fisioterapeuta'}</p>
                </div>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left: Radar Chart */}
                <div className="border rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-sm font-bold uppercase text-slate-500 mb-2 w-full text-left">Perfil Biomecânico</h3>
                    <div className="w-full h-[300px]">
                        <AssessmentRadar data={radarData} />
                    </div>
                </div>

                {/* Right: Key Findings */}
                <div className="space-y-6">
                    <div className="border rounded-xl p-4">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                            <Footprints className="h-4 w-4" /> Tipo de Pisada (FPI-6)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Esquerda</span>
                                <Badge variant="outline" className={`mt-1 font-bold ${fpiLeft.color}`}>{fpiLeft.label}</Badge>
                                <span className="text-xs ml-2 text-slate-400">Score: {fpiLeft.score}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Direita</span>
                                <Badge variant="outline" className={`mt-1 font-bold ${fpiRight.color}`}>{fpiRight.label}</Badge>
                                <span className="text-xs ml-2 text-slate-400">Score: {fpiRight.score}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Queixa Principal
                        </h3>
                        <p className="text-sm">{data.qp || 'Não relatada.'}</p>
                        {data.painDuration && <p className="text-xs text-slate-500 mt-2">Duração: {data.painDuration}</p>}
                    </div>

                    <div className="border rounded-xl p-4">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                            <Ruler className="h-4 w-4" /> Antropometria
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex justify-between border-b border-dashed pb-1">
                                <span>Navicular (Dir)</span>
                                <b>{data.anthropometry?.navicularRight}mm</b>
                            </div>
                            <div className="flex justify-between border-b border-dashed pb-1">
                                <span>Navicular (Esq)</span>
                                <b>{data.anthropometry?.navicularLeft}mm</b>
                            </div>
                            <div className="flex justify-between border-b border-dashed pb-1">
                                <span>Arco (Dir)</span>
                                <b>{data.anthropometry?.archTypeRight}</b>
                            </div>
                            <div className="flex justify-between border-b border-dashed pb-1">
                                <span>Arco (Esq)</span>
                                <b>{data.anthropometry?.archTypeLeft}</b>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Break for Print safety (optional, but good for structured reports) */}

            {/* Detailed Tables */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2">
                    <Scaling className="h-5 w-5" /> Dados Funcionais Detalhados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Y-Balance */}
                    <div>
                        <h4 className="font-semibold text-sm mb-2 text-slate-700">Y-Balance Test</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="py-1 h-8">Direção</TableHead>
                                    <TableHead className="py-1 h-8">Esq (cm)</TableHead>
                                    <TableHead className="py-1 h-8">Dir (cm)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="py-1">Anterior</TableCell>
                                    <TableCell className="py-1">{fmt(data.yBalance?.anterior?.l)}</TableCell>
                                    <TableCell className="py-1">{fmt(data.yBalance?.anterior?.r)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="py-1">Post-Med</TableCell>
                                    <TableCell className="py-1">{fmt(data.yBalance?.posteromedial?.l)}</TableCell>
                                    <TableCell className="py-1">{fmt(data.yBalance?.posteromedial?.r)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="py-1">Post-Lat</TableCell>
                                    <TableCell className="py-1">{fmt(data.yBalance?.posterolateral?.l)}</TableCell>
                                    <TableCell className="py-1">{fmt(data.yBalance?.posterolateral?.r)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Flexibility */}
                    <div>
                        <h4 className="font-semibold text-sm mb-2 text-slate-700">Flexibilidade & ADM</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="py-1 h-8">Teste</TableHead>
                                    <TableHead className="py-1 h-8">Esq (Graus)</TableHead>
                                    <TableHead className="py-1 h-8">Dir (Graus)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="py-1">Lunge (Dorsiflex)</TableCell>
                                    <TableCell className="py-1">{fmt(data.flexibility?.lungeLeft)}</TableCell>
                                    <TableCell className="py-1">{fmt(data.flexibility?.lungeRight)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="py-1">Thomas (Quadril)</TableCell>
                                    <TableCell className="py-1">{fmt(data.flexibility?.thomasLeft)}</TableCell>
                                    <TableCell className="py-1">{fmt(data.flexibility?.thomasRight)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="py-1">Jack Test</TableCell>
                                    <TableCell className="py-1">{data.flexibility?.jackLeft === 1 ? 'Normal' : 'Rígido'}</TableCell>
                                    <TableCell className="py-1">{data.flexibility?.jackRight === 1 ? 'Normal' : 'Rígido'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Recommendations Section */}
            <div className="bg-slate-50 border rounded-xl p-6 mb-8 break-inside-avoid">
                <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
                    <User className="h-5 w-5" /> Recomendação de Calçados
                </h3>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <div className="mb-4">
                            <span className="text-sm font-semibold text-slate-500 uppercase">Calçado Atual</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-bold text-lg">{data.currentShoe?.model || 'Não informado'}</span>
                                <Badge variant={minimalismIndex > 70 ? 'default' : minimalismIndex > 30 ? 'secondary' : 'outline'}>
                                    IM: {minimalismIndex}%
                                </Badge>
                            </div>
                            <div className="text-xs text-slate-500 grid grid-cols-2 gap-2 mt-2 max-w-xs">
                                <span>Drop: {data.currentShoe?.specs?.drop}mm</span>
                                <span>Peso: {data.currentShoe?.specs?.weight}g</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded border border-blue-100">
                            <span className="text-sm font-semibold text-blue-600 block mb-2">Sugestão Clínica</span>
                            <p className="text-slate-800 text-sm italic">
                                "{smartRec.description}"
                            </p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {smartRec.traits.map(t => (
                                    <Badge key={t} variant="secondary" className="bg-blue-100 text-blue-800 border-none">{t}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-[1px] bg-slate-200 hidden md:block"></div>

                    <div className="flex-1">
                        <span className="text-sm font-semibold text-slate-500 uppercase block mb-2">Orientações Finais</span>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {data.orientations || 'Nenhuma orientação adicional registrada.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 mt-12 pt-4 border-t">
                Gerado por AccessFisio Sistema Integrado - {new Date().getFullYear()}
            </div>
        </div>
    )
}
