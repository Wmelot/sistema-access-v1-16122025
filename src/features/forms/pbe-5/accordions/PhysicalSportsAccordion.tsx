"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bike, CheckCircle2, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PhysicalSportsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string, iconColor: string, bg: string };
}

export function PhysicalSportsAccordion({ openSection, isSectionFilled, sectionStyle }: PhysicalSportsAccordionProps) {
    const { control, register } = useFormContext();
    const isFilled = isSectionFilled('sports');

    return (
        <AccordionItem value="sports" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'sports' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'sports' ? "bg-emerald-600 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-emerald-600")}>
                        <Bike className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'sports' ? "text-slate-900" : "text-slate-500")}>Rotina Desportiva & Atividade</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Modalidades, Frequência e Nível (IPAQ)</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Routine Details */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-emerald-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Detalhes do Treinamento</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Qual esporte/atividade pratica?</Label>
                                <div className="relative group">
                                    <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                                    <Input {...register('sports.activity')} placeholder="Ex: Crossfit, Corrida, Musculação..." className="h-14 pl-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Freq. Semanal</Label>
                                    <Input type="number" {...register('sports.frequency')} placeholder="Dias/semana" className="h-12 rounded-xl border-slate-200 bg-white font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Duração Média</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input type="number" {...register('sports.duration')} placeholder="Minutos" className="h-12 pl-10 rounded-xl border-slate-200 bg-white font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* IPAQ Classification */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-emerald-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Nível de Atividade (IPAQ)</h4>
                        </div>
                        <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 flex flex-col gap-4">
                            <p className="text-[10px] font-bold text-slate-500 uppercase leading-snug">Baseado no Questionário Internacional de Atividade Física:</p>
                            <Controller
                                name="sports.ipaq"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-14 rounded-2xl border-emerald-200 bg-white font-black text-emerald-900 shadow-sm">
                                            <SelectValue placeholder="Selecione o nível..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="sedentary" className="font-bold py-3">Sedentário (Nenhuma AT)</SelectItem>
                                            <SelectItem value="insufficiently" className="font-bold py-3">Insuficientemente Ativo</SelectItem>
                                            <SelectItem value="active" className="font-bold py-3">Ativo (150min+/sem)</SelectItem>
                                            <SelectItem value="very_active" className="font-bold py-3">Muito Ativo (300min+/sem)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                <p className="text-[9px] font-bold text-emerald-700/70 uppercase tracking-tighter">
                                    Mínimo recomendado pela OMS: 150-300 min de atividade moderada ou 75-150 min de vigorosa por semana.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
