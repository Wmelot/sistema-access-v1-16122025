"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Heart, Activity, Wind, Thermometer, Info, Plus,
    Zap, Ruler, Scale, RefreshCw, Layers, Gauge,
    Stethoscope, Clock, Footprints, AlertCircle, Timer, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CardioRespiratorioAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

const BORG_CR10 = [
    { value: "0", label: "0 - Repouso Total", color: "bg-emerald-500" },
    { value: "0.5", label: "0.5 - Extremamente Leve", color: "bg-emerald-400" },
    { value: "1", label: "1 - Muito Leve", color: "bg-emerald-300" },
    { value: "2", label: "2 - Leve", color: "bg-yellow-400" },
    { value: "3", label: "3 - Moderado", color: "bg-yellow-500" },
    { value: "4", label: "4 - Um pouco Pesado", color: "bg-orange-400" },
    { value: "5", label: "5 - Pesado", color: "bg-orange-500" },
    { value: "7", label: "7 - Muito Pesado", color: "bg-rose-500" },
    { value: "10", label: "10 - Exaustão Máxima", color: "bg-slate-900" },
];

const MMRC_SCALE = [
    { value: "0", label: "Grau 0", desc: "Falta de ar apenas em exercício intenso." },
    { value: "1", label: "Grau 1", desc: "Falta de ar ao andar rápido ou subir ladeira leve." },
    { value: "2", label: "Grau 2", desc: "Anda mais devagar que pessoas da mesma idade." },
    { value: "3", label: "Grau 3", desc: "Para para respirar após caminhar ~100 metros." },
    { value: "4", label: "Grau 4", desc: "Falta de ar ao sair de casa ou trocar de roupa." },
];

const AUSCULTA_ADVENTICIOS = [
    { id: "estertores", label: "Estertores Finos/Grossos", info: "Presença de líquido ou abertura de alvéolos." },
    { id: "sibilos", label: "Sibilos", info: "Broncoespasmo ou obstrução de via aérea." },
    { id: "roncos", label: "Roncos", info: "Presença de secreção em grandes vias." },
    { id: "estridor", label: "Estridor", info: "Obstrução de via aérea superior (Emergência)." },
];

export function CardioRespiratorioAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: CardioRespiratorioAccordionProps) {
    const { watch, setValue, register } = useFormContext();
    const [activeTab, setActiveTab] = useState("vitals");

    const cardioData = watch('cardio_respiratory') || {};
    const isFilled = isSectionFilled('cardio_respiratory');

    const InfoIcon = ({ content }: { content: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-emerald-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 bg-slate-900 text-white rounded-xl border-none shadow-2xl">
                    <p className="text-[10px] font-bold leading-relaxed">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <AccordionItem
            value="cardio_respiratory"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'cardio_respiratory' ? 'bg-white ring-2 ring-emerald-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'cardio_respiratory' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600")}>
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'cardio_respiratory' ? "text-slate-900" : "text-slate-600")}>Cardiovascular e Respiratório</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Teste de 6 Minutos, Borg, Ausculta e Cirtometria</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        MONITORIZAÇÃO ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-10 overflow-x-auto pb-2 scrollbar-hide">
                            <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto gap-1">
                                <TabsTrigger value="vitals" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Thermometer className="w-3.5 h-3.5 mr-2" /> Sinais & Ausculta
                                </TabsTrigger>
                                <TabsTrigger value="effort" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Footprints className="w-3.5 h-3.5 mr-2" /> Teste de Esforço (6m)
                                </TabsTrigger>
                                <TabsTrigger value="expand" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Ruler className="w-3.5 h-3.5 mr-2" /> Cirtometria
                                </TabsTrigger>
                                <TabsTrigger value="dyspnea" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Wind className="w-3.5 h-3.5 mr-2" /> Escalas de Dispneia
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* VITALS & AUSCULTATION TAB */}
                        <TabsContent value="vitals" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                            <Gauge className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Monitorização Hemodinâmica
                                            <InfoIcon content="Valores em repouso basal. Essencial para segurança clínica antes do esforço." />
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'bp_sys', label: 'PA Sistólica', unit: 'mmHg' },
                                            { id: 'bp_dia', label: 'PA Diastólica', unit: 'mmHg' },
                                            { id: 'hr_rest', label: 'Freq. Cardíaca', unit: 'bpm' },
                                            { id: 'spo2_rest', label: 'Sat. O2 (SpO2)', unit: '%' },
                                            { id: 'rr_rest', label: 'Freq. Resp.', unit: 'irpm' },
                                        ].map(v => (
                                            <div key={v.id} className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-500 uppercase px-1">{v.label}</Label>
                                                <div className="relative">
                                                    <Input
                                                        {...register(`cardio_respiratory.vitals.${v.id}`)}
                                                        className="h-12 bg-slate-50 border-transparent rounded-xl text-center font-black text-lg focus:bg-white focus:ring-emerald-500"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400">{v.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                            <Stethoscope className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Ausculta Pulmonar
                                            <InfoIcon content="Pesquisa de sons adventícios. Marque o que for encontrado." />
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        {AUSCULTA_ADVENTICIOS.map(son => (
                                            <div key={son.id} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-all hover:bg-white hover:border-blue-200">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                        {son.label} <InfoIcon content={son.info} />
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-inner border border-slate-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue(`cardio_respiratory.ausculta.${son.id}`, 'absent')}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                            cardioData?.ausculta?.[son.id] === 'absent' ? "bg-slate-200 text-slate-600" : "bg-transparent text-slate-400"
                                                        )}
                                                    > Ausente </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue(`cardio_respiratory.ausculta.${son.id}`, 'present')}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                            cardioData?.ausculta?.[son.id] === 'present' ? "bg-blue-600 text-white shadow-md" : "bg-transparent text-slate-400"
                                                        )}
                                                    > Presente </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* EFFORT TEST TAB */}
                        <TabsContent value="effort" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <Card className="p-10 rounded-[3.5rem] border-slate-100 bg-white shadow-xl max-w-5xl mx-auto space-y-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Clock className="w-32 h-32 text-emerald-900" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row gap-12">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                <Timer className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                                    Teste de Caminhada de 6 Min (TC6M)
                                                    <InfoIcon content="Padrão-ouro sub-máximo para avaliação da capacidade funcional aeróbica." />
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Protocolo ATS/ERS</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Distância Percorrida</Label>
                                                <div className="relative">
                                                    <Input
                                                        {...register('cardio_respiratory.tc6m.distance')}
                                                        className="h-16 bg-emerald-50/50 border-emerald-100 rounded-2xl text-center font-black text-2xl text-emerald-900 focus:bg-white focus:ring-emerald-500 pl-4 pr-12"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400">METROS</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Sat. O2 Final</Label>
                                                <div className="relative">
                                                    <Input
                                                        {...register('cardio_respiratory.tc6m.spo2_final')}
                                                        className="h-16 bg-slate-50 border-transparent rounded-2xl text-center font-black text-2xl text-slate-800 focus:bg-white focus:ring-emerald-500 pl-4 pr-10"
                                                        placeholder="98"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                                                Percepção de Esforço (Borg CR10)
                                                <InfoIcon content="Escala modificada para quantificar a falta de ar e cansaço muscular." />
                                            </Label>
                                            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                                                {BORG_CR10.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setValue('cardio_respiratory.tc6m.borg', opt.value)}
                                                        className={cn(
                                                            "p-2 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all",
                                                            cardioData?.tc6m?.borg === opt.value
                                                                ? cn("border-emerald-600 scale-105 shadow-md", opt.color, "text-white")
                                                                : "border-transparent bg-slate-50 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <span className="text-xs font-black">{opt.value}</span>
                                                        <span className="text-[6px] font-black leading-none text-center uppercase">{opt.label.split('-')[1] || opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* CIRTOMETRY TAB */}
                        <TabsContent value="expand" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm max-w-4xl mx-auto space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                        <Ruler className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        Cirtometria (Mecânica Respiratória)
                                        <InfoIcon content="Mensuração do perímetro torácico/abdominal em Inspiração e Expiração máxima." />
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { id: 'axilar', label: 'Cirtometria Axilar', info: 'Avalia expansão apical.' },
                                        { id: 'xifoide', label: 'Cirtometria Xifoide', info: 'Avalia expansão média/diafragmática.' },
                                        { id: 'abdominal', label: 'Cirtometria Abdominal', info: 'Avalia padrão abdominal.' },
                                    ].map(item => (
                                        <div key={item.id} className="space-y-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:border-indigo-200">
                                            <div className="flex items-center justify-between px-1">
                                                <Label className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                    {item.label} <InfoIcon content={item.info} />
                                                </Label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block text-center">INS</span>
                                                    <Input {...register(`cardio_respiratory.cirto.${item.id}_ins`)} className="h-10 rounded-xl text-center font-black" placeholder="0" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block text-center">EXP</span>
                                                    <Input {...register(`cardio_respiratory.cirto.${item.id}_exp`)} className="h-10 rounded-xl text-center font-black" placeholder="0" />
                                                </div>
                                            </div>
                                            {(() => {
                                                const ins = parseFloat(watch(`cardio_respiratory.cirto.${item.id}_ins`));
                                                const exp = parseFloat(watch(`cardio_respiratory.cirto.${item.id}_exp`));
                                                if (ins && exp) {
                                                    const diff = (ins - exp).toFixed(1);
                                                    return (
                                                        <div className="pt-2 flex items-center justify-between">
                                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Índice Mobilidade:</span>
                                                            <Badge className="bg-indigo-600 text-white font-black text-[10px] rounded-lg">{diff} cm</Badge>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </TabsContent>

                        {/* DYSPNEA SCALES TAB */}
                        <TabsContent value="dyspnea" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                            <Wind className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                            Escala mMRC (Dispneia)
                                            <InfoIcon content="modified Medical Research Council. Escala global para impacto da falta de ar nas AVDs." />
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {MMRC_SCALE.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setValue('cardio_respiratory.mmrc', opt.value)}
                                                className={cn(
                                                    "p-5 rounded-2xl border text-left transition-all flex items-center justify-between gap-4",
                                                    neuroData.mmrc === opt.value
                                                        ? "bg-orange-600 border-orange-600 text-white shadow-xl"
                                                        : "bg-slate-50 border-slate-100 text-slate-700 hover:border-orange-200"
                                                )}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                                    <span className={cn("text-[9px] font-bold leading-tight", cardioData.mmrc === opt.value ? "text-orange-100" : "text-slate-400")}>{opt.desc}</span>
                                                </div>
                                                {cardioData.mmrc === opt.value && <Zap className="w-4 h-4 fill-white animate-bounce" />}
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm bg-indigo-950 text-white space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black uppercase text-[10px] tracking-widest text-indigo-300">CAT Score (COPD Assessment Test)</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Impacto da DPOC no bem estar. Avalia tosse, secreção, aperto no peito, sono e energia.</p>
                                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Score Bruto</span>
                                            <span className="text-3xl font-black text-white">{(cardioData.cat_score || 0)} <span className="text-sm opacity-50">/ 40</span></span>
                                        </div>
                                        <Button
                                            onClick={() => { setValue('conduct.extraQuestionnaire', 'cat_copd'); setIsAssessmentModalOpen?.(true); }}
                                            className="bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-500 transition-all px-8 h-12"
                                        > ABRIR CAT COMPLETO </Button>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="bg-emerald-50/50 p-8 flex items-center gap-5 border-t border-emerald-100">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                        <TrendingUp className="h-6 w-6 text-emerald-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.1em] mb-1">Dica Clínica Axiom (Ref. ATS/ERS)</p>
                        <p className="text-[10px] font-bold text-emerald-900/60 leading-relaxed uppercase tracking-tighter">
                            A dessaturação considerável no TC6M ({">"} {'4%'}) é um forte marcador de desfechos negativos. Monitorar a queda da SpO2 é tão crucial quanto a distância percorrida.
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
