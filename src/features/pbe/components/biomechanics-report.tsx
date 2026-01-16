import React, { useMemo, useState } from "react";
// Forced Update: 2026-01-14T00:55:00
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Footprints, CheckCircle2, Info, Activity, AlertTriangle, ArrowRight, RulerDimensionLine, ShellIcon, TriangleRight, WeightTilde } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    LineChart, Line, CartesianGrid, ResponsiveContainer, XAxis, YAxis, ReferenceLine,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { calculateRadarData } from "@/utils/clinical-references";
import Image from "next/image";
import { COLOR_LEFT_FOOT, COLOR_RIGHT_FOOT, COLOR_REF_LINE } from "@/utils/report-constants";

// --- HELPERS ---
const SectionHeader = ({ title, icon: Icon, color = "blue" }: any) => (
    <div className={cn("flex items-center gap-3 border-b-2 pb-2 mb-4 print:mb-2", `border-${color}-200`)}>
        <div className={cn("p-1.5 rounded-lg text-white", `bg-${color}-600`)}>
            <Icon className="w-4 h-4" />
        </div>
        <h3 className={cn("font-black uppercase text-sm tracking-widest", `text-${color}-900`)}>{title}</h3>
    </div>
);

// Editable Insight Component
const InsightBox = ({ text }: { text: string }) => {
    return (
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex gap-3 items-start mt-2 print:mt-1 print:p-2">
            <div className="bg-purple-100 text-purple-600 p-1 rounded mt-0.5 shrink-0 print:bg-purple-50 print:text-purple-800">
                <Activity className="w-3 h-3" />
            </div>
            <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-purple-600 block mb-0.5">Insight Clínico</span>
                <div
                    contentEditable
                    suppressContentEditableWarning
                    className="text-xs text-slate-700 leading-relaxed italic outline-none focus:ring-1 focus:ring-purple-200 rounded px-1 -ml-1 min-h-[1.5em] empty:before:content-[attr(placeholder)] empty:before:text-slate-400"
                >
                    {text}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTES VISUAIS ---
const GaugeCard = ({ label, value, max = 100, unit = "", color = "blue", insight }: any) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="bg-white border rounded-2xl p-4 shadow-sm relative overflow-hidden print:border-slate-200 break-inside-avoid">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</h4>
            <div className="relative h-24 flex items-center justify-center">
                <div className="relative w-32 h-16 overflow-hidden">
                    <div className={cn("absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-slate-100 box-border")}></div>
                    <div className={cn("absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-transparent border-t-current box-border transition-all duration-1000", `text-${color}-500`)}
                        style={{ transform: `rotate(${(pct / 100) * 180 - 135}deg)` }}
                    ></div>
                    <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-0">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12"
                            strokeDasharray={`${(pct / 100) * 126} 126`} className={cn(`text-${color}-500 transition-all duration-1000`)} />
                    </svg>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl font-black text-slate-800">{value}</div>
                </div>
                <span className="absolute bottom-1 text-[10px] uppercase font-bold text-slate-400">{unit}</span>
            </div>
            {insight && <InsightBox text={insight} />}
        </div>
    );
};

// --- REPORT COMPONENT ---
interface BiomechanicsReportProps {
    open: boolean;
    onClose: () => void;
    form: any;
    shoeRec: any;
    minIndex: number;
    organizationName?: string;
    professional?: any; // Add professional prop
    patient?: any;
    organization?: any; // Add organization prop (for address)
}

export function BiomechanicsReport({ open, onClose, form, shoeRec, minIndex, organizationName, professional, patient, organization }: BiomechanicsReportProps) {
    if (!open) return null;

    // DATA WATCH
    const vals = form.getValues();
    const t = vals.tests || {};
    const p = vals.postural || {};
    const hma = vals.hma || {};

    // 1. Radar Data
    const radarChartData = useMemo(() => calculateRadarData(vals), [vals]);

    // 2. Dysmetry
    const legL = Number(t?.ybalance?.legLength?.left || 0);
    const legR = Number(t?.ybalance?.legLength?.right || 0);
    const dysmetry = Math.abs(legL - legR);
    const hasDysmetry = dysmetry >= 5;

    // 3. Table Data
    const testsTable = [
        { name: "Teste de Thomas (Psoas)", l: t?.thomas?.left, r: t?.thomas?.right, ref: "-10º a 0º (Feber et.al, 2010)" },
        { name: "PKET (Isquiosurais)", l: t?.slr?.left, r: t?.slr?.right, ref: " > 132º (Reurink et.al, 2013)" },
        { name: "Rigidez de Rot. Laterais do Quadil", l: t?.ventral?.rotation?.left, r: t?.ventral?.rotation?.right, ref: "> 40º(Carvalhais et.al, 2011)" },
        { name: "APA (Ângulo Perna-Antepé)", l: t?.ventral?.measures?.left?.apa, r: t?.ventral?.measures?.right?.apa, ref: "10º a 18º (Mendonça et.al, 2013)" },
        { name: "Teste de Jack (Hálux)", l: t?.jack?.left, r: t?.jack?.right, ref: "Grau 1 (Molinete Completo)" },
        { name: "Lunge Test (Tríceps Sural)", l: t?.lunge?.left, r: t?.lunge?.right, ref: "> 42º(Bennel et.al, 1998)" },
        { name: "FPI-6 (Postura Pé)", l: p?.fpi_left_total, r: p?.fpi_right_total, ref: "-5 a +5 (Neutro)" },
    ].filter(x => x.l !== undefined || x.r !== undefined);

    // 4. Dynamic Data
    const dfiData = [
        { name: 'RC', e: t?.dfi?.[0]?.left || 0, d: t?.dfi?.[0]?.right || 0 },
        { name: 'AM', e: t?.dfi?.[1]?.left || 0, d: t?.dfi?.[1]?.right || 0 },
        { name: 'IMP', e: t?.dfi?.[2]?.left || 0, d: t?.dfi?.[2]?.right || 0 }
    ];

    // IA Insights Logic
    const painVal = Number(hma.eva?.[0] || 0);
    const painInsight = painVal > 7 ?
        "A dor elevada impacta a biomecânica protetora. Controle analgésico é prioridade antes de cargas elevadas." :
        "Nível de dor permite intervenções mecânicas diretas e progressão de carga.";

    const funcScore = vals.efep && vals.efep.length > 0 ?
        Math.round(vals.efep.reduce((a: any, b: any) => a + Number(b.score || 0), 0) / vals.efep.length) : 0;
    const funcInsight = funcScore < 5 ?
        "Capacidade funcional reduzida. Foco em restaurar atividades de vida diária básicas." :
        "Boa funcionalidade basal. Objetivo é otimizar performance gestual.";

    const loadMin = vals.sports?.reduce((acc: any, s: any) => acc + (Number(s.freq) * Number(s.duration)), 0) || 0;
    const loadInsight = loadMin > 300 ?
        "Volume de treino alto. Monitorar sinais de Overreaching e priorizar recovery." :
        "Volume moderado/baixo. Janela segura para incremento progressivo de carga.";

    // Helper for color coding
    const getColorClass = (val: string | undefined): string => {
        if (!val) return "text-slate-800";
        const v = val.toLowerCase();
        if (v.includes('normal') || v.includes('ausente')) return "text-emerald-700 bg-emerald-50 rounded px-2 py-0.5";
        if (v.includes('leve') || v.includes('moderado')) return "text-amber-700 bg-amber-50 rounded px-2 py-0.5";
        if (v.includes('acentuado') || v.includes('severo')) return "text-red-700 bg-red-50 rounded px-2 py-0.5";
        return "text-slate-800";
    };

    return (
        <div id="report-wrapper" className="fixed inset-0 z-[999] bg-white flex flex-col animate-in fade-in duration-300 overflow-hidden">
            {/* TOOLBAR */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-slate-900 text-white shrink-0 print:hidden">
                <h2 className="font-bold text-lg flex items-center gap-2"><Activity className="text-blue-400" /> Relatório Biomecânico Gerado</h2>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">Fechar</Button>
                    <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 font-bold"><Send className="w-4 h-4 mr-2" /> Imprimir / PDF</Button>
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div id="report-scroll-area" className="flex-1 overflow-auto bg-slate-100 p-8 print:p-0 print:bg-white custom-scrollbar">
                <div id="report-paper" className="bg-white max-w-[210mm] mx-auto min-h-[297mm] shadow-2xl print:shadow-none print:max-w-none print:w-[210mm] print:h-auto">

                    {/* --- PÁGINA 1: CAPA & RESUMO --- */}
                    <div className="p-12 print:p-6 h-[297mm] flex flex-col relative page-break">
                        {/* Header */}
                        <header className="flex justify-between items-start border-b-4 border-blue-900 pb-6 mb-10 print:mb-6 print:pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center text-white font-black text-3xl print-color-adjust">A</div>
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Relatório Biomecânico</h1>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Advanced Clinical Protocol</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400">Emissão</p>
                                <p className="text-xl font-black text-slate-800">{new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                        </header>

                        {/* Patient Info */}
                        <div className="bg-slate-50 border-l-4 border-blue-600 p-6 mb-10 print:mb-6 rounded-r-xl print:bg-slate-50 print:border-blue-600">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                                <div>
                                    <span className="block text-[10px] uppercase font-black text-slate-400">Paciente</span>
                                    <span className="block text-xl font-bold text-slate-800">{vals.patientName || "Paciente Modelo"}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-black text-slate-400">Idade</span>
                                    <span className="block text-xl font-bold text-slate-800">{vals.patientAge || "--"} anos</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-[10px] uppercase font-black text-slate-400">Queixa Principal</span>
                                    <span className="block text-lg font-medium text-slate-700 italic">"{hma.qp || "Avaliação de Rotina"}"</span>
                                </div>
                            </div>
                        </div>

                        {/* Cards Grid */}
                        <SectionHeader title="Quadro Geral" icon={Activity} />
                        <div className="grid grid-cols-2 gap-6 mb-auto print:gap-4 print:mb-4">
                            <GaugeCard label="Nível de Dor (EVA)" value={painVal} max={10} color="red" unit="/ 10" insight={painInsight} />

                            <GaugeCard label="Nível Funcional (EFEP)" value={funcScore} max={10} color="green" unit="Pts" insight={funcInsight} />

                            <div className="bg-white border rounded-2xl p-4 shadow-sm break-inside-avoid print:border-slate-200">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Carga de Treino Semanal</h4>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-3xl font-black text-orange-600">{loadMin}</span>
                                    <span className="text-xs font-bold text-slate-500">min/sem</span>
                                </div>
                                <Badge className="bg-orange-100 text-orange-700 border-none mb-2 block w-fit">
                                    {loadMin > 600 ? "Alta Performance" : loadMin > 300 ? "Ativo" : "Moderado/Baixo"}
                                </Badge>
                                <InsightBox text={loadInsight} />
                            </div>

                            <div className="bg-white border rounded-2xl p-4 shadow-sm break-inside-avoid print:border-slate-200">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Postura dos pés (FPI-6)</h4>
                                <div className="space-y-4 mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold w-4">E</span>
                                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden relative">
                                            <div className="absolute top-0 bottom-0 w-1 bg-blue-500" style={{ left: `${((Number(p.fpi_left_total || 0) + 12) / 24) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-bold">{p.fpi_left_total || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold w-4">D</span>
                                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden relative">
                                            <div className="absolute top-0 bottom-0 w-1 bg-green-500" style={{ left: `${((Number(p.fpi_right_total || 0) + 12) / 24) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-bold">{p.fpi_right_total || 0}</span>
                                    </div>
                                </div>
                                <InsightBox text={`Índice de Postura do Pé indica ${Math.abs(Number(p.fpi_left_total || 0)) > 5 ? "desvios significativos" : "alinhamento dentro da normalidade"}.`} />
                            </div>
                        </div>

                        {/* Footer Logo */}
                        <div className="mt-8 pt-6 border-t flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                            <span>Relatório Gerado por {organizationName || 'Access Fisioterapia'}</span>
                            <span>Axiom Health System</span>
                        </div>
                    </div>

                    {/* --- PÁGINA 2: ANÁLISE ESTÁTICA --- */}
                    <div className="p-12 print:p-6 h-[297mm] flex flex-col page-break">
                        <SectionHeader title="Análise Estática & Baropodometria" icon={Footprints} />

                        <div className="grid grid-cols-2 gap-4 h-64 mb-8 break-inside-avoid mb-8 print:mb-4 print:h-48">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden">
                                {t.baropo_2d ? (
                                    <Image src={t.baropo_2d} alt="Baropo 2D" fill className="object-contain" />
                                ) : <span className="text-slate-400 text-xs font-bold">Baropo 2D (Vazio)</span>}
                            </div>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden">
                                {t.baropo_3d ? (
                                    <Image src={t.baropo_3d} alt="Baropo 3D" fill className="object-contain" />
                                ) : <span className="text-slate-400 text-xs font-bold">Baropo 3D (Vazio)</span>}
                            </div>
                        </div>

                        {hasDysmetry && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 print:mb-4 flex items-center gap-4 rounded-r-lg print:bg-red-50">
                                <AlertTriangle className="text-red-600 w-6 h-6" />
                                <div>
                                    <h4 className="text-red-800 font-black uppercase text-xs">Alerta de Assimetria Estrutural</h4>
                                    <p className="text-red-700 text-sm font-medium">
                                        Paciente apresenta dismetria: <strong>{legL < legR ? "ESQUERDO" : "DIREITO"}</strong> menor em <strong>{Math.abs(legL - legR)} mm</strong>.
                                    </p>
                                </div>
                            </div>
                        )}

                        <SectionHeader title="Testes Funcionais Comparativos" icon={Activity} color="green" />
                        <div className="overflow-hidden border rounded-xl shadow-sm mb-8 print:mb-4 break-inside-avoid">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px]">
                                    <tr>
                                        <th className="p-3 text-left">Teste</th>
                                        <th className="p-3 text-center">Esquerda</th>
                                        <th className="p-3 text-center">Direita</th>
                                        <th className="p-3 text-right">Valores de Referência</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {testsTable.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-slate-700">{row.name}</td>
                                            <td className="p-3 text-center font-medium bg-slate-50/50">{row.l ?? "-"}</td>
                                            <td className="p-3 text-center font-medium bg-slate-50/50">{row.r ?? "-"}</td>
                                            <td className="p-3 text-right text-slate-400 font-semibold italic text-xs">{row.ref}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- PÁGINA 3: ANÁLISE DINÂMICA --- */}
                    <div className="p-12 print:p-6 h-[297mm] flex flex-col page-break">
                        <SectionHeader title="Análise Dinâmica (Gesto Esportivo)" icon={Activity} color="orange" />

                        <div className="mb-8 print:mb-4 break-inside-avoid">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Cinemática Angular (DFI) vs Gold Standard</h4>
                            <div className="h-64 w-full bg-white border rounded-xl p-4 print:h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dfiData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis domain={[-4, 4]} fontSize={10} axisLine={false} tickLine={false} />
                                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={4} />
                                        <Line type="monotone" dataKey="e" stroke={COLOR_LEFT_FOOT} strokeWidth={3} dot={{ r: 4 }} name="Esq" />
                                        <Line type="monotone" dataKey="d" stroke={COLOR_RIGHT_FOOT} strokeWidth={3} dot={{ r: 4 }} name="Dir" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-6 print:space-y-4 mb-8 print:mb-4 break-inside-avoid">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-blue-600 mb-2 border-b border-blue-200 pb-1">Pé Esquerdo</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {['initial', 'mid', 'terminal'].map(phase => (
                                        <div key={phase} className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                                            {t?.gait_photos?.left?.[phase] ? (
                                                <Image src={t.gait_photos.left[phase]} alt="Gait" fill className="object-cover" />
                                            ) : <span className="text-[9px] text-slate-400 uppercase">{phase}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-green-600 mb-2 border-b border-green-200 pb-1">Pé Direito</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {['initial', 'mid', 'terminal'].map(phase => (
                                        <div key={phase} className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                                            {t?.gait_photos?.right?.[phase] ? (
                                                <Image src={t.gait_photos.right[phase]} alt="Gait" fill className="object-cover" />
                                            ) : <span className="text-[9px] text-slate-400 uppercase">{phase}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* --- PÁGINA 3b: AGACHAMENTO UNIPODAL (CONDICIONAL) --- */}
                    {(t?.single_squat?.pelvic_drop_left || t?.single_squat?.valgus_left || t?.single_squat?.trunk_left || t?.single_squat?.photo_left || t?.single_squat?.photo_right) && (
                        <div className="p-12 print:p-6 h-[297mm] flex flex-col page-break">
                            <SectionHeader title="Agachamento Unipodal" icon={Activity} color="indigo" />

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                {/* Esquerda */}
                                <div>
                                    <h4 className="text-sm font-black uppercase mb-4 flex items-center gap-2" style={{ color: COLOR_LEFT_FOOT }}>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_LEFT_FOOT }} /> Esquerda
                                    </h4>

                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 space-y-2 text-sm">
                                        <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                            <span className="text-slate-500 font-medium">Queda Pélvica</span>
                                            <span className={cn("font-bold", getColorClass(t?.single_squat?.pelvic_drop_left))}>
                                                {t?.single_squat?.pelvic_drop_left || "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                            <span className="text-slate-500 font-medium">Valgo Dinâmico</span>
                                            <span className={cn("font-bold", getColorClass(t?.single_squat?.valgus_left))}>
                                                {t?.single_squat?.valgus_left || "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                            <span className="text-slate-500 font-medium">Anteriorização Tronco</span>
                                            <span className={cn("font-bold", getColorClass(t?.single_squat?.trunk_left))}>
                                                {t?.single_squat?.trunk_left || "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {t?.single_squat?.photo_left && (
                                        <div className="aspect-[3/4] bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden">
                                            <Image src={t.single_squat.photo_left} alt="Agachamento Unipodal Esq" fill className="object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Direita */}
                                <div>
                                    <h4 className="text-sm font-black uppercase mb-4 flex items-center gap-2" style={{ color: COLOR_RIGHT_FOOT }}>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_RIGHT_FOOT }} /> Direita
                                    </h4>

                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 space-y-2 text-sm">
                                        <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                            <span className="text-slate-500 font-medium">Queda Pélvica</span>
                                            <span className={cn("font-bold", getColorClass(t?.single_squat?.pelvic_drop_right))}>
                                                {t?.single_squat?.pelvic_drop_right || "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                            <span className="text-slate-500 font-medium">Valgo Dinâmico</span>
                                            <span className={cn("font-bold", getColorClass(t?.single_squat?.valgus_right))}>
                                                {t?.single_squat?.valgus_right || "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                            <span className="text-slate-500 font-medium">Anteriorização Tronco</span>
                                            <span className={cn("font-bold", getColorClass(t?.single_squat?.trunk_right))}>
                                                {t?.single_squat?.trunk_right || "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {t?.single_squat?.photo_right && (
                                        <div className="aspect-[3/4] bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden">
                                            <Image src={t.single_squat.photo_right} alt="Agachamento Unipodal Dir" fill className="object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PÁGINA 4: PERFIL & RECOMENDAÇÕES --- */}
                    <div className="p-12 print:p-6 h-[297mm] flex flex-col page-break">
                        <SectionHeader title="Perfil Biomecânico & Perfil de Calçado" icon={Activity} color="purple" />

                        <div className="flex-1 flex flex-col items-center justify-center mb-10 print:mb-4 min-h-[400px] print:min-h-[300px] break-inside-avoid">
                            <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 mb-4 print:mb-2 text-center">Resumo Clínico-Funcional</h3>
                            <div className="w-full h-[400px] print:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Paciente" dataKey="A" stroke="#13bcc8ff" fill="#59cbbb" fillOpacity={0.4} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-sm text-slate-500 font-medium max-w-md mx-auto">
                                Gráfico multidimensional integrando 8 pilares da saúde funcional do paciente.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 print:p-4 relative overflow-hidden break-inside-avoid print:bg-blue-50">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><Footprints className="w-40 h-40 text-blue-900" /></div>
                            <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest mb-4">Sugestão de Calçado</h4>

                            <div className="flex items-center gap-8 relative z-10">
                                <div className="text-6xl bg-white p-6 rounded-2xl shadow-sm">{shoeRec.image}</div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800">{shoeRec.text}</h3>
                                    <p className="font-bold text-blue-600 uppercase text-xs">{shoeRec.feature}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge className="bg-slate-900 text-white hover:bg-slate-800">Drop Recomendado (Padrão)</Badge>
                                        <Badge className={cn(minIndex > 70 ? "bg-green-600" : "bg-blue-600")}>Índice Minimalista: {minIndex}%</Badge>
                                    </div>
                                </div>
                            </div>
                            <InsightBox text={`Recomendação baseada na necessidade de ${shoeRec.desc || "otimização da mecânica de corrida e prevenção de lesões"}.`} />
                        </div>
                    </div>

                    {/* --- PÁGINA 5: GLOSSÁRIO --- */}
                    <div className="p-12 print:p-6 h-[297mm] flex flex-col page-break bg-slate-50 print:bg-slate-50">
                        <SectionHeader title="Glossário Visual de Calçados" icon={Info} color="slate" />

                        <div className="grid grid-cols-2 gap-8 mt-10 print:gap-4 print:mt-6">
                            {[
                                { title: "Flexibilidade", desc: "Capacidade do tênis dobrar na área dos metatarsos.", icon: ShellIcon },
                                { title: "Altura da Pilha", desc: "Altura da entressola (amortecimento) em relação ao solo.", icon: RulerDimensionLine },
                                { title: "Drop", desc: "Diferença de altura entre o calcanhar e a ponta do pé.", icon: TriangleRight },
                                { title: "Peso", desc: "Influencia diretamente na economia de corrida (gasto energético).", icon: WeightTilde },
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-6 print:p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start break-inside-avoid">
                                    <div className="bg-slate-100 p-3 rounded-lg text-slate-600">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-sm mb-1">{item.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>


                        {/* Exercise Prescription Section */}
                        {vals.plan?.exercises && vals.plan.exercises.length > 0 && (
                            <div className="mt-8 print:mt-4 break-inside-avoid">
                                <SectionHeader title="Prescrição de Exercícios" icon={Activity} color="teal" />
                                <div className="overflow-hidden border rounded-xl shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-teal-50 text-teal-800 font-black uppercase text-[10px]">
                                            <tr>
                                                <th className="p-3 text-left">Exercício</th>
                                                <th className="p-3 text-center">Séries</th>
                                                <th className="p-3 text-center">Repetições / Tempo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {vals.plan.exercises.map((ex: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="p-3 font-bold text-slate-700">{ex.name || ex}</td>
                                                    <td className="p-3 text-center font-medium bg-slate-50/50">
                                                        {ex.sets || "-"}
                                                    </td>
                                                    <td className="p-3 text-center font-medium bg-slate-50/50">
                                                        {ex.reps ? `${ex.reps} reps` : ex.time ? `${ex.time}s` : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {vals.plan?.orientations && (
                                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 print:bg-blue-50">
                                        <h5 className="text-xs font-black uppercase text-blue-800 mb-2">Orientações Adicionais</h5>
                                        <p className="text-sm text-slate-700 leading-relaxed">{vals.plan.orientations}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer Assinatura */}
                        <div className="mt-8 pt-8 flex flex-col items-center justify-center break-inside-avoid">
                            {professional?.digital_signature_url ? (
                                <div className="h-16 w-48 relative mb-2">
                                    <Image src={professional.digital_signature_url} alt="Assinatura" fill className="object-contain" />
                                </div>
                            ) : (
                                <div className="h-16 w-64 border-b border-slate-400 mb-2"></div>
                            )}

                            <h4 className="font-bold text-slate-900 uppercase text-sm">{professional?.name || "Profissional Responsável"}</h4>
                            <div className="flex gap-4 text-xs text-slate-500 font-medium uppercase mt-1">
                                <span>CREFITO: {professional?.crefito || "---"}</span>
                                <span>|</span>
                                <span>Tel: {professional?.phone || "---"}</span>
                            </div>
                            {organization?.address && (
                                <p className="text-[10px] text-slate-400 mt-2 max-w-sm text-center">
                                    {organization.address}
                                </p>
                            )}
                        </div>

                        {/* Compromisso Axiom Health - Discreto no final */}
                        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
                            <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Compromisso Axiom Health</h4>
                            <p className="text-[9px] text-slate-500 max-w-2xl mx-auto mt-1 leading-relaxed">
                                Este relatório é parte integrante do tratamento e deve ser utilizado para guiar a evolução clínica e esportiva.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    
                    /* Hide everything by default */
                    body {
                        visibility: hidden;
                        height: auto;
                    }

                    /* Make report visible and absolutely positioned to top */
                    #report-wrapper {
                        visibility: visible;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: auto !important;
                        margin: 0;
                        padding: 0;
                        background: white;
                        z-index: 9999;
                        overflow: visible !important;
                        display: block;
                    }

                    /* Ensure all report children are visible */
                    #report-wrapper * {
                        visibility: visible;
                    }

                    /* Reset internal scroll containers to allow full expansion */
                    #report-scroll-area {
                        overflow: visible !important;
                        height: auto !important;
                        display: block;
                    }

                    /* Ensure the specific page width/height is respected but allows flow */
                    #report-paper {
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                    }

                    /* Force page breaks */
                    .page-break {
                        page-break-after: always !important;
                        break-after: page !important;
                        min-height: 297mm; /* Ensure full height logic triggers break */
                        height: 297mm;
                        overflow: hidden;
                    }

                    /* Print colors */
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print-color-adjust { -webkit-print-color-adjust: exact; }
                    .print\\:bg-slate-50 { background-color: #f8fafc !important; }
                    .print\\:bg-blue-50 { background-color: #eff6ff !important; }
                    .print\\:border-slate-200 { border-color: #e2e8f0 !important; }
                }
            `}</style>
        </div>
    );
}
