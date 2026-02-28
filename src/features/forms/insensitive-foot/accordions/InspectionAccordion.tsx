"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Thermometer, CheckCircle2, Flame, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const COLOR_LEFT = "#0055ff";
const COLOR_RIGHT = "#00aa00";

const INSPECTION_CHECKS = [
    { id: "callosity", label: "Calosidades" },
    { id: "fissures", label: "Fissuras" },
    { id: "mycosis", label: "Micoses" },
    { id: "edema", label: "Edema" },
    { id: "thermal", label: "Temp. Alterada", alert: true },
    { id: "hyperemia", label: "Hiperemia" },
    { id: "deformities", label: "Deformidades" },
    { id: "wound", label: "Úlcera / Ferida", alert: true },
    { id: "amputations", label: "Amputações", alert: true },
];

export function InspectionAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { watch, setValue, register } = useFormContext();
    const isFilled = isSectionFilled("inspection");

    return (
        <AccordionItem
            value="inspection"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "inspection"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "inspection"
                            ? "bg-orange-500 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-orange-500"
                    )}>
                        <Thermometer className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "inspection" ? "text-slate-900" : "text-slate-500")}>
                                Inspeção, Pele e Temperatura
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Avaliação dermatológica, deformidades e sinais de alerta
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    {(["left", "right"] as const).map(side => {
                        const isThermal = watch(`inspection.${side}.thermal`);
                        const isWound = watch(`inspection.${side}.wound`);
                        return (
                            <div key={side} className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest"
                                        style={{ color: side === "left" ? COLOR_LEFT : COLOR_RIGHT }}>
                                        Pé {side === "left" ? "Esquerdo" : "Direito"}
                                    </h4>
                                    {(isThermal || isWound) && (
                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse text-[9px]">
                                            <Flame className="w-3 h-3 mr-1" /> ALERTA
                                        </Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {INSPECTION_CHECKS.map(check => {
                                        const checked = watch(`inspection.${side}.${check.id}`);
                                        return (
                                            <div
                                                key={check.id}
                                                className={cn(
                                                    "flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer",
                                                    checked && check.alert ? "bg-red-50 border-red-200 shadow-sm" :
                                                        checked ? "bg-orange-50 border-orange-200 shadow-sm" :
                                                            "bg-white border-slate-100"
                                                )}
                                                onClick={() => setValue(`inspection.${side}.${check.id}` as any, !checked)}
                                            >
                                                <Checkbox
                                                    checked={!!checked}
                                                    onCheckedChange={(v) => setValue(`inspection.${side}.${check.id}` as any, !!v)}
                                                />
                                                <span className={cn(
                                                    "text-[11px] font-bold",
                                                    checked && check.alert ? "text-red-700" :
                                                        checked ? "text-orange-700" : "text-slate-600"
                                                )}>
                                                    {check.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {isThermal && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-900 text-[10px] items-start">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                                        <p>
                                            <strong>ALERTA DE CHARCOT:</strong> Aumento de temperatura local é sinal crítico
                                            para fase aguda da Neuroartropatia de Charcot. Monitorar imediatamente.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Nail care */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
                        Higiene e Corte das Unhas
                    </Label>
                    <Select
                        value={watch("inspection.nailCare") || "good"}
                        onValueChange={(v) => setValue("inspection.nailCare", v)}
                    >
                        <SelectTrigger className="bg-white rounded-xl h-12">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="good">✅ Adequado (Corte reto, sem encravar)</SelectItem>
                            <SelectItem value="regular">⚠️ Regular (Corte curto demais ou irregular)</SelectItem>
                            <SelectItem value="critical">🚨 Crítico (Encravada / Onicomicose severa)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
