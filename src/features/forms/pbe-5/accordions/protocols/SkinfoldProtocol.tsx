"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Activity, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SkinfoldProtocolProps {
    gender: 'male' | 'female';
    age: number;
    weight: number;
}

export function SkinfoldProtocol({ gender, age, weight }: SkinfoldProtocolProps) {
    const { control, register, watch } = useFormContext();
    const method = watch('antro.skinfoldMethod') || 'pollock7';

    // Skinfolds
    const triceps = Number(watch('antro.folds.triceps')) || 0;
    const subscapular = Number(watch('antro.folds.subscapular')) || 0;
    const suprailiac = Number(watch('antro.folds.suprailiac')) || 0;
    const abdominal = Number(watch('antro.folds.abdominal')) || 0;
    const chest = Number(watch('antro.folds.chest')) || 0;
    const midaxillary = Number(watch('antro.folds.midaxillary')) || 0;
    const thigh = Number(watch('antro.folds.thigh')) || 0;

    const result = React.useMemo(() => {
        if (!age || !weight) return null;

        let density = 0;
        let sum = 0;

        if (method === 'pollock7') {
            sum = triceps + subscapular + suprailiac + abdominal + chest + midaxillary + thigh;
            if (sum === 0) return null;

            if (gender === 'male') {
                density = 1.112 - (0.00043499 * sum) + (0.00000055 * (sum * sum)) - (0.00028826 * age);
            } else {
                density = 1.097 - (0.00046971 * sum) + (0.00000056 * (sum * sum)) - (0.00012828 * age);
            }
        } else if (method === 'guedes') {
            // Guedes uses Triceps, Suprailiac and Abdominal (or Subscapular depending on version, here using 3 standard)
            sum = triceps + suprailiac + abdominal;
            if (sum === 0) return null;

            if (gender === 'male') {
                density = 1.17136 - (0.06706 * Math.log10(sum));
            } else {
                density = 1.13338 - (0.03812 * Math.log10(sum));
            }
        }

        const fatPercent = (4.95 / density - 4.50) * 100;
        const fatMass = weight * (fatPercent / 100);
        const leanMass = weight - fatMass;

        return {
            fatPercent: Math.max(0, fatPercent),
            fatMass,
            leanMass,
            sum
        };
    }, [method, gender, age, weight, triceps, subscapular, suprailiac, abdominal, chest, midaxillary, thigh]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Protocolo de Dobras Cutâneas (Plicometria)</h4>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Escolha o método e insira as medidas em milímetros (mm)</p>
                </div>

                <div className="w-full md:w-64">
                    <Controller
                        name="antro.skinfoldMethod"
                        control={control}
                        defaultValue="pollock7"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold text-[11px] shadow-sm">
                                    <SelectValue placeholder="Método..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="pollock7" className="font-bold text-xs py-2">Pollock 7 Dobras</SelectItem>
                                    <SelectItem value="guedes" className="font-bold text-xs py-2">Guedes (3 Dobras)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Triceptal</Label>
                    <Input type="number" step="0.1" {...register('antro.folds.triceps')} className="h-12 rounded-xl border-slate-200 font-bold text-center" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Supra-ilíaca</Label>
                    <Input type="number" step="0.1" {...register('antro.folds.suprailiac')} className="h-12 rounded-xl border-slate-200 font-bold text-center" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Abdominal</Label>
                    <Input type="number" step="0.1" {...register('antro.folds.abdominal')} className="h-12 rounded-xl border-slate-200 font-bold text-center" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Coxa</Label>
                    <Input type="number" step="0.1" {...register('antro.folds.thigh')} className="h-12 rounded-xl border-slate-200 font-bold text-center" />
                </div>

                {method === 'pollock7' && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Subescapular</Label>
                            <Input type="number" step="0.1" {...register('antro.folds.subscapular')} className="h-12 rounded-xl border-slate-200 font-bold text-center" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Peitoral</Label>
                            <Input type="number" step="0.1" {...register('antro.folds.chest')} className="h-12 rounded-xl border-slate-200 font-bold text-center" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Axilar Média</Label>
                            <Input type="number" step="0.1" {...register('antro.folds.midaxillary')} className="h-12 rounded-xl border-slate-200 font-bold text-center" />
                        </div>
                    </>
                )}
            </div>

            {result && (
                <div className="bg-blue-50 rounded-[2rem] p-8 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner animate-in zoom-in-95">
                    <div className="flex-1 space-y-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700/70">Composição (Plicometria)</span>
                        </div>
                        <div className="flex items-baseline justify-center md:justify-start gap-2">
                            <span className="text-6xl font-black text-blue-900 tabular-nums">{result.fatPercent.toFixed(1)}</span>
                            <span className="text-2xl font-black text-blue-600">% Gordura</span>
                        </div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-2">SOMA DAS DOBRAS: {result.sum.toFixed(1)} mm</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
                        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Massa Gorda</span>
                            <span className="font-black text-blue-900">{result.fatMass.toFixed(1)} kg</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Massa Magra</span>
                            <span className="font-black text-blue-900">{result.leanMass.toFixed(1)} kg</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
