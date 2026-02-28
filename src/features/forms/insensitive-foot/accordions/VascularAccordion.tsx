"use client";

import React, { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkITBStatus } from "@/utils/clinical-references";

interface Props {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const COLOR_LEFT = "#0055ff";
const COLOR_RIGHT = "#00aa00";

function ITBBadge({ value }: { value: number | null }) {
    if (value === null) return <div className="text-[11px] font-bold px-3 py-1 rounded-xl border bg-slate-100 text-slate-400">--</div>;
    const status = checkITBStatus(value);
    if (!status) return <div className="text-[11px] font-bold px-3 py-1 rounded-xl border bg-slate-100 text-slate-400">{value}</div>;
    return (
        <div className={cn("text-[11px] font-black px-3 py-2 rounded-xl border text-center transition-all duration-300", status.color)}>
            <span className="text-2xl block">{value}</span>
            <span className="uppercase tracking-widest text-[9px]">{status.label}</span>
        </div>
    );
}

export function VascularAccordion({ openSection, isSectionFilled, sectionStyle }: Props) {
    const { register, control } = useFormContext();
    const isFilled = isSectionFilled("vascular");
    const vasc = useWatch({ control, name: "vascular" });

    const itbResults = useMemo(() => {
        const brachialMax = Math.max(
            Number(vasc?.brachial_left || 0),
            Number(vasc?.brachial_right || 0)
        );
        if (brachialMax === 0) return { left: null, right: null };
        const ankleLeft = Math.max(Number(vasc?.pedis_left || 0), Number(vasc?.tibial_left || 0));
        const ankleRight = Math.max(Number(vasc?.pedis_right || 0), Number(vasc?.tibial_right || 0));
        return {
            left: ankleLeft > 0 ? Number((ankleLeft / brachialMax).toFixed(2)) : null,
            right: ankleRight > 0 ? Number((ankleRight / brachialMax).toFixed(2)) : null,
        };
    }, [vasc]);

    return (
        <AccordionItem
            value="vascular"
            className={cn(
                "border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm",
                openSection === "vascular"
                    ? "bg-white border-slate-200 shadow-xl scale-[1.01]"
                    : "bg-slate-50/50 border-transparent hover:bg-white"
            )}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                        openSection === "vascular"
                            ? "bg-red-500 text-white shadow-lg"
                            : "bg-white text-slate-400 shadow-sm group-hover:text-red-500"
                    )}>
                        <HeartPulse className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === "vascular" ? "text-slate-900" : "text-slate-500")}>
                                Avaliação Vascular (ITB)
                            </h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Índice Tornozelo-Braço — Detecção de isquemia periférica
                        </p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                            Pressões Sistólicas (mmHg)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Braquial Esquerdo", field: "brachial_left", color: undefined },
                                { label: "Braquial Direito", field: "brachial_right", color: undefined },
                                { label: "Tibial Post. (E)", field: "tibial_left", color: COLOR_LEFT },
                                { label: "Tibial Post. (D)", field: "tibial_right", color: COLOR_RIGHT },
                                { label: "Pediosa (E)", field: "pedis_left", color: COLOR_LEFT },
                                { label: "Pediosa (D)", field: "pedis_right", color: COLOR_RIGHT },
                            ].map(({ label, field, color }) => (
                                <div key={field} className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400" style={color ? { color } : undefined}>
                                        {label}
                                    </Label>
                                    <Input
                                        type="number"
                                        {...register(`vascular.${field}`)}
                                        className="h-12 rounded-xl border-slate-200 bg-white text-center font-black text-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ITB Result */}
                    <div className="flex flex-col justify-center items-center bg-slate-50 rounded-2xl p-6 border gap-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                            Resultado ITB
                        </h3>
                        <div className="flex gap-8">
                            <div className="text-center space-y-2">
                                <span className="text-[10px] font-black uppercase block" style={{ color: COLOR_LEFT }}>Pé Esquerdo</span>
                                <ITBBadge value={itbResults.left} />
                            </div>
                            <div className="text-center space-y-2">
                                <span className="text-[10px] font-black uppercase block" style={{ color: COLOR_RIGHT }}>Pé Direito</span>
                                <ITBBadge value={itbResults.right} />
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-400 bg-white p-3 rounded-xl border max-w-xs text-center leading-relaxed">
                            <strong>ITB</strong> = Maior pressão tornozelo / Maior pressão braquial.
                            <br />Normal: 0.9–1.3 | Isquemia: &lt;0.9 | Calcificação: &gt;1.3
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
