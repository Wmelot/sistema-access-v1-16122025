
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface PhysicalAssessmentReportPrintProps {
    report: any
    onPrint?: () => void
}

export function PhysicalAssessmentReportPrint({ report, onPrint }: PhysicalAssessmentReportPrintProps) {
    if (!report) return null

    const handlePrint = () => {
        if (onPrint) {
            onPrint()
        } else {
            window.print()
        }
    }

    return (
        <div className="w-full h-full bg-white text-black">
            {/* Control Bar (No Print) */}
            <div className="flex justify-between items-start mb-6 no-print p-4 border rounded-md bg-slate-50">
                <div className="flex gap-2">
                    <Badge variant="outline">{report.header?.patient_name || 'Paciente'}</Badge>
                    <Badge variant="secondary">{report.header?.goal || 'Objetivo'}</Badge>
                </div>
                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" /> Imprimir
                </Button>
            </div>

            {/* PRINTABLE CONTENT */}
            <div className="p-8 max-w-[210mm] mx-auto bg-white print:p-0">
                {/* HEADER */}
                <div className="border-b pb-6 mb-6 text-center">
                    <h3 className="text-3xl font-bold text-black">{report.header?.title}</h3>
                    <p className="text-gray-600 text-lg">{report.header?.subtitle}</p>
                </div>

                {/* SECTION 1: SUMMARY */}
                <div className="mb-8">
                    <h4 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-primary">1. Resumo Clínico</h4>

                    <div className="mb-6 p-4 border rounded bg-gray-50 print:bg-gray-50">
                        <h5 className="font-bold text-lg mb-2">Status Geral: {report.semaphor_health?.status}</h5>
                        <p className="mb-2">{report.semaphor_health?.message}</p>
                        <p className="text-sm italic bg-white p-2 rounded border">Foco Clínico: {report.semaphor_health?.clinical_focus}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="border p-4 rounded">
                            <h5 className="font-bold text-green-700 mb-2">Pontos Fortes</h5>
                            <ul className="list-disc list-inside text-sm">
                                {report.patient_text?.key_wins?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                        <div className="border p-4 rounded">
                            <h5 className="font-bold text-orange-700 mb-2">Onde Melhorar</h5>
                            <ul className="list-disc list-inside text-sm">
                                {report.patient_text?.key_improvements?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="italic text-gray-600 border-l-4 border-primary pl-4 py-2">
                        "{report.patient_text?.summary}"
                    </div>
                </div>

                {/* PAGE BREAK (Force CSS) */}
                <div className="break-before-page" style={{ pageBreakBefore: 'always' }}></div>

                {/* SECTION 2: TECHNICAL */}
                <div className="mb-8">
                    <h4 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-primary">2. Análise Técnica & Prescrição</h4>

                    <div className="mb-6">
                        <h5 className="font-bold mb-2">Orientação ao Treinador</h5>
                        <p className="text-sm text-gray-700 mb-4">{report.trainer_text?.guidance}</p>
                        <div className="p-3 bg-gray-100 rounded text-sm mb-4">
                            <strong>Periodização Sugerida:</strong> {report.trainer_text?.periodization_suggestion}
                        </div>
                        <div className="flex gap-2 flex-wrap mb-6">
                            {report.trainer_text?.attention_points?.map((pt: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-bold">{pt}</span>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h5 className="font-bold mb-2">Alertas Biomecânicos</h5>
                        {report.biomechanics?.alerts?.map((alert: any, idx: number) => (
                            <div key={idx} className="mb-2 p-2 border-l-4 border-red-500 bg-red-50">
                                <span className="font-bold text-red-700">{alert.issue} ({alert.severity})</span>
                                <p className="text-xs text-gray-600">{alert.explanation}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6">
                        <h5 className="font-bold mb-2">Guia de Exercícios</h5>
                        <table className="w-full text-sm border">
                            <thead className="bg-gray-100 text-left">
                                <tr>
                                    <th className="p-2 border">Ação</th>
                                    <th className="p-2 border">Exercícios</th>
                                    <th className="p-2 border">Justificativa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.workout_guide?.map((guide: any, idx: number) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-2 border font-bold">{guide.action}</td>
                                        <td className="p-2 border">
                                            <ul className="list-disc list-inside">
                                                {guide.exercises?.map((ex: string, i: number) => <li key={i}>{ex}</li>)}
                                            </ul>
                                        </td>
                                        <td className="p-2 border text-gray-600 italic">{guide.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
