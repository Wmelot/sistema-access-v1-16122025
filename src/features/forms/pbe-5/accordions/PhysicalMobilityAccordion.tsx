"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler, CheckCircle2, MoveDiagonal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhysicalMobilityAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string, iconColor: string, bg: string };
}

export function PhysicalMobilityAccordion({ openSection, isSectionFilled, sectionStyle }: PhysicalMobilityAccordionProps) {
    const { control, register } = useFormContext();
    const isFilled = isSectionFilled('mobility');

    return (
        <AccordionItem value="mobility" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'mobility' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'mobility' ? "bg-indigo-600 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-indigo-600")}>
                        <MoveDiagonal className="h-6 w-6 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'mobility' ? "text-slate-900" : "text-slate-500")}>Mobilidade e Flexibilidade</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Banco de Wells, Leg Raise e Alcance Ombro</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-10">
                {/* Banco de Wells */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Banco de Wells (Sentar e Alcançar)</h4>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Resultado Final</p>
                            <Input
                                type="number"
                                step="0.1"
                                {...register('mobility.wells')}
                                placeholder="cm"
                                className="h-14 rounded-xl border-slate-200 bg-white font-black text-2xl text-center shadow-sm w-32"
                            />
                        </div>
                        <div className="h-1 w-24 bg-slate-200 rounded-full hidden md:block" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-snug max-w-[200px]">
                            Mede a flexibilidade da cadeia posterior e coluna lombar.
                        </p>
                    </div>
                </div>

                {/* Elevação Perna Reta */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Elevação Perna Reta (Graus)</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2 text-center">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direita (R)</Label>
                            <Input type="number" {...register('mobility.legRaiseRight')} placeholder="º" className="h-16 rounded-[2rem] border-slate-200 bg-white font-black text-3xl text-center shadow-inner" />
                        </div>
                        <div className="space-y-2 text-center">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Esquerda (L)</Label>
                            <Input type="number" {...register('mobility.legRaiseLeft')} placeholder="º" className="h-16 rounded-[2rem] border-slate-200 bg-white font-black text-3xl text-center shadow-inner" />
                        </div>
                    </div>
                </div>

                {/* Alcance Posterior Ombro */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Alcance Posterior (Ombros - cm)</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2 text-center bg-indigo-50/30 p-4 rounded-3xl border border-indigo-100/50">
                            <Label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Direito por Cima</Label>
                            <Input type="number" step="0.1" {...register('mobility.shoulderReachRight')} placeholder="cm" className="h-14 rounded-2xl border-indigo-200 bg-white font-black text-2xl text-center shadow-sm" />
                        </div>
                        <div className="space-y-2 text-center bg-indigo-50/30 p-4 rounded-3xl border border-indigo-100/50">
                            <Label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Esquerdo por Cima</Label>
                            <Input type="number" step="0.1" {...register('mobility.shoulderReachLeft')} placeholder="cm" className="h-14 rounded-2xl border-indigo-200 bg-white font-black text-2xl text-center shadow-sm" />
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
