"use client";

import React, { useMemo, useEffect } from "react";
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
    const hr = watch('metrics.hr') || 0;
    const bp = watch('metrics.bp') || "";
    const vo2_method = watch('metrics.vo2_method') || "none";
    const vo2_time = watch('metrics.vo2_time') || "";
    const vo2_distance = watch('metrics.vo2_distance') || "";

    // Access patient data from form context if available
    const patientGender = watch('clinical.patientGender') || "male";
    const patientAge = watch('clinical.patientAge') || 30;

    const bmi = useMemo(() => {
        if (!weight || !height) return 0;
        const hM = height / 100;
        return (weight / (hM * hM)).toFixed(1);
    }, [weight, height]);

    const vo2Max = useMemo(() => {
        if (vo2_method === 'rockport' && weight && hr && vo2_time && patientAge) {
            const weightLb = weight * 2.20462;
            const genderVal = patientGender === 'male' ? 1 : 0;
            const [min, sec] = vo2_time.split(':').map(Number);
            const timeDec = min + (sec || 0) / 60;
            if (timeDec > 0) {
                const res = 132.853 - (0.0769 * weightLb) - (0.3877 * patientAge) + (6.315 * genderVal) - (3.2649 * timeDec) - (0.1565 * hr);
                return res.toFixed(1);
            }
        } else if (vo2_method === 'cooper' && vo2_distance) {
            const dist = Number(vo2_distance);
            if (dist > 504.9) {
                const res = (dist - 504.9) / 44.73;
                return res.toFixed(1);
            }
        }
        return null;
    }, [vo2_method, weight, hr, vo2_time, vo2_distance, patientAge, patientGender]);

    useEffect(() => {
        if (vo2Max) {
            setValue('metrics.vo2_val', vo2Max);
        }
    }, [vo2Max, setValue]);

    const handleBPMask = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 3) {
            val = val.slice(0, 3) + "/" + val.slice(3, 6);
        }
        setValue('metrics.bp', val);
    };

    const getBMIColor = (val: number) => {
        if (val < 18.5) return "text-blue-500";
        if (val < 25) return "text-emerald-500";
        if (val < 30) return "text-orange-500";
        if (val < 35) return "text-red-500";
        return "text-purple-600";
    };

    const getBMILabel = (val: number) => {
        if (val < 18.5) return "Abaixo do peso";
        if (val < 25) return "Peso normal";
        if (val < 30) return "Sobrepeso";
        if (val < 35) return "Obesidade I";
        if (val < 40) return "Obesidade II";
        return "Obesidade III";
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
                        <Ruler className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'metrics' ? "text-slate-900" : "text-slate-600")}>Métricas Biofísicas e Sinais Vitais</span>
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

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                <FormLabel className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <WeightIcon className="h-3.5 w-3.5 text-emerald-500" /> Peso (kg)
                                </FormLabel>
                                <Input
                                    {...register('metrics.weight')}
                                    type="number"
                                    placeholder="00.0"
                                    className="h-12 rounded-xl border-slate-200 bg-white text-xl font-black text-slate-700 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                <FormLabel className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <Ruler className="h-3.5 w-3.5 text-emerald-500" /> Altura (cm)
                                </FormLabel>
                                <Input
                                    {...register('metrics.height')}
                                    type="number"
                                    placeholder="000"
                                    className="h-12 rounded-xl border-slate-200 bg-white text-xl font-black text-slate-700 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                <FormLabel className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <Activity className="h-3.5 w-3.5 text-emerald-500" /> Numeração
                                </FormLabel>
                                <Input
                                    {...register('metrics.shoeSize')}
                                    placeholder="Ex: 43"
                                    className="h-12 rounded-xl border-slate-200 bg-white text-xl font-black text-slate-700 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {weight > 0 && height > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="bg-emerald-50/30 border border-emerald-100 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 shadow-inner animate-in zoom-in-95 duration-500">
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Cálculo automático de IMC</div>
                                    <div className={cn("text-6xl font-black tracking-tighter", getBMIColor(Number(bmi)))}>{bmi}</div>
                                    <div className="flex flex-col items-center">
                                        <Badge className={cn("text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-none shadow-sm",
                                            Number(bmi) < 18.5 ? "bg-blue-500 text-white" :
                                                Number(bmi) < 25 ? "bg-emerald-500 text-white" :
                                                    Number(bmi) < 30 ? "bg-orange-500 text-white" : "bg-red-500 text-white"
                                        )}>
                                            {getBMILabel(Number(bmi))}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-3xl p-4 overflow-hidden shadow-sm">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center border-b pb-2">Parâmetros IMC (OMS)</div>
                                    <div className="space-y-1.5">
                                        {[
                                            { label: "< 18.5", status: "Abaixo do peso", color: "bg-blue-50 text-blue-600" },
                                            { label: "18.5 - 24.9", status: "Peso Normal", color: "bg-emerald-50 text-emerald-600" },
                                            { label: "25.0 - 29.9", status: "Sobrepeso", color: "bg-orange-50 text-orange-600" },
                                            { label: "30.0 - 34.9", status: "Obesidade I", color: "bg-red-50 text-red-600" },
                                            { label: "35.0 - 39.9", status: "Obesidade II", color: "bg-red-100 text-red-700 font-bold" },
                                            { label: "≥ 40", status: "Obesidade III", color: "bg-purple-50 text-purple-700 font-black" },
                                        ].map((row, i) => (
                                            <div key={i} className={cn("flex items-center justify-between px-3 py-1.5 rounded-xl text-[9px] font-medium", row.color)}>
                                                <span>{row.label}</span>
                                                <span className="uppercase tracking-tighter">{row.status}</span>
                                            </div>
                                        ))}
                                    </div>
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
                                    <Input
                                        value={bp}
                                        onChange={handleBPMask}
                                        className="h-10 border-none bg-slate-50 font-black text-base pl-0"
                                        placeholder="120/80"
                                    />
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

                            <div className="p-6 bg-white/100 border border-emerald-200 rounded-[2rem] space-y-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Capacidade Aeróbica (VO2 Est.)</h5>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Cálculo baseado em submáximos</p>
                                    </div>
                                    <Zap className="h-4 w-4 text-emerald-600 animate-pulse" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Método</span>
                                        <select {...register('metrics.vo2_method')} className="w-full h-10 bg-slate-50 border-none rounded-xl text-[10px] font-bold px-3 shadow-inner">
                                            <option value="none">Selecione o método</option>
                                            <option value="rockport">Caminhada (Rockport 1 Mile)</option>
                                            <option value="cooper">Corrida (Cooper 12 min)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Resultado Final (mL/kg/min)</span>
                                        <div className="relative">
                                            <Input
                                                {...register('metrics.vo2_val')}
                                                className="h-10 bg-emerald-50 border-none rounded-xl text-lg font-black text-emerald-700 shadow-inner pl-3"
                                                placeholder="--"
                                                readOnly
                                            />
                                            {vo2Max && (
                                                <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 scale-75 font-black uppercase">Calculado</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {vo2_method === 'rockport' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-1.5">
                                            <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Tempo (MM:SS)</FormLabel>
                                            <Input {...register('metrics.vo2_time')} placeholder="12:30" className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                                        </div>
                                        <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 flex flex-col justify-center">
                                            <span className="text-[8px] font-black text-indigo-400 uppercase mb-1">Nota Técnica</span>
                                            <p className="text-[9px] font-bold text-indigo-800 leading-tight">Requer FC de repouso ({hr || '--'}) e Peso ({weight || '--'}kg) preenchidos.</p>
                                        </div>
                                    </div>
                                )}

                                {vo2_method === 'cooper' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-1.5">
                                            <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Distância (Meters)</FormLabel>
                                            <Input {...register('metrics.vo2_distance')} type="number" placeholder="2400" className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                                        </div>
                                        <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 flex flex-col justify-center">
                                            <span className="text-[8px] font-black text-indigo-400 uppercase mb-1">Cooper Test</span>
                                            <p className="text-[9px] font-bold text-indigo-800 leading-tight">Insira a distância total percorrida em metros durante 12 minutos.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
