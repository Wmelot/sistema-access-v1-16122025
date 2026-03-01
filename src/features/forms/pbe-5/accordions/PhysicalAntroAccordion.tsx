"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    const thigh = Number(watch('antro.thigh')) || 0;
    const supra = Number(watch('antro.suprailiac')) || 0;
    const abdo = Number(watch('antro.abdominal')) || 0;
    const gender = watch('antro.gender') || 'male';

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

                    {/* US Folds */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-blue-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Ultrassom - Pregas (mm)</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 text-center">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coxa</Label>
                                <Input type="number" step="0.1" {...control.register('antro.thigh')} className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg text-center shadow-inner" />
                            </div>
                            <div className="space-y-2 text-center">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suprailíaca</Label>
                                <Input type="number" step="0.1" {...control.register('antro.suprailiac')} className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg text-center shadow-inner" />
                            </div>
                            <div className="space-y-2 text-center">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abdomem</Label>
                                <Input type="number" step="0.1" {...control.register('antro.abdominal')} className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg text-center shadow-inner" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Results Inside Accordion */}
                {antroResult && (
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-2xl">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resultado Pineau/Siri</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black">{antroResult.fatPercent.toFixed(1)}</span>
                                <span className="text-2xl font-black text-blue-400">%</span>
                            </div>
                            <Badge className="bg-blue-600 hover:bg-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                {antroResult.classification}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-8 shrink-0">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Massa Magra</p>
                                <p className="text-xl font-black">{antroResult.leanMass.toFixed(1)} <span className="text-sm font-bold text-emerald-400">kg</span></p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">FFMI Index</p>
                                <p className="text-xl font-black">{antroResult.ffmi.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}
