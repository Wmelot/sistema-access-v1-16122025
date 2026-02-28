"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const MUSCLE_GRADES = [0, 1, 2, 3, 4, 5];

export function BiomechanicalAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { register, watch, setValue } = useFormContext();
    const isFilled = isSectionFilled("biomechanical");

    return (
        <AccordionItem
            value="biomechanical"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "biomechanical"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "biomechanical"
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-green-600"
                    )}>
                        <Activity className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "biomechanical" ? "text-slate-900" : "text-slate-500")}>
                                Medidas Biomecânicas (Marcha & Postura)
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Força muscular MMII, ADM, marcha e pressão plantar
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amplitude de movimento */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                            Amplitude de Movimento (Tornozelo)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Flexão Dorsal (E)", field: "biomechanical.flexibility.left" },
                                { label: "Flexão Dorsal (D)", field: "biomechanical.flexibility.right" },
                                { label: "ADM Total (E)", field: "biomechanical.rangeOfMotion.left" },
                                { label: "ADM Total (D)", field: "biomechanical.rangeOfMotion.right" },
                            ].map(({ label, field }) => (
                                <div key={field} className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">{label}</Label>
                                    <Input
                                        {...register(field as any)}
                                        placeholder="Graus..."
                                        className="h-12 rounded-xl border-slate-200 bg-white text-center font-black text-lg"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Avaliação da Marcha / Padrão Postural
                            </Label>
                            <Textarea
                                {...register("biomechanical.gait")}
                                className="min-h-[100px] rounded-xl border-slate-200 bg-white resize-none"
                                placeholder="Ex: Marcha antálgica, redução da propulsão, alinhamento pélvico..."
                            />
                        </div>
                    </div>

                    {/* Força muscular */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                            Força Muscular MMII (Escala MRC 0–5)
                        </h4>
                        {[
                            { label: "Extensores Hálux/Dedos", field: "biomechanical.strength.toe" },
                            { label: "Tríceps Sural (Flexão Plantar)", field: "biomechanical.strength.calf" },
                            { label: "Tibial Anterior (E)", field: "biomechanical.strength.tibialis_left" },
                            { label: "Tibial Anterior (D)", field: "biomechanical.strength.tibialis_right" },
                        ].map(({ label, field }) => (
                            <div key={field} className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">{label}</Label>
                                <Select
                                    value={watch(field as any) || ""}
                                    onValueChange={(v) => setValue(field as any, v)}
                                >
                                    <SelectTrigger className="bg-white rounded-xl h-12 text-sm font-bold">
                                        <SelectValue placeholder="Selecione o grau..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MUSCLE_GRADES.map(g => (
                                            <SelectItem key={g} value={String(g)}>
                                                Grau {g} — {g === 0 ? "Sem contração" : g === 1 ? "Contração sem movimento" : g === 2 ? "Movimento sem gravidade" : g === 3 ? "Contra a gravidade" : g === 4 ? "Contra resistência parcial" : "Força normal"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
