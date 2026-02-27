"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface WomensHealthPhysicalAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
}

export function WomensHealthPhysicalAccordion({ openSection, isSectionFilled }: WomensHealthPhysicalAccordionProps) {
    const { register, watch, setValue } = useFormContext();
    const isFilled = isSectionFilled('womens_physical');
    const diastasis = watch('womens_health.perfect.diastasis');

    return (
        <AccordionItem value="womens_physical" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'womens_physical' ? "bg-white border-purple-200 shadow-xl scale-[1.01]" : "bg-purple-50/20 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'womens_physical' ? "bg-purple-600 text-white shadow-lg rotate-12" : "bg-white text-purple-400 shadow-sm group-hover:text-purple-600")}>
                        <Brain className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'womens_physical' ? "text-slate-900" : "text-slate-500")}>3. Exame Físico (PERFECT)</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Esquema Oxford Modificado (MAP)</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-10">
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-[2rem] border border-pink-100/50 shadow-inner">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="font-black text-pink-900 uppercase text-[10px] tracking-[0.2em]">Avaliação MAP - PERFECT Scheme</h4>
                        <Badge className="bg-pink-600 hover:bg-pink-600 text-[9px] font-black uppercase tracking-widest px-3 py-1">Contração Voluntária</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { letter: 'P', label: 'Power', sub: 'Força (0-5)', key: 'power' },
                            { letter: 'E', label: 'Endurance', sub: 'Tempo (s)', key: 'endurance' },
                            { letter: 'R', label: 'Repetitions', sub: 'Quantidade', key: 'repetitions' },
                            { letter: 'F', label: 'Fast', sub: 'Contr. Rápidas', key: 'fast' },
                        ].map(item => (
                            <div key={item.key} className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm flex flex-col items-center gap-3 group hover:scale-105 transition-transform">
                                <span className="text-3xl font-black text-pink-600">{item.letter}</span>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.label}</p>
                                    <p className="text-[8px] font-bold uppercase text-slate-400">{item.sub}</p>
                                </div>
                                <Input
                                    type="number"
                                    {...register(`womens_health.perfect.${item.key}`)}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-2xl text-center shadow-inner focus:ring-pink-500 focus:bg-white transition-all w-full"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diastasis Check */}
                <div className={cn(
                    "flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all",
                    diastasis ? "bg-amber-600 border-amber-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-700 hover:border-amber-200"
                )}>
                    <div className="flex items-center gap-4">
                        <Checkbox
                            id="diastasis"
                            checked={diastasis}
                            onCheckedChange={(c) => setValue('womens_health.perfect.diastasis', !!c, { shouldDirty: true })}
                            className={cn("h-6 w-6 rounded-lg", diastasis ? "bg-white border-white data-[state=checked]:bg-white data-[state=checked]:text-amber-600" : "border-slate-300")}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="diastasis" className={cn("font-black uppercase text-[12px] tracking-widest cursor-pointer", diastasis ? "text-white" : "text-amber-900")}>Diástase Abdominal Presente?</Label>
                            <p className={cn("text-[9px] font-bold uppercase", diastasis ? "text-amber-100" : "text-amber-700/60")}>Separação dos retos abdominais {">"} 2cm.</p>
                        </div>
                    </div>
                    <Activity className={cn("w-10 h-10 transition-opacity", diastasis ? "opacity-100" : "opacity-20")} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
