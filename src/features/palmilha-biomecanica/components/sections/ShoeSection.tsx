"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export const ShoeSection = () => {
    const { control } = useFormContext();

    // Lógica do Índice Minimalista
    const pesoScore = useWatch({ control, name: "calcado.indice_minimalista.peso_score" }) || 0;
    const dropScore = useWatch({ control, name: "calcado.indice_minimalista.drop_score" }) || 0;
    const flexLong = useWatch({ control, name: "calcado.indice_minimalista.flex_longitudinal" }) || 0;
    const flexTors = useWatch({ control, name: "calcado.indice_minimalista.flex_torsional" }) || 0;
    const estab = useWatch({ control, name: "calcado.indice_minimalista.estabilidade" }) || 0;

    const totalMinimalista = (pesoScore + dropScore + flexLong + flexTors + estab) * 4; // Max 25 * 4 = 100%

    return (
        <section>
            <h2 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-200 pb-1">06. Calçado & Index Minimalista</h2>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm space-y-4">
                {/* Linha 1: Dados do Tênis */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Modelo</label>
                        <FormField control={control} name="calcado.modelo" render={({ field }) => (
                            <FormControl><Input {...field} className="h-8 text-xs bg-white" placeholder="Marca e Modelo" /></FormControl>
                        )} />
                    </div>
                    <div className="w-20 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Peso (g)</label>
                        <FormField control={control} name="calcado.peso_gramas" render={({ field }) => (
                            <FormControl><Input {...field} type="number" className="h-8 text-xs bg-white text-center" /></FormControl>
                        )} />
                    </div>
                    <div className="w-20 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Drop</label>
                        <FormField control={control} name="calcado.drop_mm" render={({ field }) => (
                            <FormControl><Input {...field} type="number" className="h-8 text-xs bg-white text-center" /></FormControl>
                        )} />
                    </div>
                    <div className="w-32 p-2 bg-slate-200 rounded text-center">
                        <span className="block text-[9px] font-bold uppercase text-slate-500">Índice Min.</span>
                        <span className="text-lg font-black text-slate-700">{totalMinimalista}%</span>
                    </div>
                </div>

                {/* Linha 2: Sliders Minimalistas (Opcionais, mas bons para refinar o cálculo) */}
                {/* Nota: O usuário não pediu explicitamente os sliders na tela, mas pediu a lógica. 
                    Vou mantê-los ocultos ou colapsáveis se for poluir, mas como pediu lógica completa, vou adicionar mini-sliders. */}
                <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-200">
                    {[
                        { name: "peso_score", label: "Leveza" },
                        { name: "drop_score", label: "Drop" }, // Lembrete: Menor drop = Maior score minimalista
                        { name: "flex_longitudinal", label: "Flex Long." },
                        { name: "flex_torsional", label: "Flex Tors." },
                        { name: "estabilidade", label: "Espessura" }
                    ].map((item) => (
                        <div key={item.name} className="text-center">
                            <label className="text-[9px] text-slate-400 block mb-1">{item.label}</label>
                            <FormField control={control} name={`calcado.indice_minimalista.${item.name}`} render={({ field }) => (
                                <div className="px-1">
                                    <Slider
                                        defaultValue={[field.value || 0]}
                                        max={5}
                                        step={1}
                                        onValueChange={(val) => field.onChange(val[0])}
                                        className="py-1 cursor-pointer"
                                    />
                                    <span className="text-[9px] font-bold text-slate-600">{field.value || 0}</span>
                                </div>
                            )} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
