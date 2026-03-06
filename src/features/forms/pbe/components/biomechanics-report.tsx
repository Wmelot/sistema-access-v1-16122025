"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Footprints, CheckCircle2, Info, Activity, AlertTriangle, ArrowRight, Ruler, Shell, Play, Scale, Eye, EyeOff, LayoutPanelLeft, ArrowLeft, Menu, User, Brain, Dumbbell, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    LineChart, Line, CartesianGrid, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { calculateRadarData } from "@/utils/clinical-references";
import { calculateMinimalismIndex, calculateSmartRecommendation } from "@/features/forms/pbe/utils/biomechanics-calculations";
import { getShoeRecommendationFlow } from "@/features/forms/palmilha-5/components/accordions/ShoeAccordion";
import Image from "next/image";
import { calculateActivityLevel } from "@/utils/pbe-calculations";
import { COLOR_LEFT_FOOT, COLOR_RIGHT_FOOT } from "@/utils/report-constants";

// --- HELPERS ---
function calculateAge(dob: string) {
    if (!dob) return "--";
    try {
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    } catch (e) {
        return "--";
    }
}

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
            <div className="h-2 w-full bg-slate-100 rounded-full relative border border-slate-200/50">
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
                    color === "teal" ? "border-teal-200" :
                        color === "indigo" ? "border-indigo-200" :
                            `border-${color}-200`)}>
        <div className={cn("p-1.5 rounded-lg text-white",
            color === "blue" ? "bg-blue-600" :
                color === "orange" ? "bg-orange-600" :
                    color === "purple" ? "bg-purple-600" :
                        color === "teal" ? "bg-teal-600" :
                            color === "indigo" ? "bg-indigo-600" :
                                `bg-${color}-600`)}>
            <Icon className="w-4 h-4" />
        </div>
        <h3 className={cn("font-black uppercase text-sm tracking-widest",
            color === "blue" ? "text-blue-900" :
                color === "orange" ? "text-orange-900" :
                    color === "purple" ? "text-purple-900" :
                        color === "teal" ? "text-teal-900" :
                            color === "indigo" ? "text-indigo-900" :
                                `text-${color}-900`)}>{title}</h3>
    </div>
);

const InsightBox = ({ text }: { text: string }) => {
    if (!text) return null;
    return (
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex gap-3 items-start mt-2 print:mt-1 print:p-2">
            <div className="bg-purple-100 text-purple-600 p-1 rounded mt-0.5 shrink-0 print:bg-purple-50 print:text-purple-800">
                <Activity className="w-3 h-3" />
            </div>
            <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-purple-600 block mb-0.5">Insight Clínico</span>
                <p className="text-[11px] text-slate-700 leading-tight italic">{text}</p>
            </div>
        </div>
    );
};

const DataRow = ({ label, value, colorClass = "text-slate-800" }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 group">
        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors tracking-widest">{label}</span>
        <span className={cn("text-[11px] font-black uppercase tracking-tight", colorClass)}>{value}</span>
    </div>
);

// --- COMPONENT ---
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

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const vals = data || form?.getValues() || {};
    const t = vals.tests || {};
    const p = vals.postural || {};
    const hma = vals.hma || {};

    const prof = useMemo(() => {
        let p = Array.isArray(professional) ? professional[0] : professional;
        if (!p && vals?.professional) p = vals.professional;
        if (!p && vals?.professionalInfo) p = vals.professionalInfo;
        if (!p && vals?.content?.professional) p = vals.content.professional;

        const finalProf = p || {};
        const fullName = finalProf.full_name || finalProf.name || finalProf.displayName || (typeof p === 'string' ? p : "");
        const crefito = (finalProf.crefito && finalProf.crefito !== "---") ? finalProf.crefito :
            (finalProf.council_number && finalProf.council_number !== "---") ? finalProf.council_number :
                (finalProf.councilNumber && finalProf.councilNumber !== "---") ? finalProf.councilNumber :
                    null;

        return { ...finalProf, full_name: fullName, crefito };
    }, [professional, vals]);

    useEffect(() => {
        if (open && mounted) {
            const oldTitle = document.title;
            const patientName = patient?.name || patient?.full_name || vals.patientName || "Paciente";
            const date = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
            document.title = `Relatório - ${patientName} ${date}`;
            return () => { document.title = oldTitle; };
        }
    }, [open, mounted, patient, vals.patientName]);

    const radarChartData = useMemo(() => calculateRadarData(vals), [vals]);
    const dfiData = [
        { name: '1 RC', e: t?.dfi?.[0]?.left || 0, d: t?.dfi?.[0]?.right || 0, normal: 1 },
        { name: '0 AM', e: t?.dfi?.[1]?.left || 0, d: t?.dfi?.[1]?.right || 0, normal: 0 },
        { name: '0 FI', e: t?.dfi?.[2]?.left || 0, d: t?.dfi?.[2]?.right || 0, normal: 0 }
    ];

    const painVal = Number(hma.eva?.[0] || vals.eva || 0);
    const painInsight = painVal > 7 ? "A dor elevada impacta a biomecânica protetora." : "Nível de dor permite intervenções mecânicas diretas.";
    const efepTotal = vals.efep?.items || vals.efep || [];
    const funcScore = efepTotal.length > 0 ? Math.round((efepTotal.reduce((a: any, b: any) => a + Number(b.score || 0), 0) / (efepTotal.length * 10)) * 100) : 0;
    const funcInsight = funcScore < 50 ? "Capacidade funcional reduzida." : "Boa funcionalidade basal.";
    const sports = vals.sports || [];
    const loadMin = sports.reduce((acc: any, s: any) => acc + (Number(s.freq) * Number(s.duration)), 0) || 0;
    const activityData = calculateActivityLevel(Number(vals.anthropometry?.weight || 0), sports);
    const weeklyKcal = activityData.weeklyBurn;

    const strengthScore = radarChartData.find(d => d.subject === 'Força')?.A || 0;
    const strengthInsight = strengthScore < 60 ? "Déficit de força identificado." : "Níveis de força adequados.";
    const flexScore = radarChartData.find(d => d.subject === 'Flexibilidade')?.A || 0;
    const flexInsight = flexScore < 60 ? "Restrição de mobilidade identificada." : "Boa mobilidade articular.";

    const legL = Number(t?.ybalance?.legLength?.left || 0);
    const legR = Number(t?.ybalance?.legLength?.right || 0);
    const dysmetry = Math.abs(legL - legR);
    const hasDysmetry = dysmetry >= 5;

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

    const sumFpi = (obj: any) => {
        if (!obj) return 0;
        if (typeof obj === 'number') return obj;
        return Object.values(obj).reduce((a: number, b) => a + (Number(b) || 0), 0) as number;
    };
    const currentFpiL = sumFpi(p?.fpi_left);
    const currentFpiR = sumFpi(p?.fpi_right);

    const getAnalyzedOrRawSquat = (side: 'left' | 'right') => t?.photosAnalyzed?.[`squat_${side}`] || t?.single_squat?.[`photo_${side}`];
    const getAnalyzedOrRawGait = (side: 'left' | 'right', phase: 'initial' | 'mid' | 'terminal') => {
        const analyzedKey = `gait_${side}_${phase === 'initial' ? 'rc' : phase === 'mid' ? 'am' : 'fi'}`;
        return t?.photosAnalyzed?.[analyzedKey] || t?.gait_photos?.[side]?.[phase];
    };

    if (!open || !mounted) return null;

    return (
        <div id="report-wrapper" className="flex flex-col h-full w-full bg-white print:static print:h-auto print:overflow-visible overflow-hidden">
            <div className="h-16 border-b flex items-center justify-between px-6 bg-slate-900 text-white shrink-0 print:hidden no-print">
                <h2 className="font-extrabold text-sm md:text-lg flex items-center gap-3 uppercase tracking-tighter">
                    <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center rotate-3">
                        <Footprints className="w-5 h-5 text-white" />
                    </div>
                    BIOMECÂNICA 5.0
                </h2>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">SAIR</Button>
                    <Button onClick={() => window.print()} className="bg-white text-slate-900 hover:bg-slate-200 font-black h-10 px-6 rounded-xl gap-2 shadow-lg">
                        <Send className="w-4 h-4" /> IMPRIMIR PDF
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <div id="report-scroll-area" className="flex-1 overflow-y-auto bg-slate-100 p-8 print:p-0 print:bg-white custom-scrollbar print:overflow-visible overscroll-contain">
                    <div className="w-full flex flex-col items-center">
                        <div id="report-paper" className="bg-white w-[210mm] shadow-2xl print:shadow-none transition-all duration-300 origin-top overflow-hidden">
                            <div className="p-12 print:p-8">
                                <header className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-10 print:mb-8 print:pb-4 print-color-adjust">
                                    <div className="flex items-center gap-4">
                                        {organization?.logo_url ? (
                                            <div className="w-20 h-20 relative overflow-hidden rounded-[24px] border border-slate-100 shadow-sm print:shadow-none">
                                                <Image src={organization.logo_url} alt="Logo" fill className="object-cover" unoptimized priority />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl print-color-adjust">
                                                {organization?.name?.[0] || professional?.name?.[0] || "A"}
                                            </div>
                                        )}
                                        <div>
                                            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Relatório Biomecânico</h1>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">{organization?.name || "Life Excellence Center"}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Emissão</p>
                                        <p className="text-xl font-black text-slate-800">{new Date().toLocaleDateString('pt-BR')}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Sistema Axiom • PBE Series</p>
                                    </div>
                                </header>

                                <div className="space-y-12">
                                    {visibleSections.quadroGeral && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-3 gap-8 mb-10 print:mb-8">
                                                <div className="col-span-2 bg-[#1e293b] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group print:col-span-2 print-color-adjust">
                                                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] transition-transform group-hover:scale-110 duration-500">
                                                        <Activity className="w-32 h-32" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 block">Avaliação Individualizada</span>
                                                        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">{patient?.name || patient?.full_name || vals.patientName || "Paciente Modelo"}</h2>
                                                        <div className="flex flex-wrap gap-6 text-sm font-bold items-center">
                                                            <span className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 uppercase text-[10px]"><User className="w-3 h-3" /> {patient?.date_of_birth ? calculateAge(patient.date_of_birth) : (vals.patientAge || "--")} Anos</span>
                                                            <span className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 uppercase text-[10px]"><Scale className="w-3 h-3" /> {vals.anthropometry?.weight || "--"} kg</span>
                                                            <span className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 uppercase text-[10px]"><Ruler className="w-3 h-3" /> {vals.anthropometry?.height || "--"} cm</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Bio-Score Geral</span>
                                                    <div className="w-full h-40">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                                                                <PolarGrid gridType="circle" stroke="#e2e8f0" strokeDasharray="3 3" />
                                                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                                                                <Radar name="Biomecânica" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                                    <div className="flex items-center gap-3 mb-2 text-indigo-700">
                                                        <Brain className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Mobilidade</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-600 italic">"{flexInsight}"</p>
                                                </div>
                                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                                    <div className="flex items-center gap-3 mb-2 text-blue-700">
                                                        <Dumbbell className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Força</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-600 italic">"{strengthInsight}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {visibleSections.estatica && (
                                        <div className="space-y-10 page-break">
                                            <SectionHeader title="Estática & Morfometria" icon={Scale} color="blue" />
                                            <div className="grid grid-cols-2 gap-12">
                                                <div>
                                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 border-l-4 border-blue-600 pl-4">Alinhamento</h4>
                                                    <div className="space-y-1">
                                                        <FpiVisualBar label="Pé Esquerdo (FPI-6)" score={currentFpiL} />
                                                        <FpiVisualBar label="Pé Direito (FPI-6)" score={currentFpiR} />
                                                    </div>
                                                    <div className="mt-8 space-y-2">
                                                        <DataRow label="Diferença de Membros" value={`${dysmetry}mm`} colorClass={hasDysmetry ? "text-red-600 font-black" : "text-emerald-600"} />
                                                        <DataRow label="Joalhada (Valgo/Varo)" value={p?.kneeAlignment || "--"} />
                                                    </div>
                                                </div>
                                                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col justify-center">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <Ruler className="w-6 h-6 text-blue-600" />
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Observação</h5>
                                                            <p className="text-[11px] text-slate-600 font-medium">Dados correlacionados com queixa de dor.</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-700 font-bold italic">"{p.obs || "Alinhamento dentro dos padrões."}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {visibleSections.dinamica && (
                                        <div className="page-break space-y-10">
                                            <SectionHeader title="Baropodometria & Dinâmica" icon={Footprints} color="orange" />
                                            <div className="grid grid-cols-2 gap-10">
                                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Pressão (E | D)</h4>
                                                    <div className="flex justify-around items-end h-32 gap-4">
                                                        <div className="w-16 bg-blue-600 rounded-t-xl relative h-[50%]" style={{ height: `${t?.baro?.[0]?.left || 50}%` }}>
                                                            <span className="absolute -top-6 left-0 right-0 text-center text-xs font-black text-blue-700">{t?.baro?.[0]?.left || 50}%</span>
                                                        </div>
                                                        <div className="w-16 bg-red-600 rounded-t-xl relative h-[50%]" style={{ height: `${t?.baro?.[0]?.right || 50}%` }}>
                                                            <span className="absolute -top-6 left-0 right-0 text-center text-xs font-black text-red-700">{t?.baro?.[0]?.right || 50}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-orange-500 pl-4 mb-4">Análise DFI</h4>
                                                    <div className="h-40 w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={dfiData}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 900 }} />
                                                                <YAxis hide domain={[0, 4]} />
                                                                <ReferenceLine y={1} stroke="#cbd5e1" strokeDasharray="3 3" />
                                                                <Line type="monotone" dataKey="e" stroke={COLOR_LEFT_FOOT} strokeWidth={3} dot={{ r: 4, fill: COLOR_LEFT_FOOT }} />
                                                                <Line type="monotone" dataKey="d" stroke={COLOR_RIGHT_FOOT} strokeWidth={3} dot={{ r: 4, fill: COLOR_RIGHT_FOOT }} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {visibleSections.squat && (
                                        <div className="page-break space-y-10">
                                            <SectionHeader title="Estabilidade Unipodal" icon={Activity} color="indigo" />
                                            <div className="grid grid-cols-2 gap-8">
                                                {['left', 'right'].map(side => (
                                                    <div key={side} className="space-y-4">
                                                        <h4 className="text-sm font-black uppercase flex items-center gap-2" style={{ color: side === 'left' ? COLOR_LEFT_FOOT : COLOR_RIGHT_FOOT }}>
                                                            Lado {side === 'left' ? 'Esquerdo' : 'Direito'}
                                                        </h4>
                                                        <div className="bg-slate-50 rounded-xl p-4 space-y-2 shadow-sm">
                                                            <DataRow label="Valgo Dinâmico" value={t?.single_squat?.[`valgus_${side}`] || "Normal"} />
                                                            <DataRow label="Tronco" value={t?.single_squat?.[`trunk_${side}`] || "Normal"} />
                                                        </div>
                                                        {getAnalyzedOrRawSquat(side as any) && (
                                                            <div className="h-64 bg-slate-100 rounded-xl relative overflow-hidden">
                                                                <Image src={getAnalyzedOrRawSquat(side as any)} alt="Squat" fill className="object-contain" unoptimized priority />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {visibleSections.calcado && (
                                        <div className="page-break space-y-8">
                                            <SectionHeader title="Calçado & Minimalismo" icon={Shell} color="teal" />
                                            <div className="grid grid-cols-2 gap-10 items-center">
                                                <div className="bg-slate-900 p-10 rounded-[3rem] text-center space-y-2 print-color-adjust">
                                                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block">Minimalism Index (MI)</span>
                                                    <div className="text-7xl font-black text-white">{finalMinIndex}%</div>
                                                </div>
                                                <div className="bg-teal-50 p-8 rounded-[2.5rem] border border-teal-100 flex flex-col gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-3xl">{finalShoeRec.image}</div>
                                                        <div>
                                                            <h5 className="text-[11px] font-black text-teal-900 uppercase leading-none">{finalShoeRec.text}</h5>
                                                            <p className="text-[11px] text-teal-700 font-bold mt-1">{finalShoeRec.feature}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-700 font-bold italic">"{finalShoeRec.desc}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {visibleSections.exercicios && (
                                        <div className="page-break space-y-10">
                                            <SectionHeader title="Prescrição & Performance" icon={Activity} color="teal" />
                                            {vals.plan?.exercises?.length > 0 && (
                                                <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#1e293b] text-white font-black uppercase text-[10px] print-color-adjust">
                                                            <tr>
                                                                <th className="p-5 text-left">Prescrição</th>
                                                                <th className="p-5 text-center">Volume</th>
                                                                <th className="p-5 text-center">Cadência</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {vals.plan.exercises.map((ex: any, i: number) => (
                                                                <tr key={i}>
                                                                    <td className="p-5 font-black uppercase text-[11px]">{typeof ex === 'string' ? ex : ex.name}</td>
                                                                    <td className="p-5 text-center font-black text-teal-600 bg-teal-50/20">{ex.sets} Séries</td>
                                                                    <td className="p-5 text-center font-bold text-slate-500">{ex.reps || ex.time}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            <footer className="mt-16 pt-12 border-t flex flex-col items-center">
                                                {prof?.digital_signature_url ? (
                                                    <div className="h-24 w-64 relative mb-4">
                                                        <Image src={prof.digital_signature_url} alt="Assinatura" fill className="object-contain" unoptimized priority />
                                                    </div>
                                                ) : <div className="h-20 w-80 border-b-2 border-slate-200 mb-6 flex items-end justify-center"><span className="text-[10px] font-black text-slate-300 uppercase italic">Assinatura Digital</span></div>}
                                                <div className="text-center">
                                                    <h4 className="font-extrabold text-slate-900 uppercase text-lg mb-1">{prof?.full_name || "Dr. Fisioterapeuta"}</h4>
                                                    <div className="flex justify-center gap-4 text-[10px] text-slate-500 font-black uppercase">
                                                        <span>{prof?.council_type || "CREFITO"}: {prof?.crefito || "---"}</span>
                                                        <span>|</span>
                                                        <span>{prof?.phone || "BIOMECÂNICA CLÍNICA"}</span>
                                                    </div>
                                                </div>
                                            </footer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0mm !important; }
                    html, body { visibility: hidden !important; margin: 0 !important; padding: 0 !important; background: white !important; height: 0 !important; overflow: visible !important; }
                    #report-wrapper { visibility: visible !important; display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 210mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; z-index: 2147483647 !important; }
                    #report-wrapper * { visibility: visible !important; }
                    #report-scroll-area { display: block !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; background: white !important; }
                    #report-paper { width: 210mm !important; margin: 0 !important; padding: 0 !important; transform: none !important; display: block !important; font-size: 11pt !important; }
                    .page-break { display: block !important; page-break-after: always !important; break-after: page !important; width: 210mm !important; min-height: 285mm !important; margin: 0 !important; padding: 20mm 15mm !important; background: white !important; position: relative !important; box-sizing: border-box !important; }
                    .page-break:last-child { page-break-after: auto !important; break-after: initial !important; }
                    header { display: flex !important; break-inside: avoid !important; margin-bottom: 20px !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .recharts-responsive-container { width: 170mm !important; height: 280px !important; display: block !important; }
                    img { max-width: 100% !important; object-fit: contain !important; }
                    .no-print { display: none !important; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}
