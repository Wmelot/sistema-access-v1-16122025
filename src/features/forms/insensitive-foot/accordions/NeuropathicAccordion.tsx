"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const MONOFILAMENT_POINTS = [
    { id: "hallux", label: "Hálux (Polpa)" },
    { id: "meta1", label: "1ª Cabeça Meta" },
    { id: "meta3", label: "3ª Cabeça Meta" },
    { id: "meta5", label: "5ª Cabeça Meta" },
];

const COLOR_LEFT = "#0055ff";
const COLOR_RIGHT = "#00aa00";

export function NeuropathicAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { watch, setValue } = useFormContext();
    const isFilled = isSectionFilled("neuropathic");

    const totalPreserved = (side: string) => {
        return MONOFILAMENT_POINTS.filter(p => watch(`neuropathic.${side}.${p.id}`)).length;
    };

    return (
        <AccordionItem
            value="neuropathic"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "neuropathic"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "neuropathic"
                            ? "bg-amber-500 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-amber-500"
                    )}>
                        <Zap className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "neuropathic" ? "text-slate-900" : "text-slate-500")}>
                                Sensibilidade Protetora (Monofilamento 10g)
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Rastreio de neuropatia periférica nos 4 pontos-chave
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {(["left", "right"] as const).map(side => {
                        const preserved = totalPreserved(side);
                        const hasRisk = preserved < 4;
                        return (
                            <div key={side} className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <h4 className="text-sm font-black uppercase tracking-widest"
                                        style={{ color: side === "left" ? COLOR_LEFT : COLOR_RIGHT }}>
                                        Pé {side === "left" ? "Esquerdo" : "Direito"}
                                    </h4>
                                    <span className={cn(
                                        "text-[10px] font-black px-2 py-1 rounded-full uppercase",
                                        preserved === 4 ? "bg-emerald-100 text-emerald-700" :
                                            preserved >= 2 ? "bg-amber-100 text-amber-700" :
                                                "bg-red-100 text-red-700"
                                    )}>
                                        {preserved}/4 preservados
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {MONOFILAMENT_POINTS.map(point => {
                                        const checked = watch(`neuropathic.${side}.${point.id}`);
                                        return (
                                            <div
                                                key={point.id}
                                                className={cn(
                                                    "flex items-center space-x-3 p-3 rounded-xl border shadow-sm transition-all",
                                                    checked ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"
                                                )}
                                            >
                                                <Checkbox
                                                    id={`${side}-${point.id}`}
                                                    checked={!!checked}
                                                    onCheckedChange={(v) =>
                                                        setValue(`neuropathic.${side}.${point.id}` as any, !!v)
                                                    }
                                                />
                                                <label
                                                    htmlFor={`${side}-${point.id}`}
                                                    className="text-xs font-bold text-slate-600 cursor-pointer"
                                                >
                                                    {point.label}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {hasRisk && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-amber-900 text-[10px] items-start">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                        <p>
                                            <strong>Perda de Sensibilidade Protetora:</strong> Risco elevado para IWGDF ≥1.
                                            Paciente com pontos sem resposta ao monofilamento de 10g.
                                        </p>
                                    </div>
                                )}
                                <p className="text-[10px] text-center text-slate-400 font-medium">
                                    ✓ Marque se sensibilidade ao monofilamento estiver <strong>PRESERVADA</strong>
                                </p>
                            </div>
                        );
                    })}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
