"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Baby, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WomensHealthObstetricAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
}

export function WomensHealthObstetricAccordion({ openSection, isSectionFilled }: WomensHealthObstetricAccordionProps) {
    const { control, register } = useFormContext();
    const isFilled = isSectionFilled('womens_obstetric');

    return (
        <AccordionItem value="womens_obstetric" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'womens_obstetric' ? "bg-white border-pink-200 shadow-xl scale-[1.01]" : "bg-pink-50/20 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'womens_obstetric' ? "bg-pink-600 text-white shadow-lg rotate-12" : "bg-white text-pink-400 shadow-sm group-hover:text-pink-600")}>
                        <Baby className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'womens_obstetric' ? "text-pink-900" : "text-pink-600/60")}>1. História Obstétrica</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-tighter">Gestações, Partos e Cicatrizes Perineais</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gestações (G)</Label>
                                <Input type="number" {...register('womens_health.obstetric.gestations')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Partos (P)</Label>
                                <Input type="number" {...register('womens_health.obstetric.births')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Abortos (A)</Label>
                                <Input type="number" {...register('womens_health.obstetric.abortions')} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Parto Predominante</Label>
                            <Controller
                                name="womens_health.obstetric.birthType"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vaginal">Vaginal</SelectItem>
                                            <SelectItem value="c_section">Cesárea</SelectItem>
                                            <SelectItem value="mixed">Misto</SelectItem>
                                            <SelectItem value="null">Nenhum</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl border bg-pink-50/50 border-pink-100 space-y-4">
                            <Controller
                                name="womens_health.obstetric.episiotomy"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-start gap-3">
                                        <Checkbox id="episiotomy" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-pink-600 border-pink-200 mt-1" />
                                        <div className="space-y-1">
                                            <Label htmlFor="episiotomy" className="font-black text-pink-900 uppercase text-[10px] tracking-widest cursor-pointer leading-tight">Histórico de Episiotomia / Laceração?</Label>
                                            <p className="text-[9px] font-bold text-pink-700/60 uppercase">Cicatrizes perineais podem influenciar na função muscular.</p>
                                        </div>
                                    </div>
                                )}
                            />
                            <Controller
                                name="womens_health.obstetric.menopause"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-start gap-3">
                                        <Checkbox id="menopause" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-pink-600 border-pink-200 mt-1" />
                                        <div className="space-y-1">
                                            <Label htmlFor="menopause" className="font-black text-pink-900 uppercase text-[10px] tracking-widest cursor-pointer leading-tight">Menopausa / Climatério?</Label>
                                            <p className="text-[9px] font-bold text-pink-700/60 uppercase">Alterações hormonais (hipoestrogenismo) afetam tecidos.</p>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
