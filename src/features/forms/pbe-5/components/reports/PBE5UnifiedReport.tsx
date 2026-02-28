"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    Printer, Brain, Briefcase, Heart, User, Calendar,
    Landmark, ShieldCheck, PenTool, Activity, Scale,
    Thermometer, Wind, Zap, CheckCircle2, AlertTriangle,
    Target, Clock, Timer, MessageSquare, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface PBE5UnifiedReportProps {
    open: boolean;
    onClose: () => void;
    data: any;
    patient: any;
    professional: any;
    organization: any;
    specialty: string;
}

export function PBE5UnifiedReport({
    open,
    onClose,
    data,
    patient,
    professional,
    organization,
    specialty
}: PBE5UnifiedReportProps) {
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = reportRef.current;
        if (!content) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório Axiom - ${patient?.name || "Paciente"}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            .no-print { display: none !important; }
                            body { background: white !important; -webkit-print-color-adjust: exact; }
                            .page-break { page-break-before: always; }
                        }
                    </style>
                </head>
                <body class="bg-white">
                    ${content.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const getSpecialtyLabel = (s: string) => {
        const labels: Record<string, string> = {
            neurofuncional_adulto: "Neurofuncional Adulto",
            saude_trabalho: "Saúde do Trabalho & Ergonomia",
            cardio_respiratorio: "Cardiovascular e Respiratório",
            gerontologia: "Gerontologia (AGA)",
            neuropediatria: "Neuropediatria Sênior"
        };
        return labels[s] || "Avaliação Clínica";
    };

    const getThemeColor = (s: string) => {
        if (s === 'neurofuncional_adulto') return 'text-indigo-600 bg-indigo-50 border-indigo-100';
        if (s === 'saude_trabalho') return 'text-amber-600 bg-amber-50 border-amber-100';
        if (s === 'cardio_respiratorio') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[1000px] h-[90vh] p-0 overflow-hidden flex flex-col rounded-[40px] border-none shadow-2xl">
                {/* Control Bar */}
                <div className="p-4 bg-slate-900 flex justify-between items-center text-white no-print">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center rotate-3">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest">Visualização de Relatório</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">PBE 5.0 Clinical Standard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="text-white hover:bg-white/10 font-bold text-xs" onClick={onClose}>Fechar</Button>
                        <Button onClick={handlePrint} className="bg-white text-slate-900 hover:bg-slate-200 font-black text-xs gap-2 rounded-xl h-10 px-6">
                            <Printer className="h-4 w-4" /> IMPRIMIR PDF
                        </Button>
                    </div>
                </div>

                {/* Printable Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-12 scrollbar-hide" id="axiom-report-content" ref={reportRef}>
                    <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-sm rounded-none print:shadow-none p-16 space-y-12 text-slate-800 font-sans">

                        {/* HEADER */}
                        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-10">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Relatório de Avaliação</h1>
                                    <div className={cn("inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest", getThemeColor(specialty))}>
                                        {getSpecialtyLabel(specialty)}
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Landmark className="h-3 w-3" /> {organization?.name || "Axiom Clinical Center"}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="h-16 w-16 bg-slate-900 rounded-2xl ml-auto mb-4 flex items-center justify-center">
                                    <ShieldCheck className="h-8 w-8 text-white" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter italic">Axiom Performance & Evidence</p>
                            </div>
                        </div>

                        {/* PATIENT BANNER */}
                        <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Paciente</span>
                                        <p className="text-sm font-black text-slate-900 uppercase">{patient?.name || "Paciente não identificado"}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Objetivo Clínico</span>
                                    <p className="text-xs font-bold text-slate-600 italic leading-relaxed">
                                        "{data?.anamnesis?.mainComplaint || "Não informado"}"
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-slate-200 pl-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Profissional Responsável</span>
                                        <p className="text-sm font-black text-slate-900 uppercase">{professional?.name || "Fisioterapeuta Sênior"}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Reg: {professional?.registration_number || "CREFITO/CRM"} • Axiom Certified
                                </p>
                            </div>
                        </div>

                        {/* SPECIALTY CONTENT: NEURO ADULT */}
                        {specialty === 'neurofuncional_adulto' && (
                            <div className="space-y-10">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Brain className="h-5 w-5 text-indigo-600" />
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Status Neurológico e Cognitivo</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 text-center space-y-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Escala de Glasgow</span>
                                            <p className="text-4xl font-black text-indigo-600">{data?.neuro_adult?.gcs_total || "--"}</p>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">Total / 15</span>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 text-center space-y-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Score NIHSS (Stroke)</span>
                                            <p className="text-4xl font-black text-rose-600">{data?.neuro_adult?.nihss_score || "--"}</p>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">Risco Vascular</span>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 text-center space-y-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">MMSE (Mini Mental)</span>
                                            <p className="text-4xl font-black text-emerald-600">{data?.neuro_adult?.mmse_score || "--"}</p>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">Cognição Base</span>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Coordenação e Ataxia</h4>
                                        <div className="space-y-3">
                                            {[
                                                { id: 'index_nose', label: 'Dedo-Nariz' },
                                                { id: 'heel_shin', label: 'Calcanhar-Canela' },
                                                { id: 'diado', label: 'Diadococinésia' }
                                            ].map(test => (
                                                <div key={test.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase">{test.label}</span>
                                                    <div className="flex gap-2">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase",
                                                            data?.neuro_adult?.coordination?.[test.id] === 'N' ? "bg-emerald-600 text-white" :
                                                                data?.neuro_adult?.coordination?.[test.id] === 'D' ? "bg-amber-500 text-white" :
                                                                    data?.neuro_adult?.coordination?.[test.id] === 'A' ? "bg-rose-600 text-white" : "text-slate-300"
                                                        )}>
                                                            {data?.neuro_adult?.coordination?.[test.id] === 'N' ? 'Normal' :
                                                                data?.neuro_adult?.coordination?.[test.id] === 'D' ? 'Dismetria' :
                                                                    data?.neuro_adult?.coordination?.[test.id] === 'A' ? 'Ataxia' : 'Não Avaliado'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-600 pl-4">Sinais Piramidais e Reflexos</h4>
                                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Sinal de Babinski</span>
                                                <span className={cn("text-lg font-black", data?.neuro_adult?.reflexes?.babinski === '+' ? "text-rose-400" : "text-emerald-400")}>
                                                    {data?.neuro_adult?.reflexes?.babinski || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Sinal de Hoffmann</span>
                                                <span className={cn("text-lg font-black", data?.neuro_adult?.reflexes?.hoffmann === '+' ? "text-rose-400" : "text-emerald-400")}>
                                                    {data?.neuro_adult?.reflexes?.hoffmann || "N/A"}
                                                </span>
                                            </div>
                                            <div className="pt-4 border-t border-white/10">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase italic">A presença de sinais piramidais indica comprometimento do Primeiro Neurônio Motor.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* SPECIALTY CONTENT: OCCUPATIONAL HEALTH */}
                        {specialty === 'saude_trabalho' && (
                            <div className="space-y-10">
                                <section className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                            <Briefcase className="h-5 w-5 text-amber-600" /> Riscos Ergonômicos (NR-17)
                                        </h3>
                                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center space-y-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Classificação Proposta</span>
                                            <div className={cn(
                                                "px-8 py-3 rounded-2xl text-white font-black uppercase text-sm shadow-lg",
                                                data?.occupational_health?.risk_level === 'low' ? "bg-emerald-600" :
                                                    data?.occupational_health?.risk_level === 'moderate' ? "bg-amber-500" :
                                                        data?.occupational_health?.risk_level === 'high' ? "bg-orange-600" :
                                                            data?.occupational_health?.risk_level === 'critical' ? "bg-rose-700 underline decoration-2 underline-offset-4" : "bg-slate-300"
                                            )}>
                                                {data?.occupational_health?.risk_level === 'low' ? 'Baixo Risco' :
                                                    data?.occupational_health?.risk_level === 'moderate' ? 'Risco Moderado' :
                                                        data?.occupational_health?.risk_level === 'high' ? 'Alto Risco' :
                                                            data?.occupational_health?.risk_level === 'critical' ? 'Risco Crítico / Alerta' : 'Não Definido'}
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 text-center italic uppercase px-4">
                                                Avaliação baseada no checklist pericial e normas regulamentadoras do MTE.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Fatores Psicossociais
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'stress', label: 'Estresse Ocupacional' },
                                                { id: 'support', label: 'Suporte Social' }
                                            ].map(item => (
                                                <div key={item.id} className="flex justify-between items-center p-4 bg-white border-2 border-slate-100 rounded-2xl">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase">{item.label}</span>
                                                    <span className="text-[10px] font-black text-amber-600">
                                                        {data?.occupational_health?.psychosocial?.hazards?.includes(item.id) ? 'ALTO IMPACTO' : 'CONTROLADO'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-4">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nível de Suporte Necessário</span>
                                            <Progress value={
                                                data?.occupational_health?.psychosocial?.support_level === 'irrisorio' ? 10 :
                                                    data?.occupational_health?.psychosocial?.support_level === 'moderado' ? 50 :
                                                        data?.occupational_health?.psychosocial?.support_level === 'critico' ? 100 : 0
                                            } className="h-3 bg-slate-100" />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* SPECIALTY CONTENT: CARDIO RESPIRATORY */}
                        {specialty === 'cardio_respiratorio' && (
                            <div className="space-y-10">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Heart className="h-5 w-5 text-emerald-600" />
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Status Hemodinâmico e Respiratório</h3>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            { label: 'PA Sistólica', value: data?.cardio_respiratory?.bp_sys, unit: 'mmHg' },
                                            { label: 'PA Diastólica', value: data?.cardio_respiratory?.bp_dia, unit: 'mmHg' },
                                            { label: 'FC Repouso', value: data?.cardio_respiratory?.hr_rest, unit: 'bpm' },
                                            { label: 'SpO2', value: data?.cardio_respiratory?.spo2, unit: '%' }
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-white p-4 rounded-3xl border-2 border-slate-100 text-center space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                                                <p className="text-2xl font-black text-emerald-600">{stat.value || "--"}</p>
                                                <span className="text-[8px] font-bold text-slate-500 uppercase">{stat.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="grid grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-600 pl-4">Classificação Funcional</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">mMRC (Dispneia)</span>
                                                <p className="text-3xl font-black text-slate-900">G{data?.cardio_respiratory?.mmrc_grade || "-"}</p>
                                            </div>
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NYHA (Classe)</span>
                                                <p className="text-3xl font-black text-slate-900">{data?.cardio_respiratory?.nyha_class || "-"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Tolerância ao Esforço</h4>
                                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Distância TC6M</span>
                                                <span className="text-lg font-black text-emerald-400">
                                                    {data?.cardio_respiratory?.tc6m_dist ? `${data.cardio_respiratory.tc6m_dist} m` : "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">DASI Score (METs)</span>
                                                <span className="text-lg font-black text-emerald-400">
                                                    {data?.cardio_respiratory?.dasi_score || "N/A"}
                                                </span>
                                            </div>
                                            <div className="pt-4 border-t border-white/10 text-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-2">Borg Final (CR10)</span>
                                                <div className="flex justify-center gap-1">
                                                    {['0', '1', '3', '5', '7', '10'].map(v => (
                                                        <div key={v} className={cn(
                                                            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black",
                                                            data?.cardio_respiratory?.borg_final === v ? "bg-emerald-500 text-white" : "bg-white/10 text-white/30"
                                                        )}>{v}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* COMMON: CLINICAL VERDICT */}
                        <section className="space-y-6 pt-10 border-t-2 border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white rotate-3">
                                    <PenTool className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Síntese Neurofuncional / Parecer</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fundamentação Clínica e Prognóstico</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 italic text-slate-700 leading-relaxed text-sm">
                                {data?.neuro_adult?.clinical_verdict || data?.occupational_health?.clinical_verdict || data?.cardio_respiratory?.clinical_verdict || "Nenhum parecer redigido até o momento."}
                            </div>
                        </section>

                        {/* FOOTER */}
                        <div className="pt-20 text-center space-y-6 opacity-30 no-print">
                            <div className="flex justify-center gap-12">
                                <div className="space-y-1">
                                    <div className="h-10 w-24 bg-slate-200 rounded-lg mx-auto mb-2 opacity-50 flex items-center justify-center font-black text-[10px] text-slate-400 uppercase tracking-widest italic">Assinatura</div>
                                    <div className="border-t border-slate-400 w-48 mx-auto"></div>
                                    <p className="text-[9px] font-black uppercase text-slate-500">{professional?.name}</p>
                                </div>
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                                Axiom Clinical Reporting System • Gerado em {new Date().toLocaleString()}
                            </p>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
