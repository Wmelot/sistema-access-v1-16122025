"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Stethoscope, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function AnamnesisMetabolicAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { register, watch, setValue } = useFormContext();
    const isFilled = isSectionFilled("hma");
    const glucoseControl = watch("hma.glucoseControl") ?? 5;

    return (
        <AccordionItem
            value="hma"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "hma"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "hma"
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-blue-600"
                    )}>
                        <Stethoscope className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "hma" ? "text-slate-900" : "text-slate-500")}>
                                Anamnese e Controle Metabólico
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Queixa principal, HMA, diabetes e medicamentos
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Queixa Principal (QP)
                            </Label>
                            <Input
                                {...register("hma.qp")}
                                className="h-12 rounded-xl border-slate-200 bg-white"
                                placeholder="Motivo da consulta..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                História da Moléstia Atual (HMA)
                            </Label>
                            <Textarea
                                {...register("hma.history")}
                                className="min-h-[120px] rounded-xl border-slate-200 bg-white resize-none"
                                placeholder="Descreva o histórico clínico e sintomas..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Medicamentos / Drogas em Uso
                            </Label>
                            <Input {...register("hma.drugsInUse")} className="h-12 rounded-xl border-slate-200 bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Exames Complementares
                            </Label>
                            <Input {...register("hma.extraExams")} className="h-12 rounded-xl border-slate-200 bg-white" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <div className="flex justify-between mb-4">
                                <Label className="text-blue-900 font-black text-[11px] uppercase tracking-widest">
                                    Controle da Glicose e Dieta
                                </Label>
                                <span className="text-2xl font-black text-blue-600">{glucoseControl}/10</span>
                            </div>
                            <Slider
                                max={10}
                                step={1}
                                value={[glucoseControl]}
                                onValueChange={(v) => setValue("hma.glucoseControl", v[0])}
                                className="my-2"
                            />
                            <p className="text-[10px] text-blue-400 font-bold mt-2 uppercase tracking-widest">
                                0 = Descontrolado | 10 = Excelente controle
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Atividade Física Habitual
                            </Label>
                            <Input
                                {...register("hma.physicalActivity")}
                                className="h-12 rounded-xl border-slate-200 bg-white"
                                placeholder="Ex: Caminhada 3x/semana..."
                            />
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
