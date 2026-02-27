"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Briefcase, Activity, Target, ShieldCheck, Info, UserCheck,
    Construction, AlertTriangle, Ruler, Scale, RefreshCw, Layers,
    MousePointer2, Dumbbell, ClipboardList, PenTool, Search, HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface OccupationalHealthAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

const ERGONOMIC_RISK_QUALITATIVE = [
    { value: "low", label: "Baixo Risco", color: "text-emerald-500", desc: "Postura aceitável, sem necessidade de intervenção imediata." },
    { value: "moderate", label: "Risco Moderado", color: "text-yellow-500", desc: "Necessita investigação adicional e possíveis mudanças." },
    { value: "high", label: "Risco Alto", color: "text-orange-500", desc: "Intervenção necessária em breve." },
    { value: "critical", label: "Risco Crítico", color: "text-rose-600", desc: "Intervenção imediata obrigatória." },
];

export function OccupationalHealthAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: OccupationalHealthAccordionProps) {
    const { watch, setValue, register } = useFormContext();
    const [activeTab, setActiveTab] = useState("occupational");

    const occData = watch('occupational_health') || {};
    const isFilled = isSectionFilled('occupational_health');

    const InfoIcon = ({ content }: { content: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-amber-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 bg-slate-900 text-white rounded-xl border-none shadow-2xl">
                    <p className="text-[10px] font-bold leading-relaxed">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <AccordionItem
            value="occupational_health"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'occupational_health' ? 'bg-white ring-2 ring-amber-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'occupational_health' ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600")}>
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'occupational_health' ? "text-slate-900" : "text-slate-600")}>Saúde do Trabalho & Ergonomia</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Laudos Periciais, Riscos Ergonômicos e Aptidão Laboral</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        ANÁLISE PERICIAL
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-10 overflow-x-auto pb-2 scrollbar-hide">
                            <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto gap-1">
                                <TabsTrigger value="occupational" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Construction className="w-3.5 h-3.5 mr-2" /> Histórico & Postura
                                </TabsTrigger>
                                <TabsTrigger value="ergonomy" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Target className="w-3.5 h-3.5 mr-2" /> Risco Ergonômico
                                </TabsTrigger>
                                <TabsTrigger value="forensic" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Search className="w-3.5 h-3.5 mr-2" /> Análise Pericial (Nexo)
                                </TabsTrigger>
                                <TabsTrigger value="capacity" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Dumbbell className="w-3.5 h-3.5 mr-2" /> Capacidade Funcional
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* OCCUPATIONAL HISTORY TAB */}
                        <TabsContent value="occupational" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                            <HardHat className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Perfil Profissiográfico
                                            <InfoIcon content="Detalhamento da função e carga horária para nexo técnico." />
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cargo / Função Atual</Label>
                                            <Input {...register('occupational_health.job_title')} className="h-12 rounded-xl bg-slate-50 border-transparent font-bold focus:bg-white" placeholder="Ex: Operador de Máquina" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tempo na Função</Label>
                                                <Input {...register('occupational_health.job_tenure')} className="h-12 rounded-xl bg-slate-50 border-transparent font-bold text-center" placeholder="Ex: 5 anos" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Carga Horária/Dia</Label>
                                                <Input {...register('occupational_health.hours_per_day')} className="h-12 rounded-xl bg-slate-50 border-transparent font-bold text-center" placeholder="8h" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descrição de Tarefas Críticas</Label>
                                            <Textarea {...register('occupational_health.task_description')} className="min-h-[100px] rounded-2xl bg-slate-50 border-transparent text-[11px] font-medium" placeholder="Descreva os movimentos repetitivos ou posturas viciosas..." />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                            <MousePointer2 className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Padrão Postural Laboral
                                            <InfoIcon content="Postura predominante durante a jornada de trabalho." />
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'sitting', label: 'Sentado', info: 'Risco de compressão lombar/cervical.' },
                                            { id: 'standing', label: 'Em Pé (Estático)', info: 'Carga em MMII e vascular.' },
                                            { id: 'walking', label: 'Caminhando', info: 'Carga dinâmica extrema?' },
                                            { id: 'repetitive', label: 'Mov. Repetitivos', info: 'Risco de LER/DORT.' },
                                        ].map(target => (
                                            <div key={target.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                        {target.label} <InfoIcon content={target.info} />
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {['Baixo', 'Médio', 'Alto'].map(lvl => (
                                                        <button
                                                            key={lvl}
                                                            type="button"
                                                            onClick={() => setValue(`occupational_health.posture_levels.${target.id}`, lvl)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all",
                                                                occData?.posture_levels?.[target.id] === lvl ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-400 border border-slate-100"
                                                            )}
                                                        > {lvl} </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* ERGONOMY RISK TAB */}
                        <TabsContent value="ergonomy" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <Card className="p-10 rounded-[4rem] border-slate-100 bg-white shadow-xl max-w-5xl mx-auto space-y-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <AlertTriangle className="w-32 h-32 text-amber-900" />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                            <Layers className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                                Análise de Risco Ergonômico (NR-17)
                                                <InfoIcon content="Classificação qualitativa e quantitativa baseada na Norma Regulamentadora 17." />
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Referencial REBA / RULA</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {ERGONOMIC_RISK_QUALITATIVE.map(risk => (
                                            <button
                                                key={risk.value}
                                                type="button"
                                                onClick={() => setValue('occupational_health.ergonomic_risk', risk.value)}
                                                className={cn(
                                                    "p-6 rounded-[2rem] border-2 text-left transition-all flex flex-col gap-2",
                                                    occData.ergonomic_risk === risk.value
                                                        ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.03]"
                                                        : "bg-slate-50 border-slate-100 text-slate-700 hover:border-amber-200"
                                                )}
                                            >
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest", occData.ergonomic_risk === risk.value ? "text-amber-400" : risk.color)}>{risk.label}</span>
                                                <span className={cn("text-[8px] font-bold leading-tight uppercase", occData.ergonomic_risk === risk.value ? "text-slate-400" : "text-slate-400")}>{risk.desc}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Checklist de Conformidade (Mobiliário)</Label>
                                            <div className="space-y-2">
                                                {[
                                                    { id: 'chair', label: 'Cadeira Ergonômica (Ajustável)' },
                                                    { id: 'monitor', label: 'Monitor na Altura dos Olhos' },
                                                    { id: 'lighting', label: 'Iluminação Adequada' },
                                                    { id: 'noise', label: 'Controle de Ruído' },
                                                ].map(check => (
                                                    <div key={check.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                        <Controller
                                                            name={`occupational_health.checklist.${check.id}`}
                                                            control={useFormContext().control}
                                                            render={({ field }) => (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.value}
                                                                    onChange={field.onChange}
                                                                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                                                />
                                                            )}
                                                        />
                                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{check.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Sugestões de Intervenção</Label>
                                            <Textarea {...register('occupational_health.ergonomic_suggestions')} className="min-h-[150px] rounded-[2rem] bg-amber-50/30 border-amber-100 text-[11px] p-6 focus:ring-amber-500" placeholder="Ajustes em mobiliário, pausas ativas, rodízio de tarefas..." />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* FORENSIC ANALYSIS TAB */}
                        <TabsContent value="forensic" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-5xl mx-auto space-y-8">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm bg-slate-900 text-white space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black uppercase text-[11px] tracking-[0.2em] text-indigo-300">Nexo Técnico Epidemiológico (NTEP)</h4>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-indigo-100 tracking-widest flex items-center gap-2">
                                                Conclusão de Nexo Causal
                                                <InfoIcon content="Existe relação direta entre a doença e a atividade laboral?" />
                                            </Label>
                                            <Select
                                                value={occData.causal_link}
                                                onValueChange={(v) => setValue('occupational_health.causal_link', v)}
                                            >
                                                <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 font-black text-indigo-400 uppercase text-xs">
                                                    <SelectValue placeholder="Selecione o parecer..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="positive" className="font-black py-3">Nexo Positivo (Ocupacional)</SelectItem>
                                                    <SelectItem value="concausal" className="font-black py-3">Concausalidade (Agravamento)</SelectItem>
                                                    <SelectItem value="negative" className="font-black py-3">Nexo Negativo (Degenerativo)</SelectItem>
                                                    <SelectItem value="indetermined" className="font-black py-3">Inconclusivo / Necessita Exames</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-indigo-100 tracking-widest flex items-center gap-2">
                                                Testes Provocativos / Validação
                                                <InfoIcon content="Testes para identificar simulação ou exagero de sintomas (ex: Sinal de Bell)." />
                                            </Label>
                                            <Textarea {...register('occupational_health.forensic_tests')} className="min-h-[100px] border-white/10 bg-white/5 rounded-2xl text-[11px] p-5 text-indigo-50 focus:bg-white/10" placeholder="Resultados de testes de validação clínica e consistência de sintomas..." />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                                            <PenTool className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Parecer para Laudo Pericial</h4>
                                    </div>
                                    <Textarea {...register('occupational_health.forensic_summary')} className="min-h-[200px] rounded-[2rem] border-slate-200 text-[11px] p-8 focus:ring-slate-900 leading-relaxed" placeholder="Redija aqui o resumo do parecer técnico. Este texto poderá ser utilizado na geração de relatórios oficiais para empresas ou tribunais..." />
                                </Card>
                            </div>
                        </TabsContent>

                        {/* FUNCTIONAL CAPACITY TAB */}
                        <TabsContent value="capacity" className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-xl text-slate-800">
                                                <Dumbbell className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                                Dinamometria Handgrip (Preensão)
                                                <InfoIcon content="Índice de força global e capacidade de preensão laboral." />
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        {['Esquerda', 'Direita'].map(side => (
                                            <div key={side} className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center italic">{side}</span>
                                                <div className="relative">
                                                    <Input
                                                        {...register(`occupational_health.handgrip_${side.toLowerCase()}`)}
                                                        className="h-16 rounded-2xl bg-white border-transparent text-center font-black text-2xl focus:ring-slate-900 shadow-inner"
                                                        placeholder="0.0"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">Kgf</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                            <ClipboardList className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Capacidade de Levantamento (NIOSH)</h4>
                                    </div>
                                    <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                                        <p className="text-[10px] font-bold text-emerald-900/60 uppercase tracking-tighter leading-relaxed">
                                            Considerando a massa corporal e a biomecânica atual, o limite de carga recomendado para preservação da coluna lombar é:
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Input {...register('occupational_health.lifting_capacity')} className="w-24 h-12 rounded-xl text-center font-black text-lg text-emerald-700 bg-white border-emerald-200" placeholder="0" />
                                            <span className="text-sm font-black text-emerald-600 uppercase">kg</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="bg-amber-50/50 p-8 flex items-center gap-5 border-t border-amber-100">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                        <UserCheck className="h-6 w-6 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-[0.1em] mb-1">Parecer Axiom para Médicos e Advogados</p>
                        <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed uppercase tracking-tighter">
                            Este formulário foi estruturado para atender exigências do Ministério do Trabalho e tribunais. O preenchimento detalhado do Nexo e ErgoRisk garante a robustez jurídica do seu atendimento clínico.
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
