"use client";

import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ruler, Weight as WeightIcon, HeartPulse, Activity, Zap, Thermometer, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsVitalsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function MetricsVitalsAccordion({ openSection, isSectionFilled, sectionStyle }: MetricsVitalsAccordionProps) {
    const { register, watch, setValue } = useFormContext();

    const weight = watch('metrics.weight') || 0;
    const height = watch('metrics.height') || 0;
    const bmi = useMemo(() => {
        if (!weight || !height) return 0;
        const hM = height / 100;
        return (weight / (hM * hM)).toFixed(1);
    }, [weight, height]);

    const getBMIColor = (val: number) => {
        if (val < 18.5) return "text-blue-500";
        if (val < 25) return "text-emerald-500";
        if (val < 30) return "text-orange-500";
        return "text-red-500";
    };

    const getBMILabel = (val: number) => {
        if (val < 18.5) return "Abaixo do peso";
        if (val < 25) return "Peso normal";
        if (val < 30) return "Sobrepeso";
        return "Obesidade";
    };

    return (
        <AccordionItem
            value="metrics"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'metrics' ? 'bg-white ring-2 ring-emerald-50' : 'bg-white/50',
                isSectionFilled('metrics') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'metrics' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600")}>
                        <Ruler className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'metrics' ? "text-slate-900" : "text-slate-600")}>3. Métricas Biofísicas & Vitais</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Medidas antropométricas e sinais vitais</p>
                    </div>
                </div>
                {isSectionFilled('metrics') && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PROGRESSO OK</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-12 border-t border-slate-50">
                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

                    {/* Antropometria */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Antropometria</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                <FormLabel className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <WeightIcon className="h-3.5 w-3.5 text-emerald-500" /> Peso (kg)
                                </FormLabel>
                                <Input
                                    {...register('metrics.weight')}
                                    type="number"
                                    placeholder="00.0"
                                    className="h-14 rounded-xl border-slate-200 bg-white text-2xl font-black text-slate-700 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                <FormLabel className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Ruler className="h-3.5 w-3.5 text-emerald-500" /> Altura (cm)
                                </FormLabel>
                                <Input
                                    {...register('metrics.height')}
                                    type="number"
                                    placeholder="000"
                                    className="h-14 rounded-xl border-slate-200 bg-white text-2xl font-black text-slate-700 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {weight > 0 && height > 0 && (
                            <div className="bg-emerald-50/30 border border-emerald-100 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 shadow-inner animate-in zoom-in-95 duration-500">
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Cálculo automático de IMC</div>
                                <div className={cn("text-6xl font-black tracking-tighter", getBMIColor(Number(bmi)))}>{bmi}</div>
                                <div className="flex flex-col items-center">
                                    <Badge className={cn("text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-none shadow-sm",
                                        Number(bmi) < 25 ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
                                    )}>
                                        {getBMILabel(Number(bmi))}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vitals */}
                    <div className={cn("p-8 rounded-[2rem] border transition-all", sectionStyle.bg, openSection === 'metrics' ? "border-emerald-100 shadow-inner" : "border-transparent")}>
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Sinais Vitais</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-2">
                                    <FormLabel className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                        <HeartPulse className="h-3 w-3 text-red-500" /> FC Repouso
                                    </FormLabel>
                                    <div className="relative">
                                        <Input {...register('metrics.hr')} className="h-10 border-none bg-slate-50 font-black text-base pl-0" placeholder="00" />
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">bpm</span>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-2">
                                    <FormLabel className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                        <Activity className="h-3 w-3 text-blue-500" /> Pressão (PA)
                                    </FormLabel>
                                    <Input {...register('metrics.bp')} className="h-10 border-none bg-slate-50 font-black text-base pl-0" placeholder="120/80" />
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-2">
                                    <FormLabel className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                        <Wind className="h-3 w-3 text-sky-500" /> Saturação O2
                                    </FormLabel>
                                    <div className="relative">
                                        <Input {...register('metrics.spo2')} className="h-10 border-none bg-slate-50 font-black text-base pl-0" placeholder="98" />
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">%</span>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-2">
                                    <FormLabel className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                        <Thermometer className="h-3 w-3 text-orange-500" /> Temp.
                                    </FormLabel>
                                    <div className="relative">
                                        <Input {...register('metrics.temp')} className="h-10 border-none bg-slate-50 font-black text-base pl-0" placeholder="36.5" />
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">°C</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white/60 border border-emerald-200 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Capacidade Aeróbica (VO2 Est.)</h5>
                                    <Zap className="h-4 w-4 text-emerald-600 animate-pulse" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Método Selecionado</span>
                                        <select {...register('metrics.vo2_method')} className="w-full h-8 bg-slate-100 border-none rounded-lg text-[10px] font-bold px-2">
                                            <option value="rockport">Caminhada (Rockport)</option>
                                            <option value="cooper">Corrida (Cooper)</option>
                                            <option value="none">Nenhum</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Resultado</span>
                                        <Input {...register('metrics.vo2_val')} className="h-8 bg-emerald-50 border-none rounded-lg text-xs font-black text-emerald-700" placeholder="Pendente" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
