
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

// MOCK DATA (Fallback)
const TEST_INPUT = {
    patientId: "warley_test_001",
    data: {
        patientProfile: { goals: ["Conforto"], experience: "beginner", injuryStatus: "acute" },
        painPoints: { achilles: { left: true }, calcaneus: { left: true } },
        triage_data: { dor_eva: 8, tipo_pisada: "Pronada Severa" },
        diagnostic: { hypothesis: "Fascite Plantar Aguda" },
        fpi: { right: [2, 2, 2, 2, 2, 2], left: [1, 1, 1, 1, 1, 1] },
        eva: 8,
        efep: { items: [{ score: 3 }, { score: 4 }, { score: 2 }] },
        singleLegSquat: { pelvicDrop: { left: 2, right: 2 }, dynamicValgus: { left: 3, right: 3 } },
        strength: { gluteMedRight: 2, gluteMedLeft: 3, gluteMaxRight: 3, gluteMaxLeft: 3 },
        anthropometry: { legLengthLeft: 90, legLengthRight: 90, navicularLeft: 35, navicularRight: 40 },
        flexibility: {
            mobilityRaysLeft: 0, mobilityRaysRight: 0,
            thomasLeft: 0, thomasRight: 0,
            hamstringLeft: 80, hamstringRight: 80,
            jackLeft: 0, jackRight: 0,
            lungeLeft: 25, lungeRight: 35
        },
        rotation: { left: 30, right: 30 },
        prescription: {}
    }
};

export default function ReportViewerPage() {
    const params = useParams();
    const assessmentId = params?.assessmentId as string;

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!assessmentId) return;

        const body: any = {
            blueprintId: "REPORT_PALMILHA_V2"
        };

        // Check if testing dummy or real
        if (assessmentId === 'test-dummy') {
            console.log("Testing with Dummy Data");
            body.patientId = TEST_INPUT.patientId;
            body.data = TEST_INPUT.data;
        } else {
            console.log("Viewing Real Report for:", assessmentId);
            body.assessmentId = assessmentId;
        }

        fetch('/api/test-smart-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(res => res.json())
            .then(data => {
                setReport(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [assessmentId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-medium animate-pulse">Gerando Relatório...</div>;

    if (!report || report.error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Erro ao gerar relatório</h2>
                    <p className="text-slate-600 mb-6">{report?.details || report?.error || "Ocorreu um erro desconhecido."}</p>
                    <button onClick={() => window.close()} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded">
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center print:bg-white print:p-0">
            <div className="mb-6 print:hidden flex gap-4">
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-700 transition">
                    Imprimir / Salvar PDF
                </button>
            </div>

            <div className="bg-white shadow-xl w-[210mm] min-h-[297mm] p-10 relative overflow-hidden print:shadow-none print:w-full">
                {/* WATERMARK */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
                    <span className="text-[100px] font-bold -rotate-45">CONFIDENCIAL</span>
                </div>

                {/* HEADER */}
                <div className="border-b pb-4 mb-8 flex justify-between items-end relative z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">{report.metadata.blueprintUsed}</h2>
                        <p className="text-sm text-slate-500">Paciente: {report.patientInfo?.name || 'Não Identificado'}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Data: {new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                {/* SECTIONS */}
                {report.sections.map((section: any, idx: number) => (
                    <div key={idx} className="mb-8 relative z-10 page-break-inside-avoid">
                        <h3 className="bg-slate-100 text-slate-600 px-3 py-1 text-sm font-bold uppercase mb-4 rounded">
                            {section.title}
                        </h3>
                        <div className="space-y-6">
                            {section.content.map((widget: any) => (
                                <div key={widget.id} className="border rounded p-4 break-inside-avoid">
                                    <h4 className="font-semibold text-slate-700 mb-2 border-b pb-1">{widget.title}</h4>

                                    {/* WIDGET RENDERER */}
                                    {widget.type === 'highlight_box' && (
                                        <div className="flex gap-2">
                                            {Array.isArray(widget.data) ? widget.data.map((h: any, i: number) => (
                                                <span key={i} className={`px-2 py-1 rounded text-white text-xs font-bold ${h.color === 'red' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                                    {h.text}
                                                </span>
                                            )) : <span className="text-gray-400 text-xs">Sem alertas</span>}
                                        </div>
                                    )}

                                    {widget.type === 'text_block' && (
                                        <div className="p-3 bg-green-50 text-green-800 rounded text-sm whitespace-pre-line border border-green-200">
                                            {String(widget.data)}
                                        </div>
                                    )}

                                    {widget.type === 'chart_radar' && (
                                        <div className="h-64 w-full bg-slate-50 border rounded p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={Array.isArray(widget.data) ? widget.data : []}>
                                                    <PolarGrid />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                                                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar
                                                        name="Avaliação"
                                                        dataKey="A"
                                                        stroke="#2563eb"
                                                        fill="#3b82f6"
                                                        fillOpacity={0.5}
                                                        isAnimationActive={false} // [FIX] Disable animation for PDF capture stability
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {widget.type === 'prescription_block' && (
                                        <div className="space-y-2">
                                            {widget.data.justificativa_auto && (
                                                <div className="text-sm italic text-slate-600 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                                                    {widget.data.justificativa_auto}
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-400 mt-2">
                                                Material Sugerido: {widget.data.tipo_material || 'Padrão'}
                                            </div>
                                        </div>
                                    )}

                                    {widget.type === 'evidence_box' && (
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">{widget.data.diagnosis}</div>
                                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{widget.data.evidenceText}</div>
                                            <div className="text-[10px] text-slate-400 text-right">Fonte: {widget.data.source} (Nível {widget.data.level})</div>
                                        </div>
                                    )}

                                    {(widget.type === 'image_block' || widget.type === 'image') && (
                                        <div className="flex justify-center">
                                            {widget.data ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={String(widget.data)}
                                                    alt={widget.title}
                                                    className="max-h-64 object-contain rounded border border-slate-200"
                                                    onError={(e) => {
                                                        // Fallback on error
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}

                                            {/* Placeholder (shown if no data or onError) */}
                                            <div className={`h-48 w-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2 ${widget.data ? 'hidden' : ''}`}>
                                                <div className="text-3xl">📷</div>
                                                <span className="text-xs font-medium uppercase">Sem Imagem</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
