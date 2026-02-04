"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { BodyPainMap } from "../BodyPainMap";
import { AudioTextarea } from "../ui/AudioTextarea";
import { MedicationCombobox } from "../ui/MedicationCombobox";

export const AnamneseSection = () => {
    const { control, watch } = useFormContext();
    const { fields: efepFields } = useFieldArray({
        control,
        name: "anamnese.efep"
    });

    // Field Arrays para Esportes e Tratamentos
    const { fields: sportFields, append: appendSport, remove: removeSport } = useFieldArray({
        control,
        name: "anamnese.historico_esportivo.modalidades_detalhado" // Supondo estrutura nova
    });

    const [showHistory, setShowHistory] = useState(true);
    const evaValue = watch("anamnese.eva");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in active:outline-none">
            {/* Esquerda: Campos de Texto e Histórico */}
            <div className="lg:col-span-8 space-y-8">

                {/* 1.1 Dados Básicos & HMA */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Anamnese & Queixa Principal</h2>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-12">
                                <FormField control={control} name="anamnese.queixa_principal" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Queixa Principal (QP)</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white text-base font-medium" placeholder="Ex: Dor no calcanhar ao acordar..." />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <div className="md:col-span-12">
                                <FormField control={control} name="anamnese.hma" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider flex justify-between items-center">
                                            <span>História da Moléstia Atual (HMA)</span>
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> IA Transcriber Ready
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <AudioTextarea
                                                {...field}
                                                className="bg-slate-50/50 border-slate-200 focus:bg-white min-h-[160px] text-base leading-relaxed p-4"
                                                placeholder="Relate a história completa da lesão, tempo de evolução, fatores de melhora/piora..."
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                            <div className="col-span-1">
                                <FormField control={control} name="anamnese.eva" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] font-bold uppercase text-slate-400">EVA (0-10)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min={0} max={10}
                                                    className="h-12 text-center font-black text-xl bg-slate-50 border-slate-200"
                                                />
                                                <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" style={{ opacity: (field.value || 0) / 10 }} />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            <div className="col-span-1 md:col-span-3">
                                <FormField control={control} name="anamnese.historico_esportivo.nivel" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Nível de Atividade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-bold text-slate-700">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Sedentario">Sedentário (Sem atividade regular)</SelectItem>
                                                <SelectItem value="Iniciante">Iniciante (1-2x semana)</SelectItem>
                                                <SelectItem value="Recreacional">Recreacional (2-3x semana)</SelectItem>
                                                <SelectItem value="Competitivo">Competitivo (Treino focado)</SelectItem>
                                                <SelectItem value="Elite">Elite / Profissional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 1.2 Histórico Clínico */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Histórico Clínico</h2>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <FormField control={control} name="anamnese.historia_pregressa.medicacao_uso" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Medicação em Uso</FormLabel>
                                        <FormControl>
                                            <MedicationCombobox
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <div className="space-y-4">
                                <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-2">Tratamentos Anteriores</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                    {["Fisioterapia", "Acupuntura", "Palmilha", "Infiltração", "Cirurgia", "Quiropraxia", "Osteopatia"].map(item => (
                                        <FormField key={item} control={control} name="anamnese.historia_pregressa.tratamentos_previos" render={({ field }) => (
                                            <FormItem className="flex items-center space-x-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(item)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), item])
                                                                : field.onChange(field.value?.filter((value: string) => value !== item))
                                                        }}
                                                        className="peer sr-only"
                                                    />
                                                </FormControl>
                                                <FormLabel className="cursor-pointer px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold peer-data-[state=checked]:bg-indigo-100 peer-data-[state=checked]:text-indigo-700 peer-data-[state=checked]:border-indigo-200 transition-all hover:bg-slate-100">
                                                    {item}
                                                </FormLabel>
                                            </FormItem>
                                        )} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <FormField control={control} name="anamnese.observacoes" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Observações / Comorbidades</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="min-h-[60px] bg-slate-50/50 border-slate-200 text-sm" placeholder="Diabetes, Hipertensão, Cirurgias prévias..." />
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </section>

                {/* 1.3 EFEP / Funcionalidade */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-1 bg-gradient-to-b from-orange-400 to-amber-500 rounded-full" />
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Escala Específica de Funcionalidade (EFEP/PSFS)</h2>
                    </div>

                    <div className="bg-white p-1 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/80 backend-blur-md">
                                <tr>
                                    <th className="text-left px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Atividade Difícil</th>
                                    <th className="text-center w-32 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Nota (0-10)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {efepFields.map((field, index) => (
                                    <tr key={field.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="p-2 pl-4">
                                            <FormField control={control} name={`anamnese.efep.${index}.atividade`} render={({ field }) => (
                                                <Input {...field} className="h-10 border-slate-100 bg-transparent focus:bg-white focus:border-indigo-200 px-4 rounded-xl placeholder:text-slate-300 font-medium text-slate-700" placeholder={`Ex: Subir escadas, Correr 5km...`} />
                                            )} />
                                        </td>
                                        <td className="p-2 pr-4">
                                            <FormField control={control} name={`anamnese.efep.${index}.nota`} render={({ field }) => (
                                                <div className="relative flex items-center justify-center">
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min={0} max={10}
                                                        className="h-10 w-20 text-center font-black text-lg bg-orange-50 border-orange-100 text-orange-600 focus:ring-orange-200 rounded-xl"
                                                    />
                                                </div>
                                            )} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-slate-50 text-center">
                            <p className="text-[10px] text-slate-400 font-medium">0 = Incapaz de realizar | 10 = Capaz de realizar no nível pré-lesão</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Direita: Mapa de Dor Sticky */}
            <div className="lg:col-span-4 space-y-8">
                <section className="sticky top-32">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-pink-600 rounded-full" />
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Mapa de Dor</h2>
                    </div>

                    <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col items-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-widest text-center px-8">Clique nas regiões para marcar os pontos dolorosos</p>
                        <div className="w-full aspect-[3/4] relative">
                            <FormField control={control} name="anamnese.mapa_dor" render={({ field }) => (
                                <BodyPainMap
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )} />
                        </div>
                        <div className="mt-6 w-full">
                            <FormField control={control} name="anamnese.mapa_dor.observacoes" render={({ field }) => (
                                <Textarea {...field} className="bg-slate-50 border-none text-xs min-h-[80px] rounded-2xl p-4 resize-none" placeholder="Observações específicas sobre a dor (ex: irradiação, tipo de dor)..." />
                            )} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
