"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Scan, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const SHOE_FEATURES = [
    "Solado com Rocker Sole",
    "Contraforte firme",
    "Sem costura interna",
    "Palmilha removível",
    "Material respirável",
    "Fechamento regulável (velcro/cadarço)",
    "Bico Largo (espaço para dedos)",
    "Profundidade extra",
];

export function FootwearAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { register, watch, setValue, getValues } = useFormContext();
    const isFilled = isSectionFilled("footwear");
    const condition = watch("footwear.condition") || "good";

    return (
        <AccordionItem
            value="footwear"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "footwear"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "footwear"
                            ? "bg-sky-600 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-sky-600"
                    )}>
                        <Scan className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "footwear" ? "text-slate-900" : "text-slate-500")}>
                                Inspeção de Calçados
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Tipo de calçado, características e estado de conservação
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Calçado Predominante (uso diário)
                            </Label>
                            <Input
                                {...register("footwear.currentShoes")}
                                placeholder="Ex: Tênis esportivo, Sapato social, Sandália..."
                                className="h-12 rounded-xl border-slate-200 bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Características Presentes
                            </Label>
                            <div className="grid grid-cols-1 gap-2">
                                {SHOE_FEATURES.map(feature => {
                                    const current: string[] = watch("footwear.features") || [];
                                    const checked = current.includes(feature);
                                    return (
                                        <div
                                            key={feature}
                                            className={cn(
                                                "flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer",
                                                checked ? "bg-sky-50 border-sky-200" : "bg-white border-slate-100 hover:border-sky-100"
                                            )}
                                            onClick={() => {
                                                const curr = getValues("footwear.features") || [];
                                                setValue("footwear.features",
                                                    checked ? curr.filter((i: string) => i !== feature) : [...curr, feature]
                                                );
                                            }}
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={() => {
                                                    const curr = getValues("footwear.features") || [];
                                                    setValue("footwear.features",
                                                        checked ? curr.filter((i: string) => i !== feature) : [...curr, feature]
                                                    );
                                                }}
                                            />
                                            <span className="text-[11px] font-bold text-slate-600">{feature}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100">
                            <h4 className="text-xs font-black text-sky-900/50 uppercase tracking-widest text-center mb-4">
                                Estado do Calçado
                            </h4>
                            <div className="flex flex-col gap-3">
                                {[
                                    { value: "good", label: "✅ Adequado", desc: "Corte reto, sem pontos de pressure" },
                                    { value: "worn", label: "⚠️ Desgastado", desc: "Solado irregular, perda de suporte" },
                                    { value: "critical", label: "🚨 Substituir Imediatamente", desc: "Risco imediato de lesão" },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setValue("footwear.condition", opt.value)}
                                        className={cn(
                                            "px-4 py-3 rounded-2xl text-xs font-bold border transition-all text-left",
                                            condition === opt.value
                                                ? "bg-sky-600 text-white border-sky-600 shadow-md"
                                                : "bg-white text-sky-700 border-sky-200 hover:bg-sky-50"
                                        )}
                                    >
                                        <div className="font-black">{opt.label}</div>
                                        <div className={cn("text-[10px] mt-0.5", condition === opt.value ? "text-sky-100" : "text-slate-400")}>
                                            {opt.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
