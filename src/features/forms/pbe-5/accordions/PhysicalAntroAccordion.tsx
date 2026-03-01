"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, Activity, CheckCircle2, HeartPulse, Scale, ShieldCheck, AlertCircle, Zap, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SkinfoldProtocol } from "./protocols/SkinfoldProtocol";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

interface PhysicalAntroAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string, iconColor: string, bg: string };
}

export function PhysicalAntroAccordion({ openSection, isSectionFilled, sectionStyle }: PhysicalAntroAccordionProps) {
    const { control, watch } = useFormContext();
    const isFilled = isSectionFilled('antro');

    // Calculations logic (Pineau/Siri)
    const weight = Number(watch('antro.weight')) || 0;
    const height = Number(watch('antro.height')) || 0;
    const age = Number(watch('antro.age')) || 0;
    const thigh = Number(watch('antro.thigh')) || 0;
    const supra = Number(watch('antro.suprailiac')) || 0;
    const abdo = Number(watch('antro.abdominal')) || 0;
    const gender = watch('antro.gender') || 'male';
    const assessmentMethod = watch('antro.assessmentMethod') || 'ultrasound';

    // Perimeters
    const armRelaxed = Number(watch('antro.armRelaxed')) || 0;
    const armContracted = Number(watch('antro.armContracted')) || 0;
    const chest = Number(watch('antro.chest')) || 0;
    const waist = Number(watch('antro.waist')) || 0;
    const hip = Number(watch('antro.hip')) || 0;
    const thighPerim = Number(watch('antro.thighPerim')) || 0;
    const calf = Number(watch('antro.calf')) || 0;
    const neck = Number(watch('antro.neck')) || 0;

    const antroResult = React.useMemo(() => {
        if (!weight || !height || !thigh || !supra || !abdo) return null;

        const sum = thigh + supra + abdo;
        let density = 0;

        if (gender === 'male') {
            density = 1.18568 - (0.09062 * Math.log10(sum));
        } else {
            density = 1.13702 - (0.05742 * Math.log10(sum));
        }

        const fatPercent = (495 / density) - 450;
        const fatMass = weight * (fatPercent / 100);
        const leanMass = weight - fatMass;
        const heightM = height / 100;
        const ffmi = leanMass / (heightM * heightM);

        let classification = 'Normal';
        if (gender === 'male') {
            if (fatPercent < 6) classification = 'Essencial';
            else if (fatPercent < 14) classification = 'Atleta';
            else if (fatPercent < 18) classification = 'Fitness';
            else if (fatPercent < 25) classification = 'Aceitável';
            else classification = 'Obeso';
        } else {
            if (fatPercent < 14) classification = 'Essencial';
            else if (fatPercent < 21) classification = 'Atleta';
            else if (fatPercent < 25) classification = 'Fitness';
            else if (fatPercent < 32) classification = 'Aceitável';
            else classification = 'Obeso';
        }

        return { fatPercent: Math.max(0, fatPercent), classification, leanMass, ffmi };
    }, [weight, height, thigh, supra, abdo, gender]);

    // Health Risk Assessment
    const healthRisks = React.useMemo(() => {
        if (!waist || !height) return null;

        const whr = hip > 0 ? waist / hip : 0;
        let whrRisk = 'Baixo';
        let whrColor = 'emerald';

        if (gender === 'male') {
            if (whr >= 1.0) { whrRisk = 'Muito Alto'; whrColor = 'rose'; }
            else if (whr >= 0.95) { whrRisk = 'Alto'; whrColor = 'orange'; }
            else if (whr >= 0.90) { whrRisk = 'Moderado'; whrColor = 'amber'; }
        } else {
            if (whr >= 0.85) { whrRisk = 'Muito Alto'; whrColor = 'rose'; }
            else if (whr >= 0.80) { whrRisk = 'Alto'; whrColor = 'orange'; }
            else if (whr >= 0.75) { whrRisk = 'Moderado'; whrColor = 'amber'; }
        }

        const whtr = waist / height;
        const whtrRisk = whtr > 0.50;

        const conicityIndex = weight > 0 && height > 0 ?
            (waist / 100) / (0.109 * Math.sqrt(weight / (height / 100))) : 0;

        const neckRisk = neck > 0 && (
            (gender === 'male' && neck > 37.9) ||
            (gender === 'female' && neck > 34.7)
        );

        return {
            whr: whr > 0 ? whr : null,
            whrRisk,
            whrColor,
            whtr: whtr > 0 ? whtr : null,
            whtrRisk,
            conicityIndex: conicityIndex > 0 ? conicityIndex : null,
            neck,
            neckRisk,
            neckLimit: gender === 'male' ? 37.9 : 34.7
        };
    }, [waist, hip, height, weight, neck, gender]);

    // Hypertrophy / Corrected Perimeters
    const correctedPerimeters = React.useMemo(() => {
        // Corrected Perimeter = Measured Perimeter - (π * fat_thickness_mm / 10)
        // Using abdominal fat as proxy for arm if specific US not available, and thigh for leg
        const abdominalFat = abdo || 0;
        const thighFat = thigh || 0;

        const armCorrected = armContracted > 0 ? armContracted - (Math.PI * abdominalFat / 10) : 0;
        const thighCorrected = thighPerim > 0 ? thighPerim - (Math.PI * thighFat / 10) : 0;
        const calfCorrected = calf > 0 ? calf - (Math.PI * thighFat / 10) : 0;

        return {
            arm: armCorrected,
            thigh: thighCorrected,
            calf: calfCorrected
        };
    }, [armContracted, thighPerim, calf, abdo, thigh]);

    return (
        <AccordionItem value="antro" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'antro' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'antro' ? "bg-blue-600 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-blue-600")}>
                        <Ruler className="h-6 w-6 transition-all duration-500 group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'antro' ? "text-slate-900" : "text-slate-500")}>Composição Corporais (US)</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Protocolo Pineau & Siri (Ultrassom)</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Basic Data */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-blue-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Informações Antropométricas</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gênero</Label>
                                <Controller
                                    name="antro.gender"
                                    control={control}
                                    defaultValue="male"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-sm shadow-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male" className="font-bold">Masculino</SelectItem>
                                                <SelectItem value="female" className="font-bold">Feminino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Idade</Label>
                                <Input type="number" {...control.register('antro.age')} className="h-12 rounded-xl border-slate-200 bg-white font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Peso (kg)</Label>
                                <Input type="number" step="0.1" {...control.register('antro.weight')} className="h-12 rounded-xl border-slate-200 bg-white font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Altura (cm)</Label>
                                <Input type="number" {...control.register('antro.height')} className="h-12 rounded-xl border-slate-200 bg-white font-bold" />
                            </div>
                        </div>
                    </div>

                    {/* assessment method selector */}
                    <div className="md:col-span-2 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-6 group hover:border-blue-100 transition-all">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Método de Avaliação da Composição</h4>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ultrassom (Espessura) ou Plicômetro (Dobras Cutâneas)</p>
                        </div>
                        <div className="w-full md:w-auto shrink-0">
                            <Controller
                                name="antro.assessmentMethod"
                                control={control}
                                defaultValue="ultrasound"
                                render={({ field }) => (
                                    <Tabs onValueChange={field.onChange} value={field.value} className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                        <TabsList className="bg-transparent h-10 gap-1">
                                            <TabsTrigger value="ultrasound" className="rounded-xl h-8 px-4 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">Ultrassom</TabsTrigger>
                                            <TabsTrigger value="skinfolds" className="rounded-xl h-8 px-4 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">Dobras</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                )}
                            />
                        </div>
                    </div>

                    {assessmentMethod === 'ultrasound' ? (
                        /* US Folds */
                        <div className="md:col-span-2 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                    <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Ultrassom - Espessura (mm)</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[8px] font-black border-blue-100 text-blue-400">PINEAU & SIRI</Badge>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-slate-300 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white rounded-xl p-3 border-none shadow-2xl max-w-xs">
                                                <p className="text-[9px] font-bold leading-relaxed text-center italic">Protocolo baseado na medida da espessura de tecido adiposo via US nas regiões da coxa, suprailíaca e abdômen.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 text-center group/field">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/field:text-blue-600 transition-colors">Coxa</Label>
                                    <Input type="number" step="0.1" {...control.register('antro.thigh')} className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg text-center shadow-inner focus:border-blue-500 transition-all" />
                                </div>
                                <div className="space-y-2 text-center group/field">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/field:text-blue-600 transition-colors">Suprailíaca</Label>
                                    <Input type="number" step="0.1" {...control.register('antro.suprailiac')} className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg text-center shadow-inner focus:border-blue-500 transition-all" />
                                </div>
                                <div className="space-y-2 text-center group/field">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/field:text-blue-600 transition-colors">Abdômen</Label>
                                    <Input type="number" step="0.1" {...control.register('antro.abdominal')} className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg text-center shadow-inner focus:border-blue-500 transition-all" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="md:col-span-2">
                            <SkinfoldProtocol gender={gender} age={age} weight={weight} />
                        </div>
                    )}

                    {/* Perimeters */}
                    <div className="md:col-span-2 space-y-6 border-t border-slate-100 pt-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Perimetria (Circunferências em cm)</h4>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-help flex gap-1.5 items-center px-3 h-7 rounded-full border border-indigo-100">
                                            <Scale className="h-3 w-3" />
                                            <span className="text-[9px] font-bold uppercase tracking-tight">Avaliação de Lado Dominante</span>
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white rounded-xl p-3 border-none shadow-2xl max-w-xs">
                                        <p className="text-[10px] font-bold leading-relaxed">As medidas de membros devem ser realizadas preferencialmente no lado de queixa ou no lado dominante para fins de evolução.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Braço Relaxado</Label>
                                <Input type="number" step="0.1" {...control.register('antro.armRelaxed')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Braço Contraído</Label>
                                <Input type="number" step="0.1" {...control.register('antro.armContracted')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Tórax</Label>
                                <Input type="number" step="0.1" {...control.register('antro.chest')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Pescoço</Label>
                                <Input type="number" step="0.1" {...control.register('antro.neck')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Cintura</Label>
                                <Input type="number" step="0.1" {...control.register('antro.waist')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Quadril</Label>
                                <Input type="number" step="0.1" {...control.register('antro.hip')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Coxa Medial</Label>
                                <Input type="number" step="0.1" {...control.register('antro.thighPerim')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Panturrilha</Label>
                                <Input type="number" step="0.1" {...control.register('antro.calf')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Results Inside Accordion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {antroResult && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform duration-1000 group-hover:scale-150" />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/80">Composição Corporal</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black tracking-tighter tabular-nums">{antroResult.fatPercent.toFixed(1)}</span>
                                        <span className="text-xl font-black text-blue-400">% Gordura</span>
                                    </div>
                                </div>
                                <Badge className="bg-blue-600 hover:bg-blue-600 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-none shadow-lg shadow-blue-900/40">
                                    {antroResult.classification}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3 text-emerald-400" /> Massa Magra
                                    </p>
                                    <p className="text-xl font-black tabular-nums">{antroResult.leanMass.toFixed(1)} <span className="text-xs font-bold text-emerald-400">kg</span></p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                                        <Activity className="h-3 w-3 text-blue-400" /> FFMI Index
                                    </p>
                                    <p className="text-xl font-black tabular-nums">{antroResult.ffmi.toFixed(1)}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                                        {antroResult.ffmi < 18 ? 'Baixo' : antroResult.ffmi < 22 ? 'Médio' : 'Elite'}
                                    </p>
                                </div>
                            </div>

                            {(correctedPerimeters.arm > 0 || correctedPerimeters.thigh > 0) && (
                                <div className="pt-6 border-t border-white/5 relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Dumbbell className="h-3.5 w-3.5 text-indigo-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80">Hipertrofia (Perímetros Corrigidos)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {correctedPerimeters.arm > 0 && (
                                            <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Braço</span>
                                                <span className="text-sm font-black">{correctedPerimeters.arm.toFixed(1)} cm</span>
                                            </div>
                                        )}
                                        {correctedPerimeters.thigh > 0 && (
                                            <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Coxa</span>
                                                <span className="text-sm font-black">{correctedPerimeters.thigh.toFixed(1)} cm</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {healthRisks && (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-8 flex flex-col justify-between group">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <HeartPulse className="h-4 w-4 text-rose-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Risco Cardiometabólico</span>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {healthRisks.whr && (
                                        <div className="space-y-1.5 p-4 rounded-3xl bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">RCQ</span>
                                                <Badge className={cn(
                                                    "text-[8px] font-black h-4 px-2 rounded-full border-none uppercase tracking-tighter",
                                                    healthRisks.whrColor === 'rose' ? 'bg-rose-500 text-white' :
                                                        healthRisks.whrColor === 'orange' ? 'bg-orange-500 text-white' :
                                                            healthRisks.whrColor === 'amber' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                                )}>
                                                    {healthRisks.whrRisk}
                                                </Badge>
                                            </div>
                                            <p className="text-2xl font-black tabular-nums text-slate-800">{healthRisks.whr.toFixed(2)}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Relação Cintura-Quadril</p>
                                        </div>
                                    )}

                                    {healthRisks.whtr && (
                                        <div className="space-y-1.5 p-4 rounded-3xl bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">RCE</span>
                                                {healthRisks.whtrRisk && (
                                                    <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />
                                                )}
                                            </div>
                                            <p className="text-2xl font-black tabular-nums text-slate-800">{healthRisks.whtr.toFixed(2)}</p>
                                            <div className="flex items-center gap-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Razão Cintura-Estatura</p>
                                                {healthRisks.whtrRisk && <span className="text-[7px] font-black text-rose-600 underline">RISCO</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-3xl border border-slate-50 space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conicidade</span>
                                        <p className="text-lg font-black text-slate-700 tabular-nums">{healthRisks.conicityIndex?.toFixed(3)}</p>
                                        <p className="text-[7px] font-bold text-slate-300 uppercase">Gordura Abdominal Central</p>
                                    </div>
                                    <div className="p-4 rounded-3xl border border-slate-50 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pescoço</span>
                                            {healthRisks.neckRisk && <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />}
                                        </div>
                                        <p className="text-lg font-black text-slate-700 tabular-nums">{healthRisks.neck?.toFixed(1)} cm</p>
                                        <p className="text-[7px] font-bold text-slate-300 uppercase">Limite: {healthRisks.neckLimit} cm</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 italic">
                                <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                                    💡 <span className="font-black text-slate-700">Insights Clínicos:</span> A Razão Cintura-Estatura (RCE) acima de 0.50 é um forte preditor de eventos cardiovasculares adversos independente do IMC.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
