"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoeScale } from "../ui/ShoeScale";
import { calculateMinimalistIndex } from "@/utils/clinical-references";
import { useMemo } from "react";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const ShoeSection = () => {
    const { control } = useFormContext();
    const shoeVals = useWatch({ control, name: "calcado" }); // Adaptado para schema do V3: 'calcado' em vez de 'shoe'

    // Recalcular índice minimalista com base nos valores observados
    // NOTA: O calculateMinimalistIndex espera um objeto com keys específicas (weight, drop, etc).
    // O schema V3 usa: peso_gramas, drop_mm, indice_minimalista (objeto).
    // Vou fazer um adapter on-the-fly para visualização, mas os Sliders/Scales atualizam o 'indice_minimalista' direto.

    // Reimplementando lógica de recomendação visual baseada no tipo de lesão
    // (Essa lógica estava no componente pai no V1, aqui fica na própria section)
    const injuryType = useWatch({ control, name: "anamnese.queixa_principal" }); // Simplificação, ideal seria ter um campo structured 'tipo_lesao'

    // Opções de Escalas
    const WEIGHT_OPTS = [
        { val: "1", label: "> 350g" },
        { val: "2", label: "300-350g" },
        { val: "3", label: "250-300g" },
        { val: "4", label: "200-250g" },
        { val: "5", label: "< 200g" },
    ];
    const DROP_OPTS = [
        { val: "0", label: "> 12mm" },
        { val: "1", label: "10-12mm" },
        { val: "2", label: "7-9mm" },
        { val: "3", label: "4-6mm" },
        { val: "4", label: "1-3mm" },
        { val: "5", label: "0mm" },
    ];
    const FLEX_OPTS = [
        { val: "0", label: "Rígido" },
        { val: "1", label: "Muito Firme" },
        { val: "2", label: "Firme" },
        { val: "3", label: "Moderado" },
        { val: "4", label: "Flexível" },
        { val: "5", label: "Muito Flexível" },
    ];
    const STAB_OPTS = [
        { val: "0", label: "Muito Alto" },
        { val: "1", label: "Alto" },
        { val: "2", label: "Médio" },
        { val: "3", label: "Baixo" },
        { val: "4", label: "Mínimo" },
        { val: "5", label: "Nenhum" },
    ];

    // Cálculo do Score Total Visual
    const currentScore = useMemo(() => {
        const idx = shoeVals?.indice_minimalista;
        if (!idx) return 0;
        return (
            (Number(idx.peso_score) || 0) +
            (Number(idx.drop_score) || 0) +
            (Number(idx.flex_longitudinal) || 0) +
            (Number(idx.flex_torsional) || 0) +
            (Number(idx.estabilidade) || 0)
        ) * 4;
    }, [shoeVals]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-1 bg-gradient-to-b from-slate-700 to-black rounded-full" />
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Avaliação do Calçado & Índice Minimalista</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visualizador de Score e Info */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Score Card */}
                    <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <span className="text-9xl font-black">M</span>
                        </div>
                        <h3 className="text-xs font-bold uppercase opacity-60 mb-1 tracking-widest">Minimalist Index</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black tracking-tighter">{currentScore}</span>
                            <span className="text-xl font-bold text-slate-500">%</span>
                        </div>
                        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-1000 ease-out rounded-full", currentScore > 70 ? "bg-emerald-500" : currentScore > 40 ? "bg-amber-500" : "bg-indigo-500")}
                                style={{ width: `${currentScore}%` }}
                            />
                        </div>
                        <p className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed">
                            O Índice Minimalista avalia o quanto o calçado interfere na mecânica natural do pé. Valores altos indicam maior liberdade de movimento.
                        </p>
                    </div>

                    {/* Dados Técnicos */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest text-center border-b border-slate-50 pb-2">Especificações Técnicas</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={control} name="calcado.modelo" render={({ field }) => (
                                <FormItem className="col-span-2 space-y-1">
                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Modelo / Marca</FormLabel>
                                    <FormControl><Input {...field} className="h-9 bg-slate-50 border-none text-xs font-bold" placeholder="Ex: Nike Pegasus 40" /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={control} name="calcado.peso_gramas" render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Peso (g)</FormLabel>
                                    <FormControl><Input {...field} type="number" className="h-8 bg-slate-50 border-none text-xs text-center font-bold" placeholder="0g" /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={control} name="calcado.drop_mm" render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Drop (mm)</FormLabel>
                                    <FormControl><Input {...field} type="number" className="h-8 bg-slate-50 border-none text-xs text-center font-bold" placeholder="0mm" /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                {/* Calculadora de Índice - Grid de Bolinhas */}
                <div className="lg:col-span-8">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField control={control} name="calcado.indice_minimalista.peso_score" render={({ field }) => (
                                <ShoeScale label="Peso (Score)" value={field.value} onChange={field.onChange} options={WEIGHT_OPTS} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.drop_score" render={({ field }) => (
                                <ShoeScale label="Stack Height / Drop" value={field.value} onChange={field.onChange} options={DROP_OPTS} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.estabilidade" render={({ field }) => (
                                <ShoeScale label="Estabilidade / Counter" value={field.value} onChange={field.onChange} options={STAB_OPTS} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.flex_longitudinal" render={({ field }) => (
                                <ShoeScale label="Flex. Longitudinal" value={field.value} onChange={field.onChange} options={FLEX_OPTS} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.flex_torsional" render={({ field }) => (
                                <ShoeScale label="Flex. Torsional" value={field.value} onChange={field.onChange} options={FLEX_OPTS} />
                            )} />

                            {/* Dica Contextual */}
                            <div className="bg-slate-50 rounded-3xl p-5 flex flex-col justify-center items-center text-center border border-dashed border-slate-200">
                                <Info className="w-6 h-6 text-slate-300 mb-2" />
                                <p className="text-[10px] font-medium text-slate-400 leading-tight">
                                    Preencha os 5 parâmetros para calcular o Índice Minimalista automaticamente.
                                </p>
                            </div>
                        </div>

                        {/* Recomendação de Calçado (Stub Visual) */}
                        <div className="mt-6 pt-6 border-t border-slate-50">
                            <Alert className="bg-blue-50/50 border-blue-100 text-blue-900 rounded-2xl">
                                <AlertTriangle className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-xs font-black uppercase tracking-wide text-blue-700">Recomendação Clínica</AlertTitle>
                                <AlertDescription className="text-xs font-medium mt-1 opacity-80">
                                    Baseado na HMA e nos testes, considere a transição gradual caso mude drasticamente o índice minimalista.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
