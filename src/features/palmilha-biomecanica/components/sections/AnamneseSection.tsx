"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { BodyPainMap } from "../BodyPainMap"; // Adjust path if needed

export const AnamneseSection = () => {
    const { control, watch } = useFormContext();
    const { fields: efepFields } = useFieldArray({
        control,
        name: "anamnese.efep"
    });
    const [showHistory, setShowHistory] = useState(false);
    const evaValue = watch("anamnese.eva");

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in">
            {/* Esquerda: Campos de Texto e Histórico */}
            <div className="md:col-span-8 space-y-6">

                {/* 1.1 Dados Básicos */}
                <section className="space-y-3">
                    <h2 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-200 pb-1">01. Dados Clínicos</h2>
                    <div className="grid grid-cols-12 gap-3 bg-slate-50 p-3 rounded-sm border border-slate-200">
                        <div className="col-span-12 md:col-span-8">
                            <FormField control={control} name="anamnese.queixa_principal" render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Queixa Principal / HMA</FormLabel>
                                    <FormControl><Input {...field} className="h-8 text-sm bg-white" placeholder="Descreva a queixa..." /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <FormField control={control} name="anamnese.eva" render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Dor (EVA 0-10)</FormLabel>
                                    <FormControl><Input {...field} type="number" min={0} max={10} className="h-8 text-sm bg-white text-center font-bold text-red-700" /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <FormField control={control} name="anamnese.historico_esportivo.nivel" render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Nível Atividade</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Sedentario">Sedentário</SelectItem>
                                            <SelectItem value="Iniciante">Iniciante</SelectItem>
                                            <SelectItem value="Recreacional">Recreacional</SelectItem>
                                            <SelectItem value="Competitivo">Competitivo</SelectItem>
                                            <SelectItem value="Elite">Elite</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        {/* Expander de Histórico */}
                        <div className="col-span-12">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full h-6 text-[10px] text-slate-500 uppercase hover:bg-slate-200 flex justify-between px-2"
                            >
                                <span>Histórico Pregresso & Tratamentos</span>
                                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                        </div>

                        {showHistory && (
                            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 animate-in slide-in-from-top-2">
                                <FormField control={control} name="anamnese.historia_pregressa.medicacao_uso" render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Medicação em Uso</FormLabel>
                                        <Input {...field} className="h-7 text-xs bg-white" placeholder="Nenhuma" />
                                    </FormItem>
                                )} />
                                <div className="space-y-1">
                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500 block">Tratamentos Prévios</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {["Fisioterapia", "Acupuntura", "Palmilha", "Infiltração", "Cirurgia"].map(item => (
                                            <FormField key={item} control={control} name="anamnese.historia_pregressa.tratamentos_previos" render={({ field }) => (
                                                <FormItem className="flex items-center space-x-1 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), item])
                                                                    : field.onChange(field.value?.filter((value: string) => value !== item))
                                                            }}
                                                            className="h-3 w-3"
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-[10px] font-normal cursor-pointer">{item}</FormLabel>
                                                </FormItem>
                                            )} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="col-span-12">
                            <FormField control={control} name="anamnese.observacoes" render={({ field }) => (
                                <FormControl><Textarea {...field} className="min-h-[40px] text-xs bg-white resize-none" placeholder="Observações adicionais..." /></FormControl>
                            )} />
                        </div>
                    </div>
                </section>

                {/* 1.2 EFEP / PSFS */}
                <section>
                    <h2 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-200 pb-1 flex justify-between">
                        <span>01.2 Funcionalidade (EFEP/PSFS)</span>
                        <span className="text-[9px] font-normal text-slate-400">0=Incapaz ... 10=Capaz</span>
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-3 py-1 font-bold text-slate-600">Atividade Específica</th>
                                    <th className="text-center w-24 py-1 font-bold text-slate-600">Nota (0-10)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {efepFields.map((field, index) => (
                                    <tr key={field.id} className="group hover:bg-slate-50">
                                        <td className="p-1">
                                            <FormField control={control} name={`anamnese.efep.${index}.atividade`} render={({ field }) => (
                                                <Input {...field} className="h-7 border-0 bg-transparent focus-visible:ring-0 px-2 placeholder:text-slate-300" placeholder={`Atividade ${index + 1}...`} />
                                            )} />
                                        </td>
                                        <td className="p-1">
                                            <FormField control={control} name={`anamnese.efep.${index}.nota`} render={({ field }) => (
                                                <Input {...field} type="number" min={0} max={10} className="h-7 text-center border-0 bg-transparent focus-visible:ring-0 font-bold text-blue-600" />
                                            )} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Direita: Mapa de Dor */}
            <div className="md:col-span-4">
                <section>
                    <h2 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-200 pb-1">Localização da Dor</h2>
                    <FormField control={control} name="anamnese.mapa_dor" render={({ field }) => (
                        <BodyPainMap
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )} />
                </section>
            </div>
        </div>
    );
};
