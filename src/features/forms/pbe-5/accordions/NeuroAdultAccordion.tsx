"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Brain, Activity, Zap, ClipboardCheck, Info, UserCheck,
    Move, Scale, RefreshCw, Layers, ShieldAlert, Target,
    Footprints, Accessibility, Gauge, History, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface NeuroAdultAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

const ASHWORTH_MODIFIED = [
    { value: "0", label: "0 - Normal", desc: "Sem aumento de tônus." },
    { value: "1", label: "1 - Leve", desc: "Sensação de 'gancho' no final da ADM." },
    { value: "1+", label: "1+ - Leve+", desc: "Aumento de tônus em menos da metade da ADM." },
    { value: "2", label: "2 - Moderado", desc: "Aumento marcante, mas movimento passivo fácil." },
    { value: "3", label: "3 - Grave", desc: "Movimento passivo difícil." },
    { value: "4", label: "4 - Rigidez", desc: "Articulação rígida em flexão ou extensão." },
];

const MODIFIED_RANKIN = [
    { value: "0", label: "0 - Sem sintomas", desc: "Nenhum sintoma de AVC." },
    { value: "1", label: "1 - Incapacidade insignificante", desc: "Sintomas sem impacto na vida diária." },
    { value: "2", label: "2 - Incapacidade leve", desc: "Incapaz de atividades prévias, mas cuida de si." },
    { value: "3", label: "3 - Incapacidade moderada", desc: "Requer ajuda, mas anda sem assistência." },
    { value: "4", label: "4 - Incapacidade moderadamente grave", desc: "Incapaz de andar sem ajuda e de cuidar de si." },
    { value: "5", label: "5 - Incapacidade grave", desc: "Acamado, incontinente, requer cuidados constantes." },
];

export function NeuroAdultAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: NeuroAdultAccordionProps) {
    const { watch, setValue, register } = useFormContext();
    const [activeTab, setActiveTab] = useState("clinical");

    const neuroData = watch('neuro_adult') || {};
    const isFilled = isSectionFilled('neuro_adult');

    const InfoIcon = ({ content }: { content: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 bg-slate-900 text-white rounded-xl border-none shadow-2xl">
                    <p className="text-[10px] font-bold leading-relaxed">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <AccordionItem
            value="neuro_adult"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'neuro_adult' ? 'bg-white ring-2 ring-indigo-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'neuro_adult' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600")}>
                        <Brain className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'neuro_adult' ? "text-slate-900" : "text-slate-600")}>Neurofuncional Adulto</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Berg, Fugl-Meyer, TUG e Exame Neurológico</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        AVALIAÇÃO ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-10 overflow-x-auto pb-2 scrollbar-hide">
                            <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto gap-1">
                                <TabsTrigger value="clinical" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <ClipboardCheck className="w-3.5 h-3.5 mr-2" /> Exame Clínico
                                </TabsTrigger>
                                <TabsTrigger value="balance" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Scale className="w-3.5 h-3.5 mr-2" /> Equilíbrio/Mobilidade
                                </TabsTrigger>
                                <TabsTrigger value="function" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Accessibility className="w-3.5 h-3.5 mr-2" /> Funcionalidade
                                </TabsTrigger>
                                <TabsTrigger value="cif" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <History className="w-3.5 h-3.5 mr-2" /> Contexto (CIF)
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* CLINICAL EXAM TAB */}
                        <TabsContent value="clinical" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                {/* Tone / Spasticity */}
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Tônus Muscular (Ashworth)
                                            <InfoIcon content="Escala de Ashworth Modificada. Avalie a resistência ao movimento passivo rápido." />
                                        </h4>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { id: 'tone_upper', label: 'Membros Superiores' },
                                            { id: 'tone_lower', label: 'Membros Inferiores' }
                                        ].map(target => (
                                            <div key={target.id} className="grid grid-cols-2 gap-4">
                                                {['Esq', 'Dir'].map(side => (
                                                    <div key={side} className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-500 uppercase px-1">{target.label} ({side})</Label>
                                                        <Select
                                                            value={neuroData[`${target.id}_${side.toLowerCase()}`]}
                                                            onValueChange={(v) => setValue(`neuro_adult.${target.id}_${side.toLowerCase()}`, v)}
                                                        >
                                                            <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase">
                                                                <SelectValue placeholder="0" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ASHWORTH_MODIFIED.map(opt => (
                                                                    <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase py-2">
                                                                        {opt.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Coordination & Synergy */}
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                                            <RefreshCw className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Coordenação e Sinergia
                                            <InfoIcon content="Avaliação Fugl-Meyer e testes cerebelares clássicos." />
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'index_nose', label: 'Índex-Nariz', info: 'Avalia dismetria cerebelar.' },
                                            { id: 'heel_shin', label: 'Calcanhar-Joelho', info: 'Avalia ataxia de MMII.' },
                                            { id: 'diado', label: 'Diadococinesia', info: 'Movimentos rápidos alternados.' },
                                        ].map(test => (
                                            <div key={test.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                        {test.label} <InfoIcon content={test.info} />
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {['N', 'A', 'S'].map(res => (
                                                        <button
                                                            key={res}
                                                            type="button"
                                                            onClick={() => setValue(`neuro_adult.coordination.${test.id}`, res)}
                                                            className={cn(
                                                                "w-8 h-8 rounded-lg text-[9px] font-black uppercase transition-all",
                                                                neuroData?.coordination?.[test.id] === res ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-400 border border-slate-100"
                                                            )}
                                                        > {res} </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-[8px] font-bold text-slate-400 uppercase text-center mt-2 px-2">
                                            N: Normal | A: Alterado | S: Severo
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* BALANCE & MOBILITY TAB */}
                        <TabsContent value="balance" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
                                {/* Berg Balance Scale Summary */}
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-xl bg-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Scale className="w-24 h-24 text-indigo-900" />
                                    </div>
                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                <Scale className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-widest flex items-center gap-2">
                                                    Berg Balance Scale (BBS)
                                                    <InfoIcon content="Escala de Equilíbrio de Berg. 14 itens avaliando equilíbrio estático e dinâmico." />
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Padrão-ouro predictivo de quedas</p>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex flex-col items-center">
                                            <span className="text-[9px] font-black uppercase text-indigo-900/60 tracking-widest mb-1">Score Total</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-indigo-900">{neuroData.berg_score || 0}</span>
                                                <span className="text-sm font-black text-indigo-300">/ 56</span>
                                            </div>
                                            <div className="mt-4 w-full">
                                                <Progress value={((neuroData.berg_score || 0) / 56) * 100} className="h-2 bg-white" />
                                                <div className="flex justify-between mt-2 text-[8px] font-black uppercase tracking-tighter text-indigo-400">
                                                    <span>Risco Alto ({"<"}20)</span>
                                                    <span>Independente (56)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => { setValue('conduct.extraQuestionnaire', 'berg_balance'); setIsAssessmentModalOpen?.(true); }}
                                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                                        > ABRIR BERG COMPLETO </Button>
                                    </div>
                                </Card>

                                {/* Mobility Tests (TUG / 10m) */}
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                            <Footprints className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Testes de Marcha e Agilidade</h4>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                                                        TUG Test
                                                        <InfoIcon content="Timed Up and Go. Levantar da cadeira, andar 3m, virar e sentar de novo." />
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">Referencial de Independência: {"<"} 10s</span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        {...register('neuro_adult.tug_seconds')}
                                                        className="w-24 h-12 bg-white rounded-xl border-slate-100 text-center font-black text-lg pr-8"
                                                        placeholder="0.0"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">S</span>
                                                </div>
                                            </div>
                                            {neuroData.tug_seconds > 20 && (
                                                <Badge className="w-full bg-rose-100 text-rose-600 border-rose-200 text-[8px] font-black justify-center py-1">ALTO RISCO DE QUEDA</Badge>
                                            )}
                                        </div>

                                        <div className="p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black uppercase text-emerald-900 tracking-widest flex items-center gap-2">
                                                        Velocidade de Marcha
                                                        <InfoIcon content="Teste de 10 metros. Avalia a velocidade confortável de caminhada." />
                                                    </span>
                                                    <span className="text-[9px] font-bold text-emerald-700/60 uppercase italic">Meta Funcional: {">"} 0.8 m/s</span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        {...register('neuro_adult.walk_speed')}
                                                        className="w-24 h-12 bg-white rounded-xl border-emerald-100 text-center font-black text-lg pr-12"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400">M/S</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* FUNCTIONALITY TAB */}
                        <TabsContent value="function" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-5xl mx-auto space-y-8">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-100 rounded-xl text-pink-600">
                                            <Gauge className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                            Rankin Modificado (Incapacidade)
                                            <InfoIcon content="Modified Rankin Scale (mRS). Escala clínica global para medir o grau de incapacidade ou dependência após AVC." />
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {MODIFIED_RANKIN.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setValue('neuro_adult.rankin_level', opt.value)}
                                                className={cn(
                                                    "p-5 rounded-3xl border text-left transition-all flex flex-col gap-1",
                                                    neuroData.rankin_level === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]" : "bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200"
                                                )}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                                <span className={cn("text-[8px] font-bold leading-tight", neuroData.rankin_level === opt.value ? "text-indigo-100" : "text-slate-400")}>{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-900 rounded-xl text-white">
                                                <Accessibility className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Índice de Barthel (AVDs)</h4>
                                        </div>
                                        <div className="bg-slate-100 px-4 py-2 rounded-xl">
                                            <span className="text-xl font-black text-slate-800">{neuroData.barthel_score || 0}</span>
                                            <span className="text-[10px] font-black text-slate-400 ml-1">/ 100</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Avalia independência em autocuidado: alimentação, banho, vestuário, esfíncteres...</p>
                                    <Button
                                        onClick={() => { setValue('conduct.extraQuestionnaire', 'barthel_index'); setIsAssessmentModalOpen?.(true); }}
                                        className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    > INICIAR BARTHEL COMPLETO </Button>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* CONTEXT (CIF) TAB */}
                        <TabsContent value="cif" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-5xl mx-auto">
                                <Card className="p-8 rounded-[3rem] border-slate-100 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-2xl space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-indigo-300">Análise Funcional CIF</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fatores Ambientais e Pessoais</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase text-indigo-200 tracking-widest flex items-center gap-2">
                                                Participação e Social
                                                <InfoIcon content="Como o paciente interage com a comunidade? Obstáculos na vida social?" />
                                            </Label>
                                            <Textarea
                                                {...register('neuro_adult.cif_participation')}
                                                className="bg-white/5 border-none rounded-2xl text-[11px] font-medium min-h-[120px] text-indigo-50 focus:bg-white/10 p-5 leading-relaxed"
                                                placeholder="Descreva as limitações de participação social e lazer..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase text-emerald-300 tracking-widest flex items-center gap-2">
                                                Fatores Ambientais (Barreiras)
                                                <InfoIcon content="Escadas no domicílio? Acesso a transporte? Apoio familiar?" />
                                            </Label>
                                            <Textarea
                                                {...register('neuro_adult.cif_environment')}
                                                className="bg-white/5 border-none rounded-2xl text-[11px] font-medium min-h-[120px] text-emerald-50 focus:bg-white/10 p-5 leading-relaxed"
                                                placeholder="Descreva barreiras arquitetônicas ou facilitadores no ambiente..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 flex items-center gap-4">
                                        <UserCheck className="w-8 h-8 text-indigo-500 opacity-50" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-tighter">
                                            A abordagem centrada no paciente exige que a reabilitação neurofuncional não foque apenas em tônus e força, mas na autonomia e participação ativa na sociedade.
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
