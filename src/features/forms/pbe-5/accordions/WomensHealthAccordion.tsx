"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Flower2, Baby, Activity, ShieldCheck, Info, UserCheck,
    Heart, Droplets, Ruler, Scale, RefreshCw, Layers,
    Waves, Thermometer, ClipboardList, PenTool, Search, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface WomensHealthAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

const PERFECT_SCHEME = [
    { id: 'power', label: 'Power (0-5)', info: 'Força de contração voluntária (Oxford Modificada).' },
    { id: 'endurance', label: 'Endurance (seg)', info: 'Tempo de sustentação da contração máxima (até 10s).' },
    { id: 'repetitions', label: 'Repetitions', info: 'Nº de repetições da sustentação (com 4s de repouso).' },
    { id: 'fast', label: 'Fast (contrações)', info: 'Nº de contrações rápidas (1s) em 10s.' },
];

export function WomensHealthAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: WomensHealthAccordionProps) {
    const { watch, setValue, register } = useFormContext();
    const [activeTab, setActiveTab] = useState("obstetric");

    const whData = watch('womens_health') || {};
    const isFilled = isSectionFilled('womens_health');

    const InfoIcon = ({ content }: { content: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-pink-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 bg-slate-900 text-white rounded-xl border-none shadow-2xl">
                    <p className="text-[10px] font-bold leading-relaxed">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <AccordionItem
            value="womens_health"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'womens_health' ? 'bg-white ring-2 ring-pink-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'womens_health' ? "bg-pink-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-600")}>
                        <Flower2 className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'womens_health' ? "text-slate-900" : "text-slate-600")}>Saúde da Mulher & Pélvica</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Obstetrícia, Esquema PERFECT e Uroginecologia</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-pink-100 text-pink-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        SISTEMA PÉLVICO ATIVO
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-10 overflow-x-auto pb-2 scrollbar-hide">
                            <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto gap-1">
                                <TabsTrigger value="obstetric" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Baby className="w-3.5 h-3.5 mr-2" /> História Obstétrica
                                </TabsTrigger>
                                <TabsTrigger value="physical" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Esquema PERFECT
                                </TabsTrigger>
                                <TabsTrigger value="urogyn" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Droplets className="w-3.5 h-3.5 mr-2" /> Queixas Urinárias
                                </TabsTrigger>
                                <TabsTrigger value="sexual" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                                    <Heart className="w-3.5 h-3.5 mr-2" /> Função Sexual/Dor
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* OBSTETRIC HISTORY TAB */}
                        <TabsContent value="obstetric" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
                                            <Baby className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Histórico de Gestações (GPA)
                                            <InfoIcon content="Gestações, Partos e Abortos. Crucial para entender a sobrecarga do assoalho pélvico." />
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        {[
                                            { id: 'gestations', label: 'G (Gestações)' },
                                            { id: 'births', label: 'P (Partos)' },
                                            { id: 'abortions', label: 'A (Abortos)' },
                                        ].map(target => (
                                            <div key={target.id} className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">{target.label}</Label>
                                                <Input
                                                    type="number"
                                                    {...register(`womens_health.obstetric.${target.id}`)}
                                                    className="h-14 rounded-2xl bg-slate-50 border-transparent text-center font-black text-xl focus:bg-white focus:ring-pink-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Partos predominante</Label>
                                        <div className="flex gap-2">
                                            {['Vaginal', 'Cesárea', 'Fórceps', 'Nenhum'].map(tipo => (
                                                <button
                                                    key={tipo}
                                                    type="button"
                                                    onClick={() => setValue('womens_health.obstetric.birth_type', tipo)}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border",
                                                        whData?.obstetric?.birth_type === tipo ? "bg-pink-600 border-pink-600 text-white shadow-lg" : "bg-white text-slate-400 border-slate-100 hover:border-pink-200"
                                                    )}
                                                > {tipo} </button>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Intercorrências & Climatério
                                            <InfoIcon content="Episiotomia e menopausa influenciam diretamente na trofia do tecido pélvico." />
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { id: 'episiotomy', label: 'Episiotomia / Laceração', desc: 'Presença de cicatriz perineal.' },
                                            { id: 'gestational_dm', label: 'DM Gestacional', desc: 'Diabetes durante a gestação.' },
                                            { id: 'menopause', label: 'Menopausa / Climatério', desc: 'Alterações hormonais (Hipoestrogenismo).' },
                                        ].map(item => (
                                            <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-all hover:bg-white hover:border-pink-200">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight">{item.label}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.desc}</span>
                                                </div>
                                                <Controller
                                                    name={`womens_health.obstetric.${item.id}`}
                                                    control={useFormContext().control}
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-pink-600 border-slate-300"
                                                        />
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* PERFECT SCHEME TAB */}
                        <TabsContent value="physical" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <Card className="p-10 rounded-[4rem] border-slate-100 bg-white shadow-xl max-w-5xl mx-auto space-y-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <ShieldCheck className="w-32 h-32 text-pink-900" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row gap-12">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200">
                                                <Activity className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                                    Esquema PERFECT (Laycock)
                                                    <InfoIcon content="Padrão internacional para avaliação funcional da musculatura do assoalho pélvico (MAP)." />
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avaliação por Palpação Vaginal/Anal</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {PERFECT_SCHEME.map(item => (
                                                <div key={item.id} className="space-y-3 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:border-pink-200">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                            {item.label} <InfoIcon content={item.info} />
                                                        </Label>
                                                    </div>
                                                    <Input
                                                        {...register(`womens_health.perfect.${item.id}`)}
                                                        className="h-12 bg-white border-transparent rounded-xl text-center font-black text-xl focus:ring-pink-500 shadow-sm"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* UROGYNECOLOGY TAB */}
                        <TabsContent value="urogyn" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                            <Droplets className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Perfil de Diurese
                                            <InfoIcon content="Frequência miccional e sinais de perda urinária." />
                                        </h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Micções (Dia)</Label>
                                                <Input {...register('womens_health.urogyn.mictions_day')} className="h-12 rounded-xl bg-slate-50 border-transparent font-bold text-center" placeholder="4-6" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Noctúria (Noite)</Label>
                                                <Input {...register('womens_health.urogyn.nocturia')} className="h-12 rounded-xl bg-slate-50 border-transparent font-bold text-center" placeholder="0" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {[
                                                { id: 'stress_incontinence', label: 'Incontinência de Esforço', info: 'Perda ao tossir, rir, pular ou carregar peso.' },
                                                { id: 'urgency_incontinence', label: 'Incontinência de Urgência', info: 'Desejo súbito e inadiável de urinar.' },
                                                { id: 'pad_use', label: 'Uso de Absorvente / Pad', info: 'Uso diário para escapes urinários.' },
                                            ].map(item => (
                                                <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-all hover:bg-white hover:border-blue-200">
                                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                        {item.label} <InfoIcon content={item.info} />
                                                    </span>
                                                    <Controller
                                                        name={`womens_health.urogyn.${item.id}`}
                                                        control={useFormContext().control}
                                                        render={({ field }) => (
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                className="data-[state=checked]:bg-blue-600 border-slate-300"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                            <Waves className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            Bexiga Neurogênica / Hiperativa
                                            <InfoIcon content="Frequência e urgência exacerbadas em exames urodinâmicos ou queixas clínicas." />
                                        </h4>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observações Urodinâmicas</Label>
                                        <Textarea {...register('womens_health.urogyn.urodynamic_notes')} className="min-h-[120px] rounded-[2rem] bg-slate-50 border-transparent text-[11px] p-6 focus:bg-white" placeholder="Descreva fluxometria, resíduos miccionais ou achados clínicos..." />
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* SEXUAL FUNCTION TAB */}
                        <TabsContent value="sexual" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <Card className="p-8 rounded-[3.5rem] bg-rose-50 border-rose-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-rose-200 rounded-2xl flex items-center justify-center text-rose-600">
                                            <Heart className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-rose-900 uppercase text-xs tracking-widest">Função Sexual & Disfunções de Dor</h3>
                                            <p className="text-[10px] font-bold text-rose-700/60 uppercase tracking-tighter italic">Privacidade e acolhimento são fundamentais neste relato.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'dyspareunia', label: 'Dispareunia (Dor na Relação)', info: 'Dor persistente durante ou após a penetração.' },
                                            { id: 'vaginismus', label: 'Vaginismo / Medo', info: 'Espasmos involuntários que impedem a penetração.' },
                                            { id: 'low_libido', label: 'Desejo Sexual Hipotivo', info: 'Baixa libido ou falta de interesse sexual.' },
                                            { id: 'anovulacao', label: 'Dificuldade de Orgasmo', info: 'Anorgasmia ou retardo orgástico.' },
                                        ].map(item => (
                                            <div key={item.id} className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center justify-between transition-all hover:shadow-md">
                                                <span className="text-[10px] font-black uppercase text-rose-900 tracking-tight flex items-center gap-2">
                                                    {item.label} <InfoIcon content={item.info} />
                                                </span>
                                                <Controller
                                                    name={`womens_health.sexual.${item.id}`}
                                                    control={useFormContext().control}
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-rose-600 border-rose-200"
                                                        />
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-rose-200">
                                        <Label className="text-[10px] font-black text-rose-900 uppercase tracking-widest px-1">Mapeamento de Pontos Gatilho (Trigger Points)</Label>
                                        <Textarea {...register('womens_health.sexual.trigger_points')} className="min-h-[100px] mt-3 rounded-2xl bg-white border-rose-200 text-[11px] p-5 focus:ring-rose-500" placeholder="Músculo Elevador do Ânus, Obturador Interno, Pubococcígeo..." />
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="bg-pink-50/50 p-8 flex items-center gap-5 border-t border-pink-100">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-pink-100 shadow-sm shrink-0">
                        <PenTool className="h-6 w-6 text-pink-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-pink-700 uppercase tracking-[0.1em] mb-1">Princípio de Abordagem Axiom</p>
                        <p className="text-[10px] font-bold text-pink-900/60 leading-relaxed uppercase tracking-tighter">
                            A saúde pélvica vai além da força muscular. Envolve comportamento, emoções e qualidade de vida. O Esquema PERFECT é apenas uma peça do quebra-cabeça funcional da mulher.
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
