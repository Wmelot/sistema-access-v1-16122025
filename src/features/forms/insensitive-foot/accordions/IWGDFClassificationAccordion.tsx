"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const IWGDF_LEVELS = [
    {
        value: "0",
        color: "bg-emerald-50 border-emerald-200 text-emerald-900",
        badge: "Baixo Risco",
        badgeColor: "bg-emerald-100 text-emerald-700",
        desc: "Sensibilidade e circulação preservadas. Rastreio anual.",
        followUp: "12 meses"
    },
    {
        value: "1",
        color: "bg-amber-50 border-amber-200 text-amber-900",
        badge: "Risco Moderado",
        badgeColor: "bg-amber-100 text-amber-700",
        desc: "Perda de sensibilidade protetora OU isquemia periférica. Rastreio semestral.",
        followUp: "6 meses"
    },
    {
        value: "2",
        color: "bg-orange-50 border-orange-200 text-orange-900",
        badge: "Risco Elevado",
        badgeColor: "bg-orange-100 text-orange-700",
        desc: "Perda de sensibilidade + Deformidade ou Isquemia. Rastreio trimestral.",
        followUp: "3 meses"
    },
    {
        value: "3",
        color: "bg-red-50 border-red-200 text-red-900",
        badge: "Risco Muito Elevado",
        badgeColor: "bg-red-100 text-red-700",
        desc: "Histórico de úlcera, amputação ou Charcot ativo. Rastreio 1–2 meses.",
        followUp: "1–2 meses"
    },
];

export function IWGDFClassificationAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { watch, setValue } = useFormContext();
    const isFilled = isSectionFilled("classification");
    const level = watch("classification.iwgdfLevel") || "0";
    const activeLevel = IWGDF_LEVELS.find(l => l.value === String(level)) || IWGDF_LEVELS[0];

    return (
        <AccordionItem
            value="classification"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "classification"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "classification"
                            ? "bg-violet-600 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-violet-600"
                    )}>
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "classification" ? "text-slate-900" : "text-slate-500")}>
                                Classificação do Risco (IWGDF)
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Score internacional de risco para ulceração do pé diabético
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {IWGDF_LEVELS.map(lvl => (
                            <button
                                key={lvl.value}
                                type="button"
                                onClick={() => setValue("classification.iwgdfLevel", lvl.value)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left space-y-2",
                                    level === lvl.value
                                        ? `${lvl.color} shadow-lg scale-[1.02] border-current`
                                        : "bg-white border-slate-100 hover:border-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full inline-block",
                                    level === lvl.value ? lvl.badgeColor : "bg-slate-100 text-slate-400"
                                )}>
                                    Nível {lvl.value}
                                </div>
                                <div className={cn("text-xs font-black leading-tight", level === lvl.value ? "" : "text-slate-600")}>
                                    {lvl.badge}
                                </div>
                                <div className="text-[9px] opacity-70">{lvl.desc}</div>
                            </button>
                        ))}
                    </div>

                    {/* Active level summary */}
                    <div className={cn(
                        "p-5 rounded-2xl border-2 space-y-3 transition-all",
                        activeLevel.color
                    )}>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Nível Selecionado</span>
                                <h3 className="text-lg font-black">{activeLevel.badge}</h3>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase opacity-60">Frequência de Retorno</span>
                                <div className="text-xl font-black">{activeLevel.followUp}</div>
                            </div>
                        </div>
                        <p className="text-xs opacity-80 leading-relaxed">{activeLevel.desc}</p>
                        <p className="text-[10px] font-black uppercase opacity-50">
                            Protocolo IWGDF (International Working Group on the Diabetic Foot) — Evidência Grau A
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
