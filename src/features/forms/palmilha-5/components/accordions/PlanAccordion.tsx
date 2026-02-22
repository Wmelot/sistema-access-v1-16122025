import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PillBottle, Plus, Trash2, Mic, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioTextarea } from "@/features/forms/pbe/components/audio-textarea";
import { ExerciseCombobox } from "@/features/forms/pbe/components/ExerciseCombobox";
import { cn } from "@/lib/utils";

interface PlanAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    isImported?: boolean;
}

export function PlanAccordion({ openSection, isSectionFilled, sectionStyle, isImported }: PlanAccordionProps) {
    const form = useFormContext();
    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
        control: form.control,
        name: "plan.exercises"
    });

    return (
        <AccordionItem
            value="exercises"
            data-value="exercises"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'exercises' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-teal-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('exercises') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <PillBottle className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-teal-600 transition-colors">Plano Terapêutico & Orientações</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-8 border-t border-slate-50">

                {/* Lista de Exercícios Prescritos */}
                <div className="space-y-4">
                    <FormLabel className="font-black text-xs uppercase tracking-widest text-slate-700">Exercícios Prescritos</FormLabel>
                    <div className="space-y-3">
                        {exerciseFields.map((field, index) => (
                            <div key={field.id} className="animate-in slide-in-from-left-2 duration-300 border border-slate-100 rounded-lg p-4 bg-slate-50/30">
                                <div className="grid grid-cols-12 gap-3 items-end">
                                    {/* Nome do Exercício */}
                                    <div className="col-span-12 md:col-span-5 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nome do Exercício</span>
                                        <ExerciseCombobox
                                            value={form.watch(`plan.exercises.${index}.name` as any)}
                                            onChange={(val) => form.setValue(`plan.exercises.${index}.name` as any, val)}
                                            autoFocus={index === exerciseFields.length - 1 && !form.getValues(`plan.exercises.${index}.name` as any)}
                                            onCommit={() => document.getElementById(`plan.exercises.${index}.sets`)?.focus()}
                                        />
                                    </div>

                                    {/* Séries com Tooltip */}
                                    <div className="col-span-3 md:col-span-2 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Séries</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-3 h-3 text-blue-500 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white p-3">
                                                        <div className="space-y-2 text-xs">
                                                            <div className="font-bold text-blue-300 border-b border-slate-700 pb-1">Referências Científicas</div>
                                                            <div><strong className="text-red-300">Força Máxima:</strong> 3-5 séries | 1-5 reps (80-100% 1RM)</div>
                                                            <div><strong className="text-green-300">Hipertrofia:</strong> 3-6 séries | 8-12 reps (60-80% 1RM)</div>
                                                            <div><strong className="text-yellow-300">Potência:</strong> 3-5 séries | 1-6 reps (Concêntrica rápida)</div>
                                                            <div><strong className="text-purple-300">Resistência:</strong> 2-3 séries | 15-25+ reps (&lt;60% 1RM)</div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            id={`plan.exercises.${index}.sets`}
                                            type="number"
                                            {...form.register(`plan.exercises.${index}.sets` as any)}
                                            className="h-9 bg-white"
                                            placeholder="3"
                                            min="1"
                                        />
                                    </div>

                                    {/* Repetições com Tooltip */}
                                    <div className="col-span-6 md:col-span-2 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Repetições</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-3 h-3 text-blue-500 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white p-3">
                                                        <div className="space-y-2 text-xs">
                                                            <div className="font-bold text-blue-300 border-b border-slate-700 pb-1">Referências Científicas</div>
                                                            <div><strong className="text-red-300">Força Máxima:</strong> 3-5 séries | 1-5 reps (80-100% 1RM)</div>
                                                            <div><strong className="text-green-300">Hipertrofia:</strong> 3-6 séries | 8-12 reps (60-80% 1RM)</div>
                                                            <div><strong className="text-yellow-300">Potência:</strong> 3-5 séries | 1-6 reps (Concêntrica rápida)</div>
                                                            <div><strong className="text-purple-300">Resistência:</strong> 2-3 séries | 15-25+ reps (&lt;60% 1RM)</div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            type="number"
                                            value={form.watch(`plan.exercises.${index}.reps` as any) || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                form.setValue(`plan.exercises.${index}.reps` as any, val);
                                                if (val) {
                                                    form.setValue(`plan.exercises.${index}.time` as any, "");
                                                }
                                            }}
                                            className="h-9 bg-white"
                                            placeholder="10"
                                            min="1"
                                            disabled={!!form.watch(`plan.exercises.${index}.time` as any)}
                                        />
                                    </div>

                                    {/* Tempo (alternativa às repetições) */}
                                    <div className="col-span-3 md:col-span-2 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tempo (seg)</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-3 h-3 text-purple-500 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white p-3">
                                                        <div className="space-y-2 text-xs">
                                                            <div className="font-bold text-purple-300 border-b border-slate-700 pb-1">Exercícios Isométricos</div>
                                                            <div><strong className="text-blue-300">Alongamentos:</strong> 30-60 segundos</div>
                                                            <div><strong className="text-green-300">Prancha/Isometria:</strong> 20-60 segundos</div>
                                                            <div><strong className="text-yellow-300">Mobilidade:</strong> 30-90 segundos</div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            type="number"
                                            value={form.watch(`plan.exercises.${index}.time` as any) || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                form.setValue(`plan.exercises.${index}.time` as any, val);
                                                if (val) {
                                                    form.setValue(`plan.exercises.${index}.reps` as any, "");
                                                }
                                            }}
                                            className="h-9 bg-white"
                                            placeholder="30"
                                            min="1"
                                            disabled={!!form.watch(`plan.exercises.${index}.reps` as any)}
                                        />
                                    </div>

                                    {/* Botão Remover */}
                                    <div className="col-span-12 md:col-span-1 flex md:justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeExercise(index);
                                            }}
                                            className="focusable-element text-slate-400 hover:text-red-500 hover:bg-red-50 w-full md:w-auto"
                                            tabIndex={-1}
                                        >
                                            <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                                            <span className="md:hidden">Remover</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button
                            id="add-exercise-btn"
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendExercise({ name: "" })}
                            className="focusable-element w-full border-dashed h-10 hover:bg-slate-50 text-slate-500 font-bold text-xs"
                        >
                            <Plus className="w-3.5 h-3.5 mr-2" /> ADICIONAR EXERCÍCIO
                        </Button>
                    </div>
                </div>

                {/* Orientações ao Paciente */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4 text-blue-600" />
                            <h4 className="font-black text-xs uppercase tracking-widest text-slate-700">Orientações Personalizadas</h4>
                        </div>
                    </div>
                    <AudioTextarea
                        value={form.watch("plan.orientations")}
                        onChange={(e: any) => form.setValue("plan.orientations", e.target.value)}
                        onTranscription={(text: string) => form.setValue("plan.orientations", text)}
                        placeholder="Descreva as orientações específicas ou use o gravador para ditar o plano..."
                        className="min-h-[150px] shadow-sm border-slate-200"
                        hideAI={isImported}
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
