"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PhysicalCardioAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string, iconColor: string, bg: string };
}

export function PhysicalCardioAccordion({ openSection, isSectionFilled, sectionStyle }: PhysicalCardioAccordionProps) {
    const { control, watch } = useFormContext();
    const isFilled = isSectionFilled('cardio');

    const method = watch('cardio.method') || 'rockport';
    const age = Number(watch('antro.age')) || 30;
    const weight = Number(watch('antro.weight')) || 70;
    const gender = watch('antro.gender') || 'male';
    const timeMin = Number(watch('cardio.timeMin')) || 0;
    const hr = Number(watch('cardio.heartRate')) || 0;
    const distance = Number(watch('cardio.distance')) || 0;

    const cardioResult = React.useMemo(() => {
        const genderVal = gender === 'male' ? 1 : 0;

        if (method === 'rockport') {
            if (!timeMin || !hr || !weight) return null;
            const weightLb = weight * 2.20462;
            const vo2 = 132.853 - (0.0769 * weightLb) - (0.3877 * age) + (6.315 * genderVal) - (3.2649 * timeMin) - (0.1565 * hr);
            return { vo2: Math.max(0, vo2), type: 'Walk (Rockport)' };
        } else {
            if (!distance) return null;
            const vo2 = (distance - 504.9) / 44.73;
            return { vo2: Math.max(0, vo2), type: 'Run (Cooper)' };
        }
    }, [method, age, weight, gender, timeMin, hr, distance]);

    return (
        <AccordionItem value="cardio" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'cardio' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'cardio' ? "bg-rose-600 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-rose-600")}>
                        <HeartPulse className="h-6 w-6 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'cardio' ? "text-slate-900" : "text-slate-500")}>Cardio (VO2 Max)</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Rockport Walk ou Cooper 12min</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Protocolo Selecionado</Label>
                        <Controller
                            name="cardio.method"
                            control={control}
                            defaultValue="rockport"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white font-black text-sm shadow-sm transition-all focus:ring-rose-500">
                                        <SelectValue placeholder="Escolha o protocolo..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[500] rounded-2xl">
                                        <SelectItem value="rockport" className="font-bold py-3">Teste de Rockport (Caminhada 1 milha)</SelectItem>
                                        <SelectItem value="cooper" className="font-bold py-3">Teste de Cooper (Corrida 12min)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {method === 'rockport' ? (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tempo Final (minutos)</Label>
                                    <Input type="number" step="0.1" {...control.register('cardio.timeMin')} placeholder="Ex: 15.5" className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg shadow-inner" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-1">Média de tempo p/ 1609 metros</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">FC Final (bpm)</Label>
                                    <Input type="number" {...control.register('cardio.heartRate')} placeholder="Ex: 120" className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg shadow-inner" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-1">Frequência cardíaca ao final do teste</p>
                                </div>
                            </>
                        ) : (
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Distância Percorrida (metros)</Label>
                                <Input type="number" {...control.register('cardio.distance')} placeholder="Ex: 2400" className="h-14 rounded-2xl border-slate-200 bg-white font-black text-lg shadow-inner" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-1">Distância total em 12 minutos</p>
                            </div>
                        )}
                    </div>
                </div>

                {cardioResult && (
                    <div className="bg-rose-950 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-rose-500/20 shadow-2xl">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-rose-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-300/60">Consumo Máximo O₂</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black">{cardioResult.vo2.toFixed(1)}</span>
                                <span className="text-xl font-bold text-rose-400">ml/kg/min</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 items-end">
                            <Badge className="bg-rose-600 hover:bg-rose-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                Protocolo: {cardioResult.type}
                            </Badge>
                            <p className="text-[10px] font-bold text-rose-300/60 uppercase tracking-tighter text-right">Métrica estimada baseada na performance aeróbica.</p>
                        </div>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}
