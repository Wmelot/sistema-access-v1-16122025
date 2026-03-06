"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
    Printer, Brain, Briefcase, Heart, User, Calendar,
    Landmark, ShieldCheck, PenTool, Activity, Scale,
    Thermometer, Wind, Zap, CheckCircle2, AlertTriangle,
    Target, Clock, Timer, MessageSquare, UserCheck, Dumbbell,
    Play, Ruler, Shell, Send, LayoutPanelLeft, Info, Baby
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PBE5UnifiedReportProps {
    open: boolean;
    onClose: () => void;
    data: any;
    patient: any;
    professional: any;
    organization: any;
    specialty: string;
    selectedSections?: string[];
}

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

const SectionHeader = ({ title, icon: Icon, color = "indigo" }: any) => (
    <div className={cn("flex items-center gap-3 border-b-2 pb-2 mb-4 print:mb-2",
        color === "blue" ? "border-blue-200" :
            color === "indigo" ? "border-indigo-200" :
                color === "emerald" ? "border-emerald-200" :
                    color === "amber" ? "border-amber-200" :
                        color === "rose" ? "border-rose-200" :
                            `border-${color}-200`)}>
        <div className={cn("p-1.5 rounded-lg text-white",
            color === "blue" ? "bg-blue-600" :
                color === "indigo" ? "bg-indigo-600" :
                    color === "emerald" ? "bg-emerald-600" :
                        color === "amber" ? "bg-amber-600" :
                            color === "rose" ? "bg-rose-600" :
                                `bg-${color}-600`)}>
            <Icon className="w-4 h-4" />
        </div>
        <h3 className={cn("font-black uppercase text-sm tracking-widest",
            color === "blue" ? "text-blue-900" :
                color === "indigo" ? "text-indigo-900" :
                    color === "emerald" ? "text-emerald-900" :
                        color === "amber" ? "text-amber-900" :
                            color === "rose" ? "text-rose-900" :
                                `text-${color}-900`)}>{title}</h3>
    </div>
);

const ReportCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border rounded-[2rem] p-8 shadow-sm print:shadow-none print:border-slate-100 break-inside-avoid mb-6", className)}>
        {children}
    </div>
);

const DataRow = ({ label, value, icon: Icon, colorClass = "text-slate-900" }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-2">
            {Icon && <Icon className="w-3 h-3 text-slate-300" />}
            {label}
        </span>
        <span className={cn("text-xs font-black uppercase text-right", colorClass)}>
            {value || "--"}
        </span>
    </div>
);

export function PBE5UnifiedReport({
    open,
    onClose,
    data,
    patient,
    professional,
    organization,
    specialty,
    selectedSections = []
}: PBE5UnifiedReportProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const prof = useMemo(() => {
        const p = Array.isArray(professional) ? professional[0] : professional;
        return p || {};
    }, [professional]);

    // Format specialty label
    const specialtyLabel = useMemo(() => {
        const labels: Record<string, string> = {
            neurofuncional_adulto: "Neurofuncional Adulto",
            saude_trabalho: "Saúde do Trabalho & Ergonomia",
            cardio_respiratorio: "Cardiovascular e Respiratório",
            gerontologia: "Gerontologia (AGA)",
            neuropediatria: "Neuropediatria",
            saude_mulher: "Saúde da Mulher",
            ortopedia: "Ortopedia e Esporte",
            advanced_physical: "Avaliação Física Avançada"
        };
        return labels[specialty] || "Avaliação Clínica";
    }, [specialty]);

    if (!open || !mounted) return null;

    const sectionsToRender = selectedSections.length > 0 ? selectedSections : Object.keys(data);

    return createPortal(
        <div id="pbe-report-wrapper" className="fixed inset-0 z-[2147483647] bg-white flex flex-col animate-in fade-in duration-300 print:static print:h-auto print:overflow-visible overflow-hidden">
            {/* TOOLBAR */}
            <div className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-slate-900 text-white shrink-0 print:hidden no-print">
                <h2 className="font-extrabold text-sm md:text-lg flex items-center gap-3 uppercase tracking-tighter">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center rotate-3">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    Relatório PBE 5.0
                </h2>
                <div className="flex gap-2 md:gap-4">
                    <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white px-2 md:px-4 text-xs md:text-sm">Sair</Button>
                    <Button
                        onClick={() => window.print()}
                        className="bg-white text-slate-900 hover:bg-slate-200 font-black shrink-0 text-xs md:text-sm h-10 px-6 rounded-xl gap-2 shadow-lg"
                    >
                        <Printer className="w-4 h-4" /> IMPRIMIR PDF
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* SCROLL AREA */}
                <div
                    id="report-scroll-area"
                    className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 print:p-0 print:bg-white custom-scrollbar print:overflow-visible overflow-x-hidden"
                >
                    <div className="w-full min-h-full py-4 print:py-0 flex flex-col items-center">
                        <div id="report-paper" className="bg-white w-[210mm] min-w-[210mm] shadow-2xl print:shadow-none print:max-w-none print:w-full print:h-auto transition-all duration-300 origin-top p-12 print:p-6 print:transform-none">

                            {/* --- HEADER (IDENTICAL TO PALMILHA 5) --- */}
                            <header className="flex justify-between items-start border-b-4 border-indigo-900 pb-6 mb-10 print:mb-8 print:pb-4 print-color-adjust">
                                <div className="flex items-center gap-4">
                                    {organization?.logo_url ? (
                                        <div className="w-20 h-20 relative overflow-hidden rounded-[24px] border border-slate-100 shadow-sm print:shadow-none">
                                            <Image src={organization.logo_url} alt="Logo" fill className="object-cover" unoptimized priority />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-indigo-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl print-color-adjust">
                                            {organization?.name?.[0] || professional?.name?.[0] || "A"}
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Relatório Clínico</h1>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">{organization?.name || "Advanced Clinical Center"}</p>
                                        <div className="inline-flex mt-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-700 uppercase tracking-widest leading-none">
                                            {specialtyLabel}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Emissão</p>
                                    <p className="text-xl font-black text-slate-800">{new Date().toLocaleDateString('pt-BR')}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Axiom Performance & Evidence</p>
                                </div>
                            </header>

                            {/* --- PATIENT BANNER --- */}
                            <div className="bg-slate-50 border-l-4 border-indigo-600 p-8 mb-10 print:mb-8 rounded-r-[2rem] print:bg-slate-50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform group-hover:scale-110 duration-500"><User className="w-32 h-32 text-indigo-900" /></div>
                                <div className="relative z-10 grid grid-cols-3 gap-12 text-sm">
                                    <div className="col-span-2">
                                        <span className="block text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Paciente</span>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase">{patient?.name || patient?.full_name || data?.patientName || "Paciente Modelo"}</h2>
                                        <div className="flex gap-6 mt-2">
                                            <span className="text-xs font-bold text-indigo-700 uppercase">Idade: {patient?.date_of_birth ? calculateAge(patient.date_of_birth) : (data?.patientAge || "--")} anos</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase">Tel: {patient?.phone || "--"}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Objetivo Clínico</span>
                                        <p className="text-[13px] font-bold text-slate-600 italic leading-snug">
                                            "{data?.anamnesis?.qp || data?.anamnesis?.mainComplaint || "Avaliação diagnóstica e conduta terapêutica."}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* --- MAIN CONTENT (CARD-BASED) --- */}
                            <div className="space-y-6">

                                {/* 1. SECTION: ANAMNESE */}
                                {sectionsToRender.includes('anamnesis') && (
                                    <ReportCard>
                                        <SectionHeader title="Anamnese e Queixa Principal" icon={MessageSquare} color="blue" />
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Impacto da Dor (EVA)</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-5xl font-black text-rose-600 leading-none">{data?.anamnesis?.eva || 0}</div>
                                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(data?.anamnesis?.eva || 0) * 10}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400">/10</span>
                                                    </div>
                                                </div>
                                                <DataRow label="Tempo de Evolução" value={data?.anamnesis?.painDuration} />
                                                <DataRow label="Comportamento" value={data?.anamnesis?.painBehavior} />
                                            </div>
                                            <div className="bg-slate-50 p-6 rounded-2xl italic text-slate-700 text-xs leading-relaxed border border-slate-100">
                                                <span className="text-[9px] font-black text-indigo-400 uppercase block mb-2 opacity-50">Resumo da História</span>
                                                {data?.anamnesis?.hma || "Sem descrição detalhada da história atual."}
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 2. SECTION: CLINICAL HISTORY */}
                                {sectionsToRender.includes('clinical') && (
                                    <ReportCard>
                                        <SectionHeader title="Histórico Clínico e Comorbidades" icon={Activity} color="indigo" />
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Comorbidades Identificadas</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {(data?.clinical?.comorbidities || []).map((c: string) => (
                                                        <span key={c} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg border border-indigo-100">{c}</span>
                                                    )) || <span className="text-xs text-slate-400 italic">Nenhum registro.</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Medicamentos em Uso</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(data?.clinical?.meds || []).map((m: string) => (
                                                        <span key={m} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg">{m}</span>
                                                    )) || <span className="text-xs text-slate-400 italic">Nenhum registro.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 3. SECTION: VITALS (METRICS) */}
                                {sectionsToRender.includes('metrics') && (
                                    <ReportCard>
                                        <SectionHeader title="Biofísica e Sinais Vitais" icon={Heart} color="rose" />
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">PA Sistólica</span>
                                                <span className="text-2xl font-black text-indigo-600">{data?.metrics?.bp_sys || "--"}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase block">mmHg</span>
                                            </div>
                                            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">PA Diastólica</span>
                                                <span className="text-2xl font-black text-indigo-600">{data?.metrics?.bp_dia || "--"}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase block">mmHg</span>
                                            </div>
                                            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">FC Repouso</span>
                                                <span className="text-2xl font-black text-rose-600">{data?.metrics?.hr || "--"}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase block">bpm</span>
                                            </div>
                                            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">SpO2</span>
                                                <span className="text-2xl font-black text-emerald-600">{data?.metrics?.spo2 || "--"}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase block">%</span>
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 4. SECTION: NEURO ADULT */}
                                {sectionsToRender.includes('neuro_adult') && (
                                    <ReportCard>
                                        <SectionHeader title="Status Neurofuncional Adulto" icon={Brain} color="indigo" />
                                        <div className="grid grid-cols-3 gap-6 mb-6">
                                            <div className="bg-slate-900 p-6 rounded-[2.5rem] text-center text-white space-y-1">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block opacity-70">Escala de Glasgow</span>
                                                <p className="text-4xl font-black text-indigo-400">{data?.neuro_adult?.gcs_total || "--"}</p>
                                                <span className="text-[8px] font-bold uppercase opacity-50">Total / 15</span>
                                            </div>
                                            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 text-center space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">NIHSS (Stroke)</span>
                                                <p className="text-4xl font-black text-rose-600">{data?.neuro_adult?.nihss_score || "--"}</p>
                                            </div>
                                            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 text-center space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">MMSE (Mental)</span>
                                                <p className="text-4xl font-black text-emerald-600">{data?.neuro_adult?.mmse_score || "--"}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-3xl grid grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4 mb-2">Coordenação</h4>
                                                <DataRow label="Dedo-Nariz" value={data?.neuro_adult?.coordination?.index_nose === 'N' ? 'Normal' : 'Dismetria/Ataxia'} />
                                                <DataRow label="Calcanhar-Canela" value={data?.neuro_adult?.coordination?.heel_shin === 'N' ? 'Normal' : 'Dismetria/Ataxia'} />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-rose-600 pl-4 mb-2">Reflexos Piramidais</h4>
                                                <DataRow label="Sinal de Babinski" value={data?.neuro_adult?.reflexes?.babinski === '+' ? 'Presente' : 'Ausente'} colorClass={data?.neuro_adult?.reflexes?.babinski === '+' ? "text-rose-600" : "text-emerald-600"} />
                                                <DataRow label="Sinal de Hoffmann" value={data?.neuro_adult?.reflexes?.hoffmann === '+' ? 'Presente' : 'Ausente'} colorClass={data?.neuro_adult?.reflexes?.hoffmann === '+' ? "text-rose-600" : "text-emerald-600"} />
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 5. SECTION: OCCUPATIONAL HEALTH */}
                                {sectionsToRender.includes('occupational_health') && (
                                    <ReportCard>
                                        <SectionHeader title="Saúde do Trabalho & Ergonomia" icon={Briefcase} color="amber" />
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <div className="p-6 bg-slate-900 rounded-[2.5rem] text-center space-y-2 text-white">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block opacity-70">Nível de Risco (NR-17)</span>
                                                    <div className={cn(
                                                        "inline-flex px-6 py-2 rounded-xl text-xs font-black uppercase shadow-lg",
                                                        data?.occupational_health?.risk_level === 'high' || data?.occupational_health?.risk_level === 'critical' ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                                                    )}>
                                                        {data?.occupational_health?.risk_level === 'low' ? 'Baixo Risco' :
                                                            data?.occupational_health?.risk_level === 'moderate' ? 'Risco Moderado' :
                                                                data?.occupational_health?.risk_level === 'high' ? 'Alto Risco' :
                                                                    data?.occupational_health?.risk_level === 'critical' ? 'Risco Crítico' : 'Não Definido'}
                                                    </div>
                                                </div>
                                                <DataRow label="Cargo / Função" value={data?.occupational_health?.job_title} />
                                                <DataRow label="Jornada Diária" value={data?.occupational_health?.daily_hours ? `${data.occupational_health.daily_hours}h` : "--"} />
                                            </div>
                                            <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 text-xs italic text-slate-600 leading-relaxed shadow-sm">
                                                <span className="text-[9px] font-black text-amber-600 uppercase block mb-2 opacity-50">Conclusão Pericial</span>
                                                {data?.occupational_health?.forensic_summary || "Sem parecer pericial detalhado."}
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 6. SECTION: NEUROPEDIA */}
                                {sectionsToRender.includes('neuropedia') && (
                                    <ReportCard>
                                        <SectionHeader title="Avaliação Neuropediátrica" icon={Baby} color="rose" />
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="text-center p-6 bg-slate-900 text-white rounded-[2.5rem] space-y-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase block">AIMS (Score)</span>
                                                <p className="text-4xl font-black text-indigo-400">{data?.neuropedia?.aims_score || "--"}</p>
                                            </div>
                                            <div className="text-center p-6 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] space-y-2">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase block">GMFCS (Nível)</span>
                                                <p className="text-4xl font-black text-indigo-900">{data?.neuropedia?.gmfcs_level || "--"}</p>
                                            </div>
                                            <div className="text-center p-6 bg-rose-50 border border-rose-100 rounded-[2.5rem] space-y-2">
                                                <span className="text-[10px] font-black text-rose-400 uppercase block">MACS (Mão)</span>
                                                <p className="text-4xl font-black text-rose-900">{data?.neuropedia?.macs_level || "--"}</p>
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 7. SECTION: GERONTOLOGY */}
                                {sectionsToRender.includes('gerontology') && (
                                    <ReportCard>
                                        <SectionHeader title="Avaliação Geriátrica Ampla (AGA)" icon={Scale} color="purple" />
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-4 border-l-4 border-purple-600">Cognição e Equilíbrio</h4>
                                                <DataRow label="MEEM (Mini-Mental)" value={data?.gerontology?.meem_score} />
                                                <DataRow label="SPPB (Total)" value={data?.gerontology?.sppb_total} />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-4 border-l-4 border-purple-600">Funcionalidade (AIVD/AVD)</h4>
                                                <DataRow label="Índice de Katz" value={data?.gerontology?.katz_total} />
                                                <DataRow label="Escala de Lawton" value={data?.gerontology?.lawton_score} />
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 8. SECTION: WOMENS HEALTH */}
                                {sectionsToRender.includes('womens_health') && (
                                    <ReportCard>
                                        <SectionHeader title="Saúde da Mulher / Pélvica" icon={ShieldCheck} color="rose" />
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-widest pl-4 border-l-4 border-pink-400">Status Obstétrico</h4>
                                                <DataRow label="Gestações" value={data?.womens_health?.obstetric?.gestations} />
                                                <DataRow label="Partos" value={data?.womens_health?.obstetric?.deliveries} />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-widest pl-4 border-l-4 border-pink-400">Funcionalidade Pélvica (PERFECT)</h4>
                                                <DataRow label="P (Power)" value={data?.womens_health?.perfect?.power} />
                                                <DataRow label="E (Endurance)" value={data?.womens_health?.perfect?.endurance} />
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 9. SECTION: ORTOPEDIA (MOVEMENT / STRENGTH / PROTOCOLS) */}
                                {(sectionsToRender.includes('movement') || sectionsToRender.includes('strength') || sectionsToRender.includes('protocols')) && (
                                    <ReportCard>
                                        <SectionHeader title="Avaliação Musculoesquelética" icon={Dumbbell} color="blue" />
                                        <div className="space-y-6">
                                            {sectionsToRender.includes('movement') && (
                                                <div>
                                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Mobilidade e Movimento</h4>
                                                    <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-x-12 gap-y-2">
                                                        <DataRow label="Qualidade ADM" value={data?.movement?.quality} />
                                                        <DataRow label="Déficit Restritivo" value={data?.movement?.restriction} />
                                                    </div>
                                                </div>
                                            )}
                                            {sectionsToRender.includes('strength') && (
                                                <div>
                                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Força (Dinamometria HHD)</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {(data?.strength?.tests || []).slice(0, 4).map((t: any, i: number) => (
                                                            <DataRow key={i} label={t.name} value={`${t.right || 0}N | ${t.left || 0}N`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 10. SECTION: ADVANCED PHYSICAL ASSESSMENT */}
                                {(sectionsToRender.includes('antro') || sectionsToRender.includes('cardio') || sectionsToRender.includes('strength_advanced')) && (
                                    <ReportCard>
                                        <SectionHeader title="Performance e Avaliação Física Avançada" icon={Dumbbell} color="emerald" />
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Composição (Pineau/US)</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block">% Gordura</span>
                                                        <span className="text-xl font-black text-slate-800">{data?.antro?.fatPercent ? `${Number(data.antro.fatPercent).toFixed(1)}%` : '--'}</span>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase block">FFMI</span>
                                                        <span className="text-xl font-black text-slate-800">{data?.antro?.ffmi ? Number(data.antro.ffmi).toFixed(1) : '--'}</span>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-slate-900 rounded-[2rem] text-center text-white space-y-1">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase block opacity-70">VO2 Máximo Estimado</span>
                                                    <p className="text-4xl font-black text-emerald-400">{data?.cardio?.vo2Result ? Number(data.cardio.vo2Result).toFixed(1) : '--'}</p>
                                                    <span className="text-[8px] font-bold uppercase opacity-50">ml/kg/min</span>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Dinamometria (D-E)</h4>
                                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                                    <DataRow label="Extensão Joelho" value={`${data?.strength_advanced?.kneeExtension_right || 0}N | ${data?.strength_advanced?.kneeExtension_left || 0}N`} />
                                                    <DataRow label="Flexão Joelho" value={`${data?.strength_advanced?.kneeFlexion_right || 0}N | ${data?.strength_advanced?.kneeFlexion_left || 0}N`} />
                                                    <DataRow label="Dorsiflexão" value={`${data?.strength_advanced?.dorsiflexion_right || 0}N | ${data?.strength_advanced?.dorsiflexion_left || 0}N`} />
                                                </div>
                                            </div>
                                        </div>
                                    </ReportCard>
                                )}

                                {/* 8. SECTION: CLINICAL CONDUCT (PLAN) */}
                                {sectionsToRender.includes('plan') && (
                                    <ReportCard className="bg-slate-900 text-white border-0 shadow-xl">
                                        <SectionHeader title="Planejamento e Conduta Terapêutica" icon={PenTool} color="indigo" />
                                        <div className="space-y-8 mt-6">
                                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 italic text-slate-300 text-sm leading-relaxed relative">
                                                <MessageSquare className="absolute -top-3 -left-3 w-8 h-8 text-indigo-500 bg-slate-900 p-1.5 rounded-full border-2 border-slate-800 shadow-lg" />
                                                {data?.plan?.orientations || "Orientação para manutenção das atividades com progressão monitorada de carga e acompanhamento bi-semanal."}
                                            </div>

                                            {data?.plan?.exercises?.length > 0 && (
                                                <div className="space-y-3">
                                                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Activity className="w-3 h-3" /> Exercícios e Estrutura do Treino
                                                    </h5>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {data.plan.exercises.map((ex: any, i: number) => (
                                                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-2xl">
                                                                <span className="text-[11px] font-bold text-slate-200">{typeof ex === 'string' ? ex : ex.name}</span>
                                                                <span className="text-[10px] font-black text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-lg">{ex.sets || 3}x{ex.reps || 12}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ReportCard>
                                )}
                            </div>

                            {/* --- FOOTER (IDENTICAL TO PALMILHA 5) --- */}
                            <footer className="mt-16 pt-12 border-t flex flex-col items-center">
                                {prof?.digital_signature_url ? (
                                    <div className="h-24 w-64 relative mb-4">
                                        <Image src={prof.digital_signature_url} alt="Assinatura" fill className="object-contain" unoptimized priority />
                                    </div>
                                ) : (
                                    <div className="h-20 w-80 border-b-2 border-slate-200 mb-4 opacity-50 flex items-end justify-center">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pb-1 italic">Assinatura do Profissional</span>
                                    </div>
                                )}

                                <div className="text-center">
                                    <h4 className="font-extrabold text-slate-900 uppercase text-lg tracking-tight mb-1">
                                        {prof?.full_name || prof?.name || "Dr(a). Profissional Sênior"}
                                    </h4>
                                    <div className="flex justify-center gap-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        <span>{prof?.council_type || "CREFITO"}: {prof?.council_number || prof?.crefito || "---"}</span>
                                        <span className="text-slate-200">|</span>
                                        <span>Tel/E-mail: {prof?.email || prof?.phone || "Axiom Certified Specialist"}</span>
                                    </div>
                                </div>

                                <div className="mt-12 text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em]">
                                    Axiom Performance & Evidence • Smart Clinical System • {new Date().toLocaleDateString()}
                                </div>
                            </footer>

                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
