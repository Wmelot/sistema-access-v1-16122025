"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WomensHealthComplaintsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
}

const RED_FLAGS = [
    { id: 'vaginalBleeding', label: 'Sangramento Vaginal Recente' },
    { id: 'amnioticFluidLeak', label: 'Perda de Líquido Amniótico' },
    { id: 'severeHeadache', label: 'Dor de Cabeça Severa / Visão Turva' },
    { id: 'reducedFetalMovement', label: 'Redução de Movimentos Fetais' },
];

const COMPLAINTS = [
    { id: 'stressUrinaryIncontinence', label: 'Incontinência aos Esforços' },
    { id: 'urgeIncontinence', label: 'Urgência Miccional' },
    { id: 'nocturia', label: 'Noctúria (>2x à noite)' },
    { id: 'prolapseSensation', label: 'Sensação de Peso (Prolapso)' },
    { id: 'constipation', label: 'Constipação Intestinal' },
    { id: 'dyspareunia', label: 'Dor na Relação (Dispareunia)' },
];

export function WomensHealthComplaintsAccordion({ openSection, isSectionFilled }: WomensHealthComplaintsAccordionProps) {
    const { control, watch } = useFormContext();
    const isFilled = isSectionFilled('womens_complaints');

    const redFlags = watch('womens_health.redFlags') || {};
    const hasRedFlags = Object.values(redFlags).some(Boolean);

    return (
        <AccordionItem value="womens_complaints" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'womens_complaints' ? "bg-white border-pink-200 shadow-xl scale-[1.01]" : "bg-pink-50/20 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'womens_complaints' ? "bg-rose-600 text-white shadow-lg rotate-12" : "bg-white text-rose-400 shadow-sm group-hover:text-rose-600")}>
                        <Activity className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'womens_complaints' ? "text-slate-900" : "text-slate-500")}>2. Queixas & Sintomas</h3>
                            {hasRedFlags && <Badge className="bg-rose-100 text-rose-700 text-[9px] font-black tracking-widest border-rose-200">RED FLAG</Badge>}
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Triagem de Riscos e Disfunções Pélvicas</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-10">
                {/* Red Flags Triage */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={cn("h-4 w-4", hasRedFlags ? "text-rose-600" : "text-slate-300")} />
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Triagem Gestante (Red Flags)</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {RED_FLAGS.map(flag => (
                            <Controller
                                key={flag.id}
                                name={`womens_health.redFlags.${flag.id}`}
                                control={control}
                                render={({ field }) => (
                                    <div className={cn(
                                        "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                        field.value ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100 hover:border-rose-100"
                                    )} onClick={() => field.onChange(!field.value)}>
                                        <Checkbox checked={field.value} className="data-[state=checked]:bg-rose-600 border-rose-200" />
                                        <Label className="text-[11px] font-black uppercase text-slate-700 tracking-tight cursor-pointer">{flag.label}</Label>
                                    </div>
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Functional Complaints */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-pink-600 rounded-full" />
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Queixas Funcionais</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {COMPLAINTS.map(item => (
                            <Controller
                                key={item.id}
                                name={`womens_health.complaints.${item.id}`}
                                control={control}
                                render={({ field }) => (
                                    <div className={cn(
                                        "p-4 rounded-2xl border transition-all cursor-pointer h-full flex flex-col justify-between gap-3",
                                        field.value ? "bg-pink-600 border-pink-600 text-white shadow-lg" : "bg-white border-slate-100 hover:border-pink-200"
                                    )} onClick={() => field.onChange(!field.value)}>
                                        <span className={cn("text-[10px] font-black uppercase tracking-tight", field.value ? "text-white" : "text-slate-700")}>{item.label}</span>
                                        <div className="flex justify-end">
                                            {field.value ? <CheckCircle2 className="h-4 w-4 text-pink-200" /> : <div className="h-2 w-2 rounded-full border border-slate-200" />}
                                        </div>
                                    </div>
                                )}
                            />
                        ))}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
