"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Users, Activity, Brain, ClipboardCheck, Info, UserCheck,
    Heart, Star, Ruler, Scale, RefreshCw, Layers, ShieldCheck,
    Accessibility, Briefcase, Zap, Search, Hourglass, Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface GerontologyAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

const KATZ_ITEMS = [
    { id: 'bathing', label: 'Banho' },
    { id: 'dressing', label: 'Vestir-se' },
    { id: 'toileting', label: 'Uso do Banheiro' },
    { id: 'transferring', label: 'Transferência' },
    { id: 'continence', label: 'Continência' },
    { id: 'feeding', label: 'Alimentação' },
];

export function GerontologyAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: GerontologyAccordionProps) {
    const { watch, setValue, register } = useFormContext();
    const [activeTab, setActiveTab] = useState("fragility");

    const geroData = watch('gerontology') || {};
    const isFilled = isSectionFilled('gerontology');

    const InfoIcon = ({ content }: { content: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-purple-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 bg-slate-900 text-white rounded-xl border-none shadow-2xl">
                    <p className="text-[10px] font-bold leading-relaxed">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <AccordionItem
            value="gerontology"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'gerontology' ? 'bg-white ring-2 ring-purple-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'gerontology' ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600")}>
                        <Hourglass className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'gerontology' ? "text-slate-900" : "text-slate-600")}>Gerontologia (AGA)</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Avaliação Geriátrica Ampla, Fragilidade e Cognição</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        AVALIAÇÃO ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-10 overflow-x-auto pb-2 scrollbar-hide">
                            <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto gap-1">
                                <TabsTrigger value="fragility" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Zap className="w-3.5 h-3.5 mr-2" /> Fragilidade & Quedas
                                </TabsTrigger>
                                <TabsTrigger value="cognition" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Brain className="w-3.5 h-3.5 mr-2" /> Cognição & Humor
                                </TabsTrigger>
                                <TabsTrigger value="function" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Accessibility className="w-3.5 h-3.5 mr-2" /> Funcionalidade (AVD)
                                </TabsTrigger>
                                <TabsTrigger value="giants" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Landmark className="w-3.5 h-3.5 mr-2" /> 5 Is da Geriatria
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* FRAGILITY & FALLS TAB */}
                        <TabsContent value="fragility" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Triagem de Sarcopenia (SARC-F)
                                            <InfoIcon content="Screening rápido para identificação de risco de sarcopenia em idosos." />
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { id: 'strength', label: 'Força (Carregar 5kg)', info: 'Dificuldade em levantar/carregar pesos.' },
                                            { id: 'walking', label: 'Caminhada (Atravessar sala)', info: 'Dificuldade em caminhar.' },
                                            { id: 'rising', label: 'Levantar da Cadeira', info: 'Dificuldade em transferir de sentado para pé.' },
                                            { id: 'stairs', label: 'Subir Escadas', info: 'Dificuldade em subir 10 degraus.' },
                                            { id: 'falls', label: 'Quedas no último ano', info: 'Número de quedas reportadas.' },
                                        ].map(item => (
                                            <div key={item.id} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-all hover:bg-white hover:border-purple-200">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                        {item.label} <InfoIcon content={item.info} />
                                                    </span>
                                                </div>
                                                <div className="flex gap-1.5 bg-white rounded-xl p-1 shadow-inner border border-slate-100">
                                                    {[0, 1, 2].map(val => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setValue(`gerontology.sarc_f.${item.id}`, val)}
                                                            className={cn(
                                                                "w-8 h-8 rounded-lg text-[9px] font-black uppercase transition-all",
                                                                geroData?.sarc_f?.[item.id] === val ? "bg-purple-600 text-white shadow-md" : "bg-transparent text-slate-400"
                                                            )}
                                                        > {val} </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-purple-900 rounded-[1.5rem] text-white">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Score SARC-F:</span>
                                        <span className="text-xl font-black">
                                            {(Object.values(geroData.sarc_f || {}) as number[]).reduce((a, b) => a + (Number(b) || 0), 0)} / 10
                                        </span>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                            <Scale className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Equilíbrio e Performance (SPPB)
                                            <InfoIcon content="Short Physical Performance Battery. Padrão-ouro para prognóstico de fragilidade." />
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Velocidade de Marcha (4m)</span>
                                                <div className="relative">
                                                    <Input {...register('gerontology.sppb_walk')} className="w-20 h-10 rounded-lg text-center font-black" placeholder="0.0" />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300">S</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Sentar e Levantar (5x)</span>
                                                <div className="relative">
                                                    <Input {...register('gerontology.sppb_stand')} className="w-20 h-10 rounded-lg text-center font-black" placeholder="0.0" />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300">S</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => { setValue('conduct.extraQuestionnaire', 'sppb_gero'); setIsAssessmentModalOpen?.(true); }}
                                            className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                                        > INICIAR SPPB COMPLETO </Button>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* COGNITION & MOOD TAB */}
                        <TabsContent value="cognition" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                            <Brain className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Rastreio Cognitivo (MEEM)
                                            <InfoIcon content="Mini-Exame do Estado Mental. Rastreio básico de déficit cognitivo." />
                                        </h4>
                                    </div>
                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Score Total obtido</span>
                                            <span className="text-3xl font-black text-slate-800">{(geroData.meem_score || 0)} <span className="text-sm opacity-30">/ 30</span></span>
                                        </div>
                                        <Button
                                            onClick={() => { setValue('conduct.extraQuestionnaire', 'meem_gero'); setIsAssessmentModalOpen?.(true); }}
                                            className="bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all h-12 px-6"
                                        > ABRIR MEEM </Button>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase text-center italic">Escolaridade deve ser considerada na interpretação.</p>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Depressão Geriátrica (GDS-15)
                                            <InfoIcon content="Geriatric Depression Scale. Rastreio de humor no idoso." />
                                        </h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-rose-900 tracking-widest">Identificou risco de Depressão?</span>
                                            <div className="flex gap-2">
                                                {['SIM', 'NÃO'].map(res => (
                                                    <button
                                                        key={res}
                                                        type="button"
                                                        onClick={() => setValue(`gerontology.depression_risk`, res)}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                                            geroData.depression_risk === res ? "bg-rose-600 text-white" : "bg-white text-rose-400 border border-rose-100"
                                                        )}
                                                    > {res} </button>
                                                ))}
                                            </div>
                                        </div>
                                        <Textarea {...register('gerontology.mood_notes')} placeholder="Observações sobre comportamento, iniciativa e engajamento..." className="bg-slate-50 border-none rounded-2xl min-h-[100px] text-[11px] p-5" />
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* FUNCTIONALITY (ADL) TAB */}
                        <TabsContent value="function" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-5xl mx-auto space-y-8">
                                <Card className="p-10 rounded-[3.5rem] bg-indigo-950 text-white shadow-xl space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Accessibility className="w-32 h-32 text-indigo-400" />
                                    </div>
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                                    <Accessibility className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black uppercase text-xs tracking-widest text-indigo-200">Índice de Katz (AVD Básicas)</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Independência em cuidados diários essenciais</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black uppercase text-indigo-300">Independência</span>
                                                <span className="text-2xl font-black">{Object.values(geroData.katz || {}).filter(v => v === 'indep').length} / 6</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                            {KATZ_ITEMS.map(item => (
                                                <div key={item.id} className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                                                    <span className="text-[9px] font-black uppercase text-center text-indigo-200">{item.label}</span>
                                                    <div className="flex flex-col gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setValue(`gerontology.katz.${item.id}`, 'indep')}
                                                            className={cn(
                                                                "h-7 rounded-lg text-[8px] font-black uppercase transition-all",
                                                                geroData?.katz?.[item.id] === 'indep' ? "bg-emerald-600 text-white" : "bg-white/10 text-slate-400"
                                                            )}
                                                        > Independ. </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setValue(`gerontology.katz.${item.id}`, 'dep')}
                                                            className={cn(
                                                                "h-7 rounded-lg text-[8px] font-black uppercase transition-all",
                                                                geroData?.katz?.[item.id] === 'dep' ? "bg-rose-600 text-white" : "bg-white/10 text-slate-400"
                                                            )}
                                                        > Depend. </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row gap-6 items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-indigo-500/20 text-indigo-300 border-none font-black text-[9px] px-3 py-1">LAWTON (INSTRUMENTAIS)</Badge>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Telefone, Compras, Finanças, Medicação...</p>
                                            </div>
                                            <Button
                                                onClick={() => { setValue('conduct.extraQuestionnaire', 'lawton_gero'); setIsAssessmentModalOpen?.(true); }}
                                                className="bg-white text-indigo-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all h-12 px-8 shadow-xl"
                                            > ABRIR LAWTON COMPLETO </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* 5 Is OF GERIATRICS TAB */}
                        <TabsContent value="giants" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="p-6 bg-slate-900 rounded-[2.5rem] border border-slate-800 text-white flex items-center gap-4 shadow-xl">
                                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
                                        <Landmark className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-indigo-400 uppercase text-[10px] tracking-widest">Os Gigantes da Geriatria (Os 5 Is)</h4>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">As grandes síndromes geriátricas para monitorização clínica constante.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { id: 'instability', label: 'Instabilidade Postural', info: 'Risco iminente de quedas e fraturas.' },
                                        { id: 'immobility', label: 'Imobilidade', info: 'Restrição ao leito ou cadeira, risco de LPP.' },
                                        { id: 'incontinence', label: 'Incontinência', info: 'Vesical ou fecal, impacto na higiene e social.' },
                                        { id: 'insufficiency', label: 'Insuficiência Cognitiva', info: 'Déficits de memória, julgamento ou demências.' },
                                        { id: 'iatrogeny', label: 'Iatrogenia / Polifarmácia', info: 'Efeitos colaterais de excesso de medicamentos.' },
                                    ].map(gigante => (
                                        <div key={gigante.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-100 transition-all group">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2 group-hover:text-indigo-600">
                                                    {gigante.label} <InfoIcon content={gigante.info} />
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{gigante.info}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {['AUSHENTE', 'LEVE', 'MODERADO', 'GRAVE'].map(res => (
                                                    <button
                                                        key={res}
                                                        type="button"
                                                        onClick={() => setValue(`gerontology.giants.${gigante.id}`, res)}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                                            geroData?.giants?.[gigante.id] === res
                                                                ? "bg-indigo-600 text-white shadow-lg"
                                                                : "bg-slate-50 text-slate-400 border border-slate-100"
                                                        )}
                                                    > {res.replace('AUSHENTE', 'AUSENTE')} </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="bg-purple-50/50 p-8 flex items-center gap-5 border-t border-purple-100">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-purple-100 shadow-sm shrink-0">
                        <UserCheck className="h-6 w-6 text-purple-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-purple-700 uppercase tracking-[0.1em] mb-1">Dica de Especialista Axiom</p>
                        <p className="text-[10px] font-bold text-purple-900/60 leading-relaxed uppercase tracking-tighter">
                            Na Gerontologia, o objetivo é a preservação da autonomia. Pequenos ganhos na marcha ou no equilíbrio têm um efeito cascata positivo na saúde mental e social do idoso.
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
