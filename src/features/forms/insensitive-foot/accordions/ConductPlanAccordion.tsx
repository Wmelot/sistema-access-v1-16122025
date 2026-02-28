"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ClipboardList, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const INSOLE_ELEMENTS = [
    "Barra Metatarsal",
    "Acomodação de Úlcera (janela/escavação)",
    "Suporte de Arco Longitudinal Medial",
    "Cunha de Retropé (varo/valgo)",
    "Desvio de Pressão Plantar",
    "Coxim Calcâneo",
    "Material EVA de Baixa Dureza (Shore A ≤30)",
    "Revestimento Termoconformável",
    "Análise Baropodométrica Indicada",
];

export function ConductPlanAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { register, watch, setValue } = useFormContext();
    const isFilled = isSectionFilled("plan");
    const returnDays = watch("plan.returnDays") as number ?? 90;

    const selectedElements: string[] = watch("plan.insoleElements") || [];

    const toggleElement = (el: string) => {
        if (selectedElements.includes(el)) {
            setValue("plan.insoleElements", selectedElements.filter(e => e !== el));
        } else {
            setValue("plan.insoleElements", [...selectedElements, el]);
        }
    };

    return (
        <AccordionItem
            value="plan"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "plan"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "plan"
                            ? "bg-teal-600 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-teal-600"
                    )}>
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "plan" ? "text-slate-900" : "text-slate-500")}>
                                Planejamento, Orientações & Conduta
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Prescrição de palmilha, orientações preventivas e retorno
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Text fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Orientações Preventivas
                            </Label>
                            <Textarea
                                {...register("plan.orientations")}
                                className="min-h-[150px] rounded-xl border-slate-200 bg-white resize-none"
                                placeholder="Ex: Hidratação com creme à base de ureia, auto-exame diário com espelho, não andar descalço, calçados de proteção..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                Observações Adicionais / Encaminhamentos
                            </Label>
                            <Textarea
                                {...register("plan.notes")}
                                className="min-h-[80px] rounded-xl border-slate-200 bg-white resize-none"
                                placeholder="Ex: Encaminhar para médico vascular, podologia, nutricionista..."
                            />
                        </div>
                    </div>

                    {/* Right: Insole prescription + return */}
                    <div className="space-y-4">
                        {/* Insole elements */}
                        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                            <Label className="text-[11px] font-black text-teal-900 uppercase tracking-widest mb-3 block">
                                🦶 Prescrição de Palmilha Pé Insensível
                            </Label>
                            <div className="space-y-2">
                                {INSOLE_ELEMENTS.map(el => {
                                    const isSelected = selectedElements.includes(el);
                                    return (
                                        <button
                                            key={el}
                                            type="button"
                                            onClick={() => toggleElement(el)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-xl border text-[11px] font-bold transition-all",
                                                isSelected
                                                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-200 hover:bg-teal-50/50"
                                            )}
                                        >
                                            {isSelected ? "✓ " : "+ "}{el}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Return days */}
                        <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100">
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-[11px] font-black text-teal-900 uppercase tracking-widest">
                                    Programar Retorno
                                </Label>
                                <span className="text-2xl font-black text-teal-600">{returnDays} dias</span>
                            </div>
                            <Slider
                                max={365}
                                step={30}
                                value={[returnDays]}
                                onValueChange={(v) => setValue("plan.returnDays", v[0])}
                                className="my-2"
                            />
                            <p className="text-[10px] text-teal-500 font-bold mt-2 uppercase tracking-widest text-center">
                                Sugestão IWGDF: Nível 0=12m | Nível 1=6m | Nível 2=3m | Nível 3=1-2m
                            </p>
                        </div>

                        <div className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest">
                            <ShieldCheck className="h-4 w-4 inline mr-1 text-teal-400" />
                            A conformidade com o IWGDF reduz em 50% o risco de amputações
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
