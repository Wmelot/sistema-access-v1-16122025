"use client";
import React, { useMemo, useState, useEffect } from "react";
// Forced Update: 2026-01-31T02:00:00
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Footprints, CheckCircle2, Info, Activity, AlertTriangle, ArrowRight, Ruler, Shell, Play, Scale, Eye, EyeOff, LayoutPanelLeft, ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    LineChart, Line, CartesianGrid, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { calculateRadarData } from "@/utils/clinical-references";
import { calculateMinimalismIndex, calculateSmartRecommendation } from "@/components/assessments/biomechanics-calculations";
import Image from "next/image";
import { COLOR_LEFT_FOOT, COLOR_RIGHT_FOOT, COLOR_REF_LINE } from "@/utils/report-constants";

// --- HELPERS ---
const Watermark = ({ logoUrl, name }: { logoUrl?: string; name?: string }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.04] z-0 overflow-hidden select-none">
        <div className="transform -rotate-[45deg] scale-150">
            {logoUrl ? (
                <div className="w-[500px] h-[500px] relative">
                    <Image src={logoUrl} alt="Watermark" fill className="object-contain grayscale" unoptimized priority />
                </div>
            ) : (
                <span className="text-[150px] font-black uppercase text-slate-200 whitespace-nowrap tracking-[0.2em]">{name || "ACCESS"}</span>
            )}
        </div>
    </div>
);

const getFpiLabel = (v: any) => {
    const val = Number(v || 0);
    if (val <= -6) return "Pé Cavo";
    if (val <= 5) return "Neutro";
    return "Pé Plano";
};

function calculateAge(dob: string) {
    if (!dob) return "--";
    try {
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    } catch (e) {
        return "--";
    }
}

const getFpiColor = (v: any) => {
    const val = Number(v || 0);
    if (val <= -6) return "text-red-700";
    if (val <= 5) return "text-emerald-700";
    return "text-red-600";
};

// New FPI Visual Component for the Report
const FpiVisualBar = ({ label, score }: { label: string, score: number }) => {
    const isNormal = score >= -5 && score <= 5;
    const percentage = ((score + 12) / 24) * 100;
    const colorClass = isNormal ? "bg-emerald-500" : "bg-red-500";
    const textStatus = score <= -6 ? "PÉ CAVO" : score <= 5 ? "NEUTRO" : "PÉ PLANO";

    return (
        <div className="space-y-1 w-full">
            <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase leading-none">{label}</span>
                <span className={cn("text-[10px] font-black leading-none", isNormal ? "text-emerald-700" : "text-red-600")}>
                    {score} ({textStatus})
                </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                <div className="absolute left-[29.16%] w-[41.66%] h-full bg-emerald-50 opacity-40 border-x border-emerald-100/30"></div>
                <div className="absolute left-1/2 w-0.5 h-full bg-slate-300 opacity-50 z-0"></div>
                <div
                    className={cn("absolute h-full w-4 -ml-2 rounded-full border-2 border-white shadow-sm transition-all duration-1000 z-10", colorClass)}
                    style={{ left: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon, color = "blue" }: any) => (
    <div className={cn("flex items-center gap-3 border-b-2 pb-2 mb-4 print:mb-2",
        color === "blue" ? "border-blue-200" :
            color === "orange" ? "border-orange-200" :
                color === "purple" ? "border-purple-200" :
                    `border-${color}-200`)}>
        <div className={cn("p-1.5 rounded-lg text-white",
            color === "blue" ? "bg-blue-600" :
                color === "orange" ? "bg-orange-600" :
                    color === "purple" ? "bg-purple-600" :
                        `bg-${color}-600`)}>
            <Icon className="w-4 h-4" />
        </div>
        <h3 className={cn("font-black uppercase text-sm tracking-widest",
            color === "blue" ? "text-blue-900" :
                color === "orange" ? "text-orange-900" :
                    color === "purple" ? "text-purple-900" :
                        `text-${color}-900`)}>{title}</h3>
    </div>
);

// Editable Insight Component
const InsightBox = ({ text, placeholder = "Clique para editar o insight..." }: { text: string, placeholder?: string }) => {
    if (!text && !placeholder) return null;
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
                    className="text-[11px] text-slate-700 leading-tight italic outline-none focus:ring-1 focus:ring-purple-200 rounded px-1 -ml-1 min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
                    data-placeholder={placeholder}
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
    const strokeColor = color === "red" ? "#ef4444" : color === "green" ? "#22c55e" : "#3b82f6";

    return (
        <div className="bg-white border rounded-2xl p-4 shadow-sm relative overflow-hidden print:border-slate-200 break-inside-avoid">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</h4>
            <div className="relative h-24 flex items-center justify-center">
                <div className="relative w-32 h-16 overflow-hidden">
                    <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-0">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={strokeColor} strokeWidth="12"
                            strokeDasharray={`${(pct / 100) * 126} 126`} className="transition-all duration-1000" />
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
    form?: any;
    data?: any;
    shoeRec?: any;
    minIndex?: number;
    organizationName?: string;
    professional?: any;
    patient?: any;
    organization?: any;
}

export function BiomechanicsReport({ open, onClose, form, data, shoeRec, minIndex, organizationName, professional, patient, organization }: BiomechanicsReportProps) {
    const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
        quadroGeral: true,
        estatica: true,
        funcionais: true,
        dinamica: true,
        squat: true,
        perfil: true,
        calcado: true,
        glossario: true,
        exercicios: true
    });

    if (!open) return null;

    // DATA NORMALIZATION
    const vals = data || form?.getValues() || {};
    const t = vals.tests || {};
    const p = vals.postural || {};
    const hma = vals.hma || {};

    // 1. Radar Data
    const radarChartData = useMemo(() => calculateRadarData(vals), [vals]);

    // 2. Dynamic Data (for LineChart)
    // 2. Dynamic Data (for LineChart)
    const dfiData = [
        { name: 'RC', e: t?.dfi?.[0]?.left || 0, d: t?.dfi?.[0]?.right || 0, normal: 1 },  // Ref: Supinação leve ao contato
        { name: 'AM', e: t?.dfi?.[1]?.left || 0, d: t?.dfi?.[1]?.right || 0, normal: 2 },  // Ref: Pronação máx no apoio médio
        { name: 'IMP', e: t?.dfi?.[2]?.left || 0, d: t?.dfi?.[2]?.right || 0, normal: 0 }  // Ref: Ressupinação na propulsão
    ];

    // 3. Logic for automated insights
    const painVal = Number(hma.eva?.[0] || vals.eva || 0);
    const painInsight = painVal > 7 ?
        "A dor elevada impacta a biomecânica protetora. Controle analgésico é prioridade antes de cargas elevadas." :
        "Nível de dor permite intervenções mecânicas diretas e progressão de carga.";

    const efepTotal = vals.efep?.items || vals.efep || [];
    const funcScore = efepTotal.length > 0 ?
        Math.round((efepTotal.reduce((a: any, b: any) => a + Number(b.score || 0), 0) / (efepTotal.length * 10)) * 100) : 0;
    const funcInsight = funcScore < 50 ?
        "Capacidade funcional reduzida. Foco em restaurar atividades de vida diária básicas." :
        "Boa funcionalidade basal. Objetivo é otimizar performance gestual.";

    const loadMin = vals.sports?.reduce((acc: any, s: any) => acc + (Number(s.freq) * Number(s.duration)), 0) || 0;
    const loadInsight = loadMin > 300 ?
        "Volume de treino alto. Monitorar sinais de Overreaching e priorizar recovery." :
        "Volume moderado/baixo. Janela segura para incremento progressivo de carga.";

    const strengthScore = radarChartData.find(d => d.subject === 'Força')?.A || 0;
    const strengthInsight = strengthScore < 60 ?
        "Déficit de força em cadeia posterior/lateral identificado. Recomenda-se fortalecimento específico de glúteo médio e máximo." :
        "Níveis de força adequados para estabilização de pelve e controle de valgo dinâmico.";

    const flexScore = radarChartData.find(d => d.subject === 'Flexibilidade')?.A || 0;
    const flexInsight = flexScore < 60 ?
        "Restrição de mobilidade identificada, o que pode sobrecarregar articulações adjacentes em movimentos dinâmicos." :
        "Boa flexibilidade tecidual e mobilidade articular, favorecendo a amplitude do gesto esportivo.";

    // 4. Dysmetry
    const legL = Number(t?.ybalance?.legLength?.left || 0);
    const legR = Number(t?.ybalance?.legLength?.right || 0);
    const dysmetry = Math.abs(legL - legR);
    const hasDysmetry = dysmetry >= 5;

    // 5. Standalone calculations
    const finalMinIndex = minIndex ?? (vals.shoe ? calculateMinimalismIndex(vals.shoe) : 0);

    const finalShoeRec = useMemo(() => {
        if (shoeRec) return shoeRec;
        const res = calculateSmartRecommendation(vals.patientProfile || {}, vals.painPoints || {});
        return {
            text: res.description.split('.')[0] + '.',
            image: res.indexRange[0] > 60 ? "🏃" : "👟",
            feature: res.traits.join(" | "),
            desc: res.description
        };
    }, [shoeRec, vals]);

    // Toggle helper
    const toggleSection = (section: string) => {
        setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const sumFpi = (obj: any) => {
        if (!obj) return 0;
        if (typeof obj === 'number') return obj;
        return Object.values(obj).reduce((a: number, b) => a + (Number(b) || 0), 0);
    };

    const currentFpiL = sumFpi(p?.fpi_left);
    const currentFpiR = sumFpi(p?.fpi_right);

    // Helper for color coding
    const getColorClass = (val: string | undefined): string => {
        if (!val) return "text-slate-800";
        const v = val.toLowerCase();
        if (v.includes('normal') || v.includes('ausente')) return "text-emerald-700 bg-emerald-50 rounded px-2 py-0.5";
        if (v.includes('leve') || v.includes('moderado')) return "text-amber-700 bg-amber-50 rounded px-2 py-0.5";
        if (v.includes('acentuado') || v.includes('severo')) return "text-red-700 bg-red-50 rounded px-2 py-0.5";
        return "text-slate-800";
    };

    // Helper for table data to use summed FPI
    const testsTable = [
        { name: "Teste de Thomas (Psoas)", l: t?.thomas?.left, r: t?.thomas?.right, ref: "-10º a 0º (Feber et.al, 2010)" },
        { name: "PKET (Isquiosurais)", l: t?.slr?.left, r: t?.slr?.right, ref: " > 132º (Reurink et.al, 2013)" },
        { name: "Rigidez de Rot. Laterais do Quadil", l: t?.ventral?.rotation?.left, r: t?.ventral?.rotation?.right, ref: "> 40º(Carvalhais et.al, 2011)" },
        { name: "APA (Ângulo Perna-Antepé)", l: t?.ventral?.measures?.left?.apa, r: t?.ventral?.measures?.right?.apa, ref: "10º a 18º (Mendonça et.al, 2013)" },
        { name: "Teste de Jack (Hálux)", l: t?.jack?.left, r: t?.jack?.right, ref: "Grau 1 (Molinete Completo)" },
        { name: "Lunge Test (Tríceps Sural)", l: t?.lunge?.left, r: t?.lunge?.right, ref: "> 42º(Bennel et.al, 1998)" },
        { name: "FPI-6 (Postura Pé)", l: currentFpiL, r: currentFpiR, ref: "-5 a +5 (Normal)" },
    ].filter(x => x.l !== undefined || x.r !== undefined || x.name === "FPI-6 (Postura Pé)");

    // Prevent navigation when closing print dialog
    useEffect(() => {
        const handleAfterPrint = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    const toggleAll = (visible: boolean) => {
        const newState = { ...visibleSections };
        Object.keys(newState).forEach(k => newState[k] = visible);
        setVisibleSections(newState);
    };

    return (
        <div id="report-wrapper" className="fixed inset-0 z-[999] bg-white flex flex-col animate-in fade-in duration-300 overflow-hidden">
            {/* TOOLBAR */}
            <div className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-slate-900 text-white shrink-0 print:hidden">
                <h2 className="font-extrabold text-sm md:text-lg flex items-center gap-2 uppercase tracking-tighter"><Activity className="text-blue-400" /> Relatório Personalizado</h2>
                <div className="flex gap-2 md:gap-4">
                    <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white px-2 md:px-4 text-xs md:text-sm">Sair</Button>
                    <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 font-bold shrink-0 text-xs md:text-sm h-9 md:h-10 px-3 md:px-4">
                        <Send className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Gerar </span>PDF
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* SETTINGS SIDEBAR */}
                <aside className="w-64 bg-slate-50 border-r overflow-y-auto p-6 hidden lg:block print:hidden custom-scrollbar">
                    <div className="flex items-center gap-2 mb-6 text-slate-900">
                        <LayoutPanelLeft className="w-5 h-5" />
                        <h4 className="font-black text-xs uppercase tracking-widest">Configuração</h4>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Seções Visíveis</span>
                            <div className="flex gap-2 pt-1">
                                <Button variant="outline" size="sm" className="text-[9px] h-6 px-2" onClick={() => toggleAll(true)}>Todas</Button>
                                <Button variant="outline" size="sm" className="text-[9px] h-6 px-2" onClick={() => toggleAll(false)}>Nenhuma</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {[
                                { id: 'quadroGeral', label: 'Quadro Geral' },
                                { id: 'estatica', label: 'Análise Estática' },
                                { id: 'funcionais', label: 'Testes Funcionais' },
                                { id: 'dinamica', label: 'Análise Dinâmica' },
                                { id: 'squat', label: 'Agachamento Unipodal' },
                                { id: 'perfil', label: 'Perfil de Saúde' },
                                { id: 'calcado', label: 'Recomendação Calçado' },
                                { id: 'glossario', label: 'Glossário Técnico' },
                                { id: 'exercicios', label: 'Prescrição Exercícios' }
                            ].map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => toggleSection(section.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all",
                                        visibleSections[section.id]
                                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                                            : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    {section.label}
                                    {visibleSections[section.id] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* PREVIEW AREA */}
                <div id="report-scroll-area" className="flex-1 overflow-auto bg-slate-100 p-0 md:p-8 print:p-0 print:bg-white custom-scrollbar">
                    <div className="w-full flex justify-center py-4 md:py-0">
                        <div id="report-paper" className="bg-white w-[210mm] min-w-[210mm] shadow-2xl print:shadow-none print:max-w-none print:w-full print:h-auto transition-transform duration-500 origin-top scale-[0.35] md:scale-100">

                            {/* --- PÁGINA 1: CAPA & RESUMO --- */}
                            <div className="p-12 print:p-6 min-h-[297mm] flex flex-col relative page-break overflow-hidden">

                                <div className="relative z-10 flex-1 flex flex-col">
                                    {/* Header */}
                                    <header className="flex justify-between items-start border-b-4 border-blue-900 pb-6 mb-10 print:mb-6 print:pb-4 print-color-adjust">
                                        <div className="flex items-center gap-4">
                                            {organization?.logo_url ? (
                                                <div className="w-20 h-20 relative rounded-[24px] overflow-hidden border border-slate-100 shadow-sm print:shadow-none" style={{ borderRadius: '24px', overflow: 'hidden', clipPath: 'inset(0% round 24px)', WebkitClipPath: 'inset(0% round 24px)' }}>
                                                    <Image src={organization.logo_url} alt="Logo" fill className="object-cover" unoptimized priority />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl print-color-adjust">
                                                    {organization?.name?.[0] || organizationName?.[0] || professional?.name?.[0] || "A"}
                                                </div>
                                            )}
                                            <div>
                                                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Relatório Biomecânico</h1>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">{organization?.name || organizationName || "Advanced Clinical Protocol"}</p>
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
                                                <span className="block text-xl font-bold text-slate-800">{patient?.name || vals.patientName || "Paciente Modelo"}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] uppercase font-black text-slate-400">Idade</span>
                                                <span className="block text-xl font-bold text-slate-800">{patient?.date_of_birth ? calculateAge(patient.date_of_birth) : (patient?.birth_date ? calculateAge(patient.birth_date) : (patient?.birthdate ? calculateAge(patient.birthdate) : (vals.patientAge || "--")))} anos</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-[10px] uppercase font-black text-slate-400">Queixa Principal</span>
                                                <span className="block text-lg font-medium text-slate-700 italic">"{hma.qp || "Avaliação de Rotina"}"</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cards Grid */}
                                    {visibleSections.quadroGeral && (
                                        <>
                                            <SectionHeader title="Quadro Geral" icon={Activity} />
                                            <div className="grid grid-cols-2 gap-6 mb-auto print:gap-4 print:mb-4">
                                                <GaugeCard label="Nível de Dor (EVA)" value={painVal} max={10} color="red" unit="/ 10" insight={painInsight} />

                                                <GaugeCard label="Nível Funcional (EFEP)" value={funcScore} max={100} color="green" unit="Pts" insight={funcInsight} />

                                                <div className="bg-white border rounded-2xl p-4 shadow-sm break-inside-avoid print:border-slate-200">
                                                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Carga de Treino Semanal</h4>
                                                    <div className="flex items-baseline gap-1 mb-2">
                                                        <span className="text-3xl font-black text-orange-600">{loadMin}</span>
                                                        <span className="text-xs font-bold text-slate-500">min/sem</span>
                                                    </div>
                                                    <Badge className="bg-orange-100 text-orange-700 border-none mb-2 block w-fit h-4 text-[9px] font-bold uppercase">
                                                        {loadMin >= 600 ? "Alta Performance" : loadMin >= 300 ? "Ativo" : "Moderado/Baixo"}
                                                    </Badge>
                                                    <InsightBox text={loadInsight} />
                                                </div>

                                                <div className="bg-white border rounded-2xl p-4 shadow-sm break-inside-avoid print:border-slate-200">
                                                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Postura dos pés (FPI-6)</h4>
                                                    <div className="space-y-4 mt-2">
                                                        <FpiVisualBar label="Esquerdo" score={currentFpiL} />
                                                        <FpiVisualBar label="Direito" score={currentFpiR} />
                                                    </div>
                                                    <div className="mt-4 p-2 bg-slate-50 rounded border border-slate-100 text-[9px] text-slate-500 font-medium italic">
                                                        Ref: -5 a +5 (Normal) | +6 a +12 (Plano) | -6 a -12 (Cavo)
                                                    </div>
                                                    <InsightBox text={`Índice de Postura do Pé indica ${Math.abs(Number(currentFpiL)) > 5 || Math.abs(Number(currentFpiR)) > 5 ? "desvios significativos" : "alinhamento dentro da normalidade"}.`} />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Footer Logo */}
                                    <div className="mt-8 pt-6 border-t flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                                        <span>Relatório Gerado por {organization?.name || organizationName || 'Axiom Clinical'}</span>
                                        <span>Axiom Health System</span>
                                    </div>
                                </div>
                            </div>

                            {/* --- PÁGINA 2: ANÁLISE ESTÁTICA --- */}
                            {(visibleSections.estatica || visibleSections.funcionais) && (
                                <div className="p-12 print:p-6 print:block flex flex-col page-break relative overflow-hidden">
                                    <Watermark logoUrl={organization?.logo_url} name={organization?.name || organizationName} />
                                    <div className="relative z-10">
                                        {visibleSections.estatica && (
                                            <>
                                                <SectionHeader title="Análise Estática & Baropodometria" icon={Footprints} />

                                                <div className="grid grid-cols-2 gap-4 h-64 mb-8 break-inside-avoid print:mb-4 print:h-48">
                                                    <div className="border border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden">
                                                        {t.baropo_2d ? (
                                                            <Image src={t.baropo_2d} alt="Baropo 2D" fill className="object-contain" unoptimized priority />
                                                        ) : <span className="text-slate-400 text-xs font-black uppercase tracking-widest opacity-25">Baropodometria 2D</span>}
                                                    </div>
                                                    <div className="border border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden">
                                                        {t.baropo_3d ? (
                                                            <Image src={t.baropo_3d} alt="Baropo 3D" fill className="object-contain" unoptimized priority />
                                                        ) : <span className="text-slate-400 text-xs font-black uppercase tracking-widest opacity-25">Baropodometria 3D</span>}
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
                                            </>
                                        )}

                                        {visibleSections.funcionais && testsTable.length > 0 && (
                                            <>
                                                <SectionHeader title="Testes Funcionais Comparativos" icon={Activity} color="green" />
                                                <div className="overflow-hidden border rounded-xl shadow-sm mb-auto print:mb-4 break-inside-avoid">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px]">
                                                            <tr>
                                                                <th className="p-3 text-left">Teste</th>
                                                                <th className="p-3 text-center">Esquerda</th>
                                                                <th className="p-3 text-center">Direita</th>
                                                                <th className="p-3 text-right">Referência</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {testsTable.map((row, i) => (
                                                                <tr key={i} className="hover:bg-slate-50">
                                                                    <td className="p-3 font-bold text-slate-700">{row.name}</td>
                                                                    <td className="p-3 text-center font-medium bg-slate-50/50">{row.l ?? "-"}</td>
                                                                    <td className="p-3 text-center font-medium bg-slate-50/50">{row.r ?? "-"}</td>
                                                                    <td className="p-3 text-right text-slate-400 font-semibold italic text-[10px]">{row.ref}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- PÁGINA 3: ANÁLISE DINÂMICA --- */}
                            {visibleSections.dinamica && (
                                <div className="p-12 print:p-6 print:block flex flex-col page-break relative overflow-hidden">

                                    <div className="relative z-10">
                                        <SectionHeader title="Análise Dinâmica" icon={Activity} color="orange" />

                                        <div className="mb-8 print:mb-4 break-inside-avoid">
                                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Cinemática Angular (DFI) vs Valor de Referência</h4>
                                            <div className="h-64 w-full bg-white border rounded-xl p-4 print:h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={dfiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                                        <YAxis domain={[-4, 4]} fontSize={10} axisLine={false} tickLine={false} />

                                                        {/* Curva Normal (Gold Standard) - Substitui a reta no zero */}
                                                        <Line type="monotone" dataKey="normal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Referência" />

                                                        {/* Pés com Opacidade: Sobreposição cria 3ª cor automaticamente */}
                                                        <Line type="monotone" dataKey="e" stroke={COLOR_LEFT_FOOT} strokeWidth={4} strokeOpacity={0.6} dot={{ r: 4, strokeWidth: 0, fillOpacity: 1 }} activeDot={{ r: 6 }} name="Esquerdo" />
                                                        <Line type="monotone" dataKey="d" stroke={COLOR_RIGHT_FOOT} strokeWidth={4} strokeOpacity={0.6} dot={{ r: 4, strokeWidth: 0, fillOpacity: 1 }} activeDot={{ r: 6 }} name="Direito" />

                                                        <Legend
                                                            verticalAlign="top"
                                                            height={36}
                                                            iconType="circle"
                                                            formatter={(value: any) => <span className="text-[10px] font-bold uppercase text-slate-600 ml-1">{value}</span>}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="space-y-6 print:space-y-4 mb-auto print:mb-4">
                                            <div className="break-inside-avoid">
                                                <h4 className="text-[10px] font-black uppercase text-blue-600 mb-2 border-b border-blue-200 pb-1">Análise de Marcha: Pé Esquerdo (RC-AM-FI)</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['initial', 'mid', 'terminal'].map(phase => (
                                                        <div key={phase} className="aspect-[3/4] bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                                                            {t?.gait_photos?.left?.[phase] ? (
                                                                <Image src={t.gait_photos.left[phase]} alt="Gait" fill className="object-contain" unoptimized priority />
                                                            ) : <span className="text-[9px] text-slate-300 font-black uppercase">{phase}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="break-inside-avoid">
                                                <h4 className="text-[10px] font-black uppercase text-green-600 mb-2 border-b border-green-200 pb-1">Análise de Marcha: Pé Direito (RC-AM-FI)</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['initial', 'mid', 'terminal'].map(phase => (
                                                        <div key={phase} className="aspect-[3/4] bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                                                            {t?.gait_photos?.right?.[phase] ? (
                                                                <Image src={t.gait_photos.right[phase]} alt="Gait" fill className="object-contain" unoptimized priority />
                                                            ) : <span className="text-[9px] text-slate-300 font-black uppercase">{phase}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- PÁGINA 3b: AGACHAMENTO UNIPODAL --- */}
                            {visibleSections.squat && (
                                <div className="p-12 print:p-6 print:block flex flex-col page-break relative overflow-hidden">

                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <SectionHeader title="Avaliação de Estabilidade Unipodal" icon={Activity} color="indigo" />

                                        <div className="grid grid-cols-2 gap-8 mb-auto">
                                            {/* Esquerda */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black uppercase flex items-center gap-2" style={{ color: COLOR_LEFT_FOOT }}>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_LEFT_FOOT }} /> Lado Esquerdo
                                                </h4>

                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-sm shadow-sm">
                                                    <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Queda Pélvica</span>
                                                        <span className={cn("font-bold text-xs", getColorClass(t?.single_squat?.pelvic_drop_left))}>
                                                            {t?.single_squat?.pelvic_drop_left || "Normal"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Valgo Dinâmico</span>
                                                        <span className={cn("font-bold text-xs", getColorClass(t?.single_squat?.valgus_left))}>
                                                            {t?.single_squat?.valgus_left || "Normal"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Tronco</span>
                                                        <span className={cn("font-bold text-xs", getColorClass(t?.single_squat?.trunk_left))}>
                                                            {t?.single_squat?.trunk_left || "Normal"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {t?.single_squat?.photo_left && (
                                                    <div className="aspect-[3/4] bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden shadow-lg">
                                                        <Image src={t.single_squat.photo_left} alt="Single Squat" fill className="object-contain" unoptimized priority />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Direita */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black uppercase flex items-center gap-2" style={{ color: COLOR_RIGHT_FOOT }}>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_RIGHT_FOOT }} /> Lado Direito
                                                </h4>

                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-sm shadow-sm">
                                                    <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Queda Pélvica</span>
                                                        <span className={cn("font-bold text-xs", getColorClass(t?.single_squat?.pelvic_drop_right))}>
                                                            {t?.single_squat?.pelvic_drop_right || "Normal"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-dashed pb-1 items-center">
                                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Valgo Dinâmico</span>
                                                        <span className={cn("font-bold text-xs", getColorClass(t?.single_squat?.valgus_right))}>
                                                            {t?.single_squat?.valgus_right || "Normal"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Tronco</span>
                                                        <span className={cn("font-bold text-xs", getColorClass(t?.single_squat?.trunk_right))}>
                                                            {t?.single_squat?.trunk_right || "Normal"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {t?.single_squat?.photo_right && (
                                                    <div className="aspect-[3/4] bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden shadow-lg">
                                                        <Image src={t.single_squat.photo_right} alt="Single Squat" fill className="object-contain" unoptimized priority />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- PÁGINA 4: PERFIL & RECOMENDAÇÕES --- */}
                            {(visibleSections.perfil || visibleSections.calcado) && (
                                <div className="p-12 print:p-6 print:block flex flex-col page-break relative overflow-hidden bg-white">

                                    <div className="relative z-10 flex-1 flex flex-col">
                                        {visibleSections.perfil && (
                                            <div className="break-inside-avoid print:mb-8">
                                                <SectionHeader title="Perfil Biomecânico Multidimensional" icon={Activity} color="purple" />

                                                <div className="flex flex-col items-center justify-center mb-8 print:mb-12 min-h-[400px] print:min-h-[350px]">
                                                    <div className="w-full h-[400px] print:h-[350px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                                                                <PolarGrid stroke="#e2e8f0" />
                                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                                <Radar name="Paciente" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                                        <InsightBox text={strengthInsight} />
                                                        <InsightBox text={flexInsight} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {visibleSections.calcado && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 print:p-4 mt-auto mb-8 relative overflow-hidden break-inside-avoid print:bg-blue-50 shadow-sm">
                                                <div className="absolute top-0 right-0 p-6 opacity-5"><Footprints className="w-40 h-40 text-blue-900" /></div>
                                                <h4 className="font-black text-blue-900 uppercase text-[10px] tracking-widest mb-4">Recomendação Técnica de Calçado</h4>

                                                <div className="flex items-center gap-8 relative z-10">
                                                    <div className="text-6xl bg-white p-6 rounded-2xl shadow-sm border border-blue-200">{finalShoeRec.image}</div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{finalShoeRec.text}</h3>
                                                        <p className="font-bold text-blue-600 uppercase text-xs">{finalShoeRec.feature}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            <Badge className="bg-slate-900 text-white hover:bg-slate-800 h-5 text-[9px]">Padrão Clínico</Badge>
                                                            <Badge className={cn("h-5 text-[9px]", finalMinIndex > 70 ? "bg-green-600" : "bg-blue-600")}>Índice Minimalista: {finalMinIndex}%</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <InsightBox text={`Indicação baseada na necessidade de ${finalShoeRec.desc || "melhoria da estabilidade dinâmica e economia de corrida"}.`} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- PÁGINA 5: GLOSSÁRIO & EXERCÍCIOS --- */}
                            {(visibleSections.glossario || visibleSections.exercicios) && (
                                <div className="p-12 print:p-6 flex flex-col page-break bg-white relative overflow-hidden">

                                    <div className="relative z-10 flex-1 flex flex-col">
                                        {visibleSections.glossario && (
                                            <>
                                                <SectionHeader title="Dicionário Técnico de Calçados" icon={Info} color="slate" />
                                                <div className="grid grid-cols-2 gap-6 mt-4 print:gap-4 print:mt-2">
                                                    {[
                                                        { title: "Drop", desc: "Diferença de altura da sola entre calcanhar e bico do tênis. Baixos drops favorecem a pisada de mediopé.", icon: Play },
                                                        { title: "Pilha / Stack", desc: "Altura total da entressola. Volumes altos oferecem maior amortecimento passivo.", icon: Ruler },
                                                        { title: "Flexibilidade Longitudinal / Torsional", desc: "Facilidade de dobrar e torcer o tênis próximo à caixa de dedos. Essencial para propulsão.", icon: Shell },
                                                        { title: "Peso", desc: "Redução de peso no calçado está ligada à melhora do VO2 máx.", icon: Scale },
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-4 items-start break-inside-avoid shadow-sm">
                                                            <div className="bg-white p-2 rounded-lg text-slate-400 border border-slate-100 shadow-sm">
                                                                <item.icon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-800 uppercase text-[10px] mb-1">{item.title}</h4>
                                                                <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {visibleSections.exercicios && (
                                            <div className="mt-12 print:mt-8 break-inside-avoid shadow-sm border border-slate-50 rounded-2xl p-6 bg-white">
                                                <SectionHeader title="Prescrição de Reabilitação & Performance" icon={Activity} color="teal" />

                                                {vals.plan?.exercises && vals.plan.exercises.length > 0 && (
                                                    <div className="overflow-hidden border border-teal-100 rounded-xl mb-6">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-teal-600 text-white font-black uppercase text-[10px]">
                                                                <tr>
                                                                    <th className="p-3 text-left">Prescrição</th>
                                                                    <th className="p-3 text-center">Volume</th>
                                                                    <th className="p-3 text-center">Cadência / Tempo</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                                {vals.plan.exercises.map((ex: any, i: number) => (
                                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                        <td className="p-3 font-bold text-slate-800">
                                                                            {typeof ex === 'string' ? ex : (ex.name || "Exercício Específico")}
                                                                        </td>
                                                                        <td className="p-3 text-center font-bold text-teal-700 bg-teal-50/30">
                                                                            {ex.sets || "3"} Séries
                                                                        </td>
                                                                        <td className="p-3 text-center font-medium text-slate-600">
                                                                            {ex.reps ? `${ex.reps} Reps` : ex.time ? `${ex.time} Seg` : "Exaustão"}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                {vals.plan?.orientations && (
                                                    <div className="mb-8 bg-teal-50 border border-teal-100 rounded-xl p-6 print:bg-teal-50">
                                                        <h5 className="text-[10px] font-black uppercase text-teal-800 mb-2 tracking-widest">Observações do Fisioterapeuta</h5>
                                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{vals.plan.orientations}</p>
                                                    </div>
                                                )}

                                                {/* ASSINATURA ACOPLADA */}
                                                <div className="pt-8 border-t border-slate-100 flex flex-col items-center">
                                                    {professional?.digital_signature_url ? (
                                                        <div className="h-20 w-48 relative mb-2">
                                                            <Image src={professional.digital_signature_url} alt="Assinatura" fill className="object-contain" unoptimized priority />
                                                        </div>
                                                    ) : (
                                                        <div className="h-16 w-64 border-b-2 border-slate-200 mb-2"></div>
                                                    )}
                                                    <h4 className="font-extrabold text-slate-900 uppercase text-sm tracking-tight mb-1">
                                                        {professional?.full_name || professional?.name || "Dr. Fisioterapeuta"}
                                                    </h4>
                                                    <div className="flex gap-4 text-[9px] text-slate-400 font-bold uppercase">
                                                        <span>{professional?.council_type || "CREFITO"}: {professional?.council_number || professional?.crefito || "---"}</span>
                                                        <span>|</span>
                                                        <span>{professional?.phone || "BIOMECÂNICA CLÍNICA"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm !important;
                    }
                    /* Better isolation for print */
                    html, body, #__next {
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        visibility: hidden !important;
                        background: white !important;
                    }
                    /* Ensure portals aren't hidden globally but their background is */
                    [data-radix-portal] {
                        visibility: visible !important;
                    }
                    #report-wrapper {
                        visibility: visible !important;
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        z-index: 9999 !important;
                    }
                    #report-wrapper * {
                        visibility: visible !important;
                        overflow: visible !important;
                    }
                    /* Force header and logo to print */
                    header {
                        display: flex !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    
                    header * {
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    /* Force borders and backgrounds to print */
                    .border-b-4, .border-blue-900, .bg-blue-900 {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    /* Prevent page breaks inside important elements */
                    .bg-slate-50, .bg-white, .rounded-2xl, .rounded-xl, .shadow-sm {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    
                    /* Keep section headers with their content */
                    h3, h4, .font-black {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                    }
                    
                    .page-break {
                        display: block !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        min-height: auto !important;
                        height: auto !important;
                        padding: 0 !important;
                        margin-bottom: 0 !important;
                        position: relative !important;
                        background: white !important;
                    }
                    #report-paper {
                        width: 100% !important;
                        transform: none !important;
                        display: block !important;
                        height: auto !important;
                        background: white !important;
                        box-shadow: none !important;
                    }
                    .break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        display: block !important;
                    }
                    .keep-with-next {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                    }
                    /* Ensure images print correctly */
                    img {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        max-width: 100% !important;
                    }



                    /* FORÇAR VISIBILIDADE DE GRÁFICOS E ÍCONES */
                    svg, path, rect, circle, g, .recharts-wrapper {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        visibility: visible !important;
                    }
                    
                    .print-color-adjust { 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

