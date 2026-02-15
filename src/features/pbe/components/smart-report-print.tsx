
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Printer, AlertTriangle, Brain, Activity, CheckCircle, Info } from 'lucide-react'

interface SmartReportPrintProps {
    report: any
    onPrint?: () => void
}

export function SmartReportPrint({ report, onPrint }: SmartReportPrintProps) {
    if (!report) return null

    const handlePrint = () => {
        if (onPrint) {
            onPrint()
        } else {
            window.print()
        }
    }

    const reasoning = report.clinical_reasoning
    const suggestions = report.pbe_suggestions
    const summary = report.summary

    return (
        <div className="w-full h-full bg-white text-black font-sans">
            {/* Control Bar (No Print) */}
            <div className="flex justify-between items-start mb-6 no-print p-4 border rounded-md bg-slate-50">
                <div className="flex gap-2 items-center">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-lg">Relatório Clínico Inteligente (PBE)</span>
                </div>
                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" /> Imprimir
                </Button>
            </div>

            {/* PRINTABLE CONTENT */}
            <div className="p-8 max-w-[210mm] mx-auto bg-white print:p-0">
                {/* HEADER */}
                <div className="border-b pb-6 mb-6 text-center">
                    <h3 className="text-2xl font-bold text-black uppercase tracking-wide">Relatório de Raciocínio Clínico</h3>
                    <p className="text-gray-500 text-sm">Prática Baseada em Evidências</p>
                </div>

                {/* 1. SUMMARY */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Resumo do Caso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block font-semibold text-gray-900">Perfil:</span>
                            <span className="text-gray-600">{summary?.patient_profile || '-'}</span>
                        </div>
                        <div>
                            <span className="block font-semibold text-gray-900">Queixa Principal:</span>
                            <span className="text-gray-600">{summary?.main_complaint || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 2. CLINICAL REASONING */}
                <div className="mb-8">
                    <h4 className="text-xl font-bold mb-4 border-b border-purple-200 pb-2 text-purple-800 flex items-center gap-2">
                        <Brain className="w-5 h-5" /> Raciocínio Clínico
                    </h4>

                    {/* Hipóteses */}
                    <div className="mb-6">
                        <h5 className="font-bold mb-3 text-gray-800">Hipóteses Diagnósticas</h5>
                        <ul className="space-y-2">
                            {reasoning?.hypothesis?.map((h: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 bg-purple-50 p-2 rounded">
                                    <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-purple-600" />
                                    <span>{h}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Red Flags - ALERTA */}
                    {reasoning?.red_flags?.detected && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
                            <h5 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5" /> Bandeiras Vermelhas Identificadas
                            </h5>
                            <ul className="list-disc list-inside text-red-800 text-sm">
                                {reasoning.red_flags.warnings?.map((w: string, i: number) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Mecanismo */}
                    <div className="mb-6">
                        <h5 className="font-bold mb-1 text-gray-800">Mecanismo de Lesão Provável</h5>
                        <p className="text-gray-700 italic">{reasoning?.mechanism}</p>
                    </div>
                </div>

                {/* 3. CONDUTA & TRATAMENTO */}
                <div className="mb-8">
                    <h4 className="text-xl font-bold mb-4 border-b border-green-200 pb-2 text-green-800 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Plano Terapêutico Sugerido
                    </h4>

                    {/* Educação */}
                    <div className="mb-6">
                        <h5 className="font-bold mb-2 text-gray-800 text-sm uppercase tracking-wider">Educação em Saúde</h5>
                        <p className="p-3 bg-blue-50 text-blue-900 rounded border border-blue-100 text-sm leading-relaxed">
                            {suggestions?.education}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Terapia Manual */}
                        <div>
                            <h5 className="font-bold mb-3 text-gray-800 border-b pb-1">Terapia Manual</h5>
                            <ul className="space-y-2 text-sm">
                                {suggestions?.manual_therapy?.map((item: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-700">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Exercícios */}
                        <div>
                            <h5 className="font-bold mb-3 text-gray-800 border-b pb-1">Exercícios Terapêuticos</h5>
                            <ul className="space-y-3 text-sm">
                                {suggestions?.exercises?.map((ex: any, i: number) => (
                                    <li key={i} className="bg-gray-50 p-2 rounded border border-gray-100">
                                        <div className="font-bold text-gray-900">{ex.name}</div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>{ex.dose}</span>
                                            <span className="italic">{ex.purpose}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 4. ORTÓTICA / PALMILHAS */}
                {suggestions?.orthotics?.indicated && (
                    <div className="mt-8 border-t-2 border-gray-100 pt-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" /> Prescrição de Órteses / Palmilhas
                        </h4>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="mb-2 font-semibold text-blue-900">{suggestions.orthotics.specification}</p>
                            <p className="text-sm text-blue-800">{suggestions.orthotics.reason}</p>
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <div className="mt-12 text-center text-xs text-gray-400 pt-8 border-t">
                    <p>Relatório gerado por Inteligência Artificial (Access Physio System)</p>
                    <p>Este documento é um auxílio à decisão clínica e não substitui o julgamento profissional.</p>
                </div>
            </div>
        </div>
    )
}
