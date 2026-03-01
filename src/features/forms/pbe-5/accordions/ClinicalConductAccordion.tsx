"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, Trash2, ClipboardCheck, Sparkles, Send, Calendar, Mic, Activity, Info as InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioTextarea } from "@/features/forms/pbe/components/audio-textarea";
import { ExerciseCombobox } from "@/features/forms/pbe/components/ExerciseCombobox";

interface ClinicalConductAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function ClinicalConductAccordion({ openSection, isSectionFilled, sectionStyle }: ClinicalConductAccordionProps) {
    const { register, watch, setValue, control } = useFormContext();
    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
        control,
        name: "plan.exercises"
    });
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const selectedRegions = watch('anamnesis.mainRegions') || [];

    const handleSuggestProtocol = () => {
        if (selectedRegions.length === 0) return;
        setIsAnalyzing(true);
        setTimeout(() => setIsAnalyzing(false), 2000);
    };

    return (
        <AccordionItem
            value="plan"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'plan' ? 'bg-white ring-2 ring-slate-100' : 'bg-white/50',
                isSectionFilled('plan') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <ClipboardCheck className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'plan' ? "text-slate-900" : "text-slate-600")}>8. Conduta Clínica & Planejamento</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Estratégia terapêutica e prescrições</p>
                    </div>
                </div>
                {isSectionFilled('plan') && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PLANO DEFINIDO</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-12 border-t border-slate-50">
                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

                    {/* Prescriptions */}
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-slate-800 rounded-full" />
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Prescrição de Exercícios</h4>
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-[9px] font-black uppercase px-2">Padrão Axiom</Badge>
                            </div>

                            <div className="space-y-4">
                                {exerciseFields.map((field, index) => (
                                    <div key={field.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4 animate-in fade-in slide-in-from-left-2 transition-all hover:shadow-md hover:border-slate-200 group">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-1">
                                                <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Exercício</FormLabel>
                                                <ExerciseCombobox
                                                    value={watch(`plan.exercises.${index}.name`)}
                                                    onChange={(val) => setValue(`plan.exercises.${index}.name`, val)}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeExercise(index)}
                                                className="h-10 w-10 text-slate-200 hover:text-red-500 rounded-xl mt-5 group-hover:text-slate-400 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Séries</FormLabel>
                                                <Input {...register(`plan.exercises.${index}.sets`)} placeholder="3" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                                            </div>
                                            <div className="space-y-1">
                                                <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Reps</FormLabel>
                                                <Input {...register(`plan.exercises.${index}.reps`)} placeholder="12" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                                            </div>
                                            <div className="space-y-1">
                                                <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Carga</FormLabel>
                                                <Input {...register(`plan.exercises.${index}.load`)} placeholder="2kg" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => appendExercise({ name: "", sets: "3", reps: "12" })}
                                    className="w-full h-14 border-dashed border-slate-200 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 group hover:border-slate-300 transition-all"
                                >
                                    <Plus className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
                                    Adicionar Exercício ao Plano
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-slate-800 rounded-full" />
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Follow-up & Retorno</h4>
                            </div>
                            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-6">
                                <div className="flex-1 space-y-1">
                                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência Sugerida</FormLabel>
                                    <div className="flex bg-white p-1 rounded-xl border border-slate-100">
                                        {[1, 2, 3].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setValue('plan.frequency', n)}
                                                className={cn(
                                                    "flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all",
                                                    watch('plan.frequency') === n
                                                        ? "bg-slate-900 text-white shadow-lg"
                                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                {n}x / sem
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orientations & AI Audit */}
                    <div className={cn("p-8 rounded-[3rem] border transition-all", sectionStyle.bg, openSection === 'plan' ? "border-slate-200 shadow-inner" : "border-transparent")}>
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-slate-800 rounded-full" />
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Orientações ao Paciente</h4>
                                </div>
                                <div className="space-y-4">
                                    <AudioTextarea
                                        value={watch('plan.orientations')}
                                        onChange={(e: any) => setValue('plan.orientations', e.target.value)}
                                        onTranscription={(text) => setValue('plan.orientations', text)}
                                        placeholder="Digite ou dite as orientações finais, cuidados e o prognóstico..."
                                        className="min-h-[220px] rounded-[2rem] border-slate-200 focus:ring-slate-500 bg-white text-base font-medium p-8 shadow-sm"
                                    />
                                    <div className="flex items-center gap-3 px-4">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audio Intelligence Ativa</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles className="h-32 w-32 text-indigo-200" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-300 border border-indigo-400/30">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black uppercase text-xs tracking-widest leading-none">Axiom Clinical Protocol</h4>
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Protocolos de Reabilitação</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                                            Baseado nas regiões selecionadas e achados, nossa IA sugere as melhores <span className="text-indigo-300 font-black italic">técnicas e exercícios</span> de reabilitação.
                                        </p>
                                        <Button
                                            onClick={handleSuggestProtocol}
                                            disabled={isAnalyzing || selectedRegions.length === 0}
                                            className="w-full h-14 bg-white hover:bg-indigo-50 text-indigo-900 font-black rounded-2xl shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 group transition-all"
                                        >
                                            {isAnalyzing ? (
                                                <Activity className="h-4 w-4 animate-spin text-indigo-600" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                            )}
                                            <span>Protocolo Clínico Inteligente</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="relative z-10 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                <InfoIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-slate-800 font-black uppercase text-xs tracking-widest leading-none">Principais Evidências</h4>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">O que a ciência diz</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                            Acesse as diretrizes mais recentes sobre a patologia do paciente diretamente da literatura científica.
                                        </p>
                                        <Button variant="outline" className="w-full h-12 border-indigo-200 text-indigo-700 font-black rounded-xl flex items-center justify-center gap-2 group transition-all hover:bg-indigo-50">
                                            <Activity className="h-4 w-4" />
                                            <span>Principais Evidências</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
