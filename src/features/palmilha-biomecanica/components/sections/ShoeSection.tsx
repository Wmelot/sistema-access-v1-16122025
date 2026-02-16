"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoeScale } from "../ui/ShoeScale";
import { calculateMinimalistIndex } from "@/utils/clinical-references";
import { useMemo, useState } from "react";
import { Info, AlertTriangle, CheckCircle2, Search, Check, ChevronsUpDown, Video, Youtube, BookOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SHOE_DATABASE, ShoeModel } from "@/app/dashboard/[slug]/assessments/shoe-database";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const ShoeSection = () => {
    const { control, setValue } = useFormContext();
    const shoeVals = useWatch({ control, name: "calcado" });
    const [searchOpen, setSearchOpen] = useState(false);

    // --- TOOLTIPS DE ORIENTAÇÃO (THE RUNNING CLINIC) ---
    const ORIENTATIONS = {
        peso: "Basta pesar o tênis em uma balança (ref. Tam 42 BR). Quanto mais leve for o calçado, maior será a pontuação neste critério do Índice Minimalista.",
        drop: "Diferença de altura entre o calcanhar e a ponta do pé. Quanto mais próximo de zero, maior a pontuação no Índice Minimalista.",
        stack: "Medida no centro do calcanhar, avalia a espessura total entre onde seu pé fica e o chão. Quanto mais fina a sola, maior a pontuação.",
        estabilidade: "Identifique tecnologias usadas para controlar a pisada (placas, postes duros, contrafortes). Menos tecnologias (mais naturalidade) significa uma pontuação maior.",
        flex_long: "Avalia o quanto o tênis dobra para frente na região dos metatarsos. Quanto mais flexível, maior a pontuação.",
        flex_tor: "Avalia o quanto o tênis permite a torção sobre seu próprio eixe (como uma toalha). Fundamental para adaptação ao terreno.",
    };

    // --- LÓGICA DE AUTO-PREENCHIMENTO (MAPPING) ---
    const applyShoeModel = (shoe: ShoeModel) => {
        setValue("calcado.modelo", `${shoe.brand} ${shoe.model} `);
        setValue("calcado.peso_gramas", shoe.weight);
        setValue("calcado.drop_mm", shoe.drop);

        // Mapeamento de Peso
        let weightScore = "1";
        if (shoe.weight <= 200) weightScore = "5";
        else if (shoe.weight <= 250) weightScore = "4";
        else if (shoe.weight <= 300) weightScore = "3";
        else if (shoe.weight <= 350) weightScore = "2";
        setValue("calcado.indice_minimalista.peso_score", weightScore);

        // Mapeamento de Drop/Stack
        let dropScore = "0";
        if (shoe.drop === 0) dropScore = "5";
        else if (shoe.drop <= 3) dropScore = "4";
        else if (shoe.drop <= 6) dropScore = "3";
        else if (shoe.drop <= 9) dropScore = "2";
        else if (shoe.drop <= 12) dropScore = "1";
        setValue("calcado.indice_minimalista.drop_score", dropScore);

        // Mapeamento de Estabilidade
        setValue("calcado.indice_minimalista.estabilidade", shoe.stabilityControl ? "1" : "5");

        // Mapeamento de Flexibilidade
        let flexScore = "1";
        if (shoe.flexibility === 'high') flexScore = "5";
        else if (shoe.flexibility === 'medium') flexScore = "3";
        setValue("calcado.indice_minimalista.flex_longitudinal", flexScore);
        setValue("calcado.indice_minimalista.flex_torsional", flexScore);

        toast.success(`${shoe.model} aplicado com sucesso!`);
        setSearchOpen(false);
    };

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-gradient-to-b from-slate-700 to-black rounded-full" />
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Avaliação do Calçado & Índice Minimalista</h2>
                </div>

                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => window.open('https://www.youtube.com/watch?v=OcJgc8wTk9k', '_blank')}
                                >
                                    <BookOpen className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[10px] font-bold">Ver Tutorial Técnico</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* BUSCA DE CALÇADOS DATABSE */}
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-full px-4 shadow-sm">
                                <Search className="w-3.5 h-3.5" /> Buscar Banco de Dados
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0 rounded-2xl shadow-2xl border-indigo-100" align="end">
                            <Command className="rounded-2xl">
                                <CommandInput placeholder="Ex: Pegasus, Nimbus, Adios Pro..." className="h-10" />
                                <CommandList className="max-h-[300px]">
                                    <CommandEmpty>Calçado não encontrado no banco.</CommandEmpty>
                                    <CommandGroup heading="Calçados Cadastrados">
                                        {SHOE_DATABASE.map((shoe) => (
                                            <CommandItem
                                                key={shoe.id}
                                                value={`${shoe.brand} ${shoe.model} `}
                                                onSelect={() => applyShoeModel(shoe)}
                                                className="px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                            >
                                                <div className="flex flex-col gap-0.5 w-full">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-slate-800 text-sm">{shoe.brand} {shoe.model}</span>
                                                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-none">{shoe.minimalismIndex}%</Badge>
                                                    </div>
                                                    <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
                                                        <span>{shoe.weight}g</span>
                                                        <span>•</span>
                                                        <span>Drop {shoe.drop}mm</span>
                                                        <span>•</span>
                                                        <span className="uppercase">{shoe.type}</span>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visualizador de Score e Info */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Score Card */}
                    <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Youtube className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xs font-bold uppercase opacity-60 tracking-widest">Minimalist Index</h3>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[280px] p-4 bg-slate-800 text-white border-none shadow-2xl">
                                        <div className="space-y-2">
                                            <p className="font-bold text-sm text-indigo-400">Minimalismo x Maximalismo</p>
                                            <p className="text-[10px] leading-relaxed">
                                                <strong className="text-white">Minimalistas (&gt;70%):</strong> Menos interferência no movimento, drop baixo e alta flexibilidade. Exige adaptação gradual.
                                            </p>
                                            <p className="text-[10px] leading-relaxed">
                                                <strong className="text-white">Maximalistas (&lt;30%):</strong> Solas espessas, drop alto e muita estabilidade. Reduzem a carga em tecidos específicos mas mudam a mecânica.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black tracking-tighter">{currentScore}</span>
                            <span className="text-xl font-bold text-slate-500">%</span>
                        </div>
                        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-1000 ease-out rounded-full", currentScore > 70 ? "bg-emerald-500" : currentScore > 40 ? "bg-amber-500" : "bg-indigo-500")}
                                style={{ width: `${currentScore}% ` }}
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
                                    <div className="flex items-center gap-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Peso (g)</FormLabel>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="w-3 h-3 text-slate-300 hover:text-indigo-500 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px] bg-slate-900 text-white border-slate-800">
                                                    {ORIENTATIONS.peso}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <FormControl><Input {...field} type="number" className="h-8 bg-slate-50 border-none text-xs text-center font-bold" placeholder="0g" /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={control} name="calcado.drop_mm" render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Drop (mm)</FormLabel>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="w-3 h-3 text-slate-300 hover:text-indigo-500 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px] bg-slate-900 text-white border-slate-800">
                                                    {ORIENTATIONS.drop}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
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
                                <ShoeScale label="Peso (Score)" value={field.value} onChange={field.onChange} options={WEIGHT_OPTS} tooltip={ORIENTATIONS.peso} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.drop_score" render={({ field }) => (
                                <ShoeScale label="Stack Height / Drop" value={field.value} onChange={field.onChange} options={DROP_OPTS} tooltip={ORIENTATIONS.drop} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.estabilidade" render={({ field }) => (
                                <ShoeScale label="Estabilidade / Counter" value={field.value} onChange={field.onChange} options={STAB_OPTS} tooltip={ORIENTATIONS.estabilidade} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.flex_longitudinal" render={({ field }) => (
                                <ShoeScale label="Flex. Longitudinal" value={field.value} onChange={field.onChange} options={FLEX_OPTS} tooltip={ORIENTATIONS.flex_long} />
                            )} />
                            <FormField control={control} name="calcado.indice_minimalista.flex_torsional" render={({ field }) => (
                                <ShoeScale label="Flex. Torsional" value={field.value} onChange={field.onChange} options={FLEX_OPTS} tooltip={ORIENTATIONS.flex_tor} />
                            )} />

                            {/* Dica Contextual */}
                            <div className="bg-indigo-50/30 rounded-3xl p-5 flex flex-col justify-center items-center text-center border border-dashed border-indigo-100">
                                <Info className="w-6 h-6 text-indigo-400 mb-2" />
                                <p className="text-[10px] font-bold text-indigo-900 leading-tight mb-1">
                                    Orientação ao Paciente
                                </p>
                                <p className="text-[10px] font-medium text-indigo-600/80 leading-tight italic">
                                    "Por favor traga um tênis ou o calçado que utiliza com frequência, e uma roupa de ginástica para facilitar a avaliação no dia do atendimento."
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
