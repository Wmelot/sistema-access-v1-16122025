import React, { useState, useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Footprints, BookOpen, Search, Youtube, Info, Database, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label as FormLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SHOE_DATABASE, ShoeModel } from "@/app/dashboard/[slug]/assessments/shoe-database";
import { saveShoeModel, fetchCustomShoes } from "@/app/dashboard/[slug]/assessments/shoe-actions";
import { calculateMinimalistIndex } from "@/utils/clinical-references";

const ORIENTATIONS = {
    peso: "O peso impacta diretamente no custo metabólico da corrida. Cada 100g extra aumenta em ~1% o oxigênio consumido.",
    drop: "Diferença de altura entre calcanhar e antepé. Drops baixos (0-4mm) favorecem a pisada de meio-pé/antepé.",
    stack: "Espessura total da sola. Espessuras menores que 20mm aumentam o feedback sensorial do pé.",
    estabilidade: "Presença de tecnologias de controle (postes, placas). Quanto mais tecnologias, menor a naturalidade.",
    flex_long: "Avalia a rigidez na região das metatarso-falângicas. Tênis mais flexíveis exigem mais do sistema elástico/muscular.",
    flex_tor: "Capacidade de torção do chassi. Crucial para adaptação do pé a irregularidades do terreno.",
};

const ShoeScale = ({ label, value, onChange, options, tooltip }: { label: string, value: any, onChange: (val: string) => void, options: { val: string, label: string }[], tooltip?: string }) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 transition-all hover:bg-blue-50/30">
            <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
                {tooltip && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-[11px] bg-slate-900 text-white border-slate-800">
                                {tooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {options.map((opt) => (
                    <button
                        key={opt.val}
                        type="button"
                        onClick={() => onChange(opt.val)}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border",
                            String(value) === String(opt.val)
                                ? "bg-blue-600 text-white border-blue-600 shadow-md scale-110"
                                : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                        )}
                    >
                        {opt.val}
                    </button>
                ))}
            </div>
        </div>
    );
};

interface ShoeAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    organizationId?: string;
}

export function ShoeAccordion({ openSection, isSectionFilled, sectionStyle, organizationId }: ShoeAccordionProps) {
    const form = useFormContext();
    const [searchOpen, setSearchOpen] = useState(false);
    const [customShoes, setCustomShoes] = useState<any[]>([]);
    const [isSavingShoe, setIsSavingShoe] = useState(false);

    useEffect(() => {
        fetchCustomShoes().then(setCustomShoes);
    }, []);

    const ALL_SHOES = useMemo(() => {
        const brandsPriority = ['Adidas', 'Asics', 'Brooks', 'Hoka', 'Mizuno', 'New Balance', 'Nike', 'On Running', 'Puma', 'Saucony', 'Olympikus'];
        const combined = [...SHOE_DATABASE, ...customShoes];
        return combined.sort((a, b) => {
            const aPriority = brandsPriority.indexOf(a.brand);
            const bPriority = brandsPriority.indexOf(b.brand);
            if (aPriority !== bPriority) return (aPriority === -1 ? 1 : aPriority) - (bPriority === -1 ? 1 : bPriority);
            return a.model.localeCompare(b.model);
        });
    }, [customShoes]);

    const applyShoeModel = (shoe: ShoeModel) => {
        form.setValue("shoe.model", `${shoe.brand} ${shoe.model}`);
        form.setValue("shoe.weight", shoe.weight);
        form.setValue("shoe.drop", shoe.drop);
        form.setValue("shoe.stack", shoe.stackHeight);

        // Mapeamento Estabilidade (Score 0-5, Inverso: 0 = minimalista, 5 = estabilidade total)
        form.setValue("shoe.stability", shoe.stabilityControl ? "4" : "0");

        // Mapeamento Flexibilidade (0-2.5)
        let flexVal = "0.5";
        if (shoe.flexibility === 'high') flexVal = "2.5";
        else if (shoe.flexibility === 'medium') flexVal = "1.5";

        form.setValue("shoe.flex_long", flexVal);
        form.setValue("shoe.flex_tors", flexVal);

        toast.success(`${shoe.model} aplicado com sucesso!`);
        setSearchOpen(false);
    };

    const shoeVals = useWatch({ control: form.control, name: "shoe" });

    const minIndexResult = useMemo(() => {
        if (!shoeVals) return 0;
        return calculateMinimalistIndex(shoeVals);
    }, [shoeVals]);

    async function handleSaveNewShoe() {
        const modelName = form.getValues("shoe.model");
        if (!modelName || modelName.trim() === "" || modelName.includes("Selecione")) {
            toast.error("Por favor, digite o nome do modelo de tênis primeiro.");
            return;
        }

        const parts = modelName.trim().split(' ');
        const brand = parts[0];
        const model = parts.slice(1).join(' ') || 'Modelo Personalizado';

        setIsSavingShoe(true);
        try {
            const res = await saveShoeModel({
                brand,
                model,
                weight: Number(form.getValues("shoe.weight") || 0),
                drop: Number(form.getValues("shoe.drop") || 0),
                stackHeight: Number(form.getValues("shoe.stack") || 0),
                minimalismIndex: minIndexResult,
                organization_id: organizationId,
                is_global: true
            });

            if (res.success) {
                toast.success("Modelo salvo no banco de dados global!");
                const updated = await fetchCustomShoes();
                setCustomShoes(updated);
            } else {
                toast.error("Erro ao salvar: " + res.error);
            }
        } catch (e) {
            console.error("Save Shoe Error:", e);
            toast.error("Erro inesperado ao salvar tênis.");
        } finally {
            setIsSavingShoe(false);
        }
    }

    const shoeRecommendations = useMemo(() => {
        const type = shoeVals?.injuryType;
        const status = shoeVals?.injuryStatus;

        let rec = {
            text: "Tênis neutro recomendado.",
            image: "👟",
            feature: "Drop 6-8mm | Amortecimento Moderado",
            details: "Mantenha o uso habitual enquanto não forem observados sintomas de dor.",
            color: "bg-slate-50 border-slate-200 text-slate-700"
        };

        if (status === "acute") {
            rec = {
                text: "Fase Aguda: Evite mudanças importantes nesse momento.",
                image: "⚠️",
                feature: "Necessário melhor controle dos movimentos e estabilidade.",
                details: "Mantenha o tênis atual, inicie ou dê continuidade a um programa de reabilitação e avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de aliviar os sintomas.",
                color: "bg-amber-50 border-amber-200 text-amber-800"
            };
        } else if (type === "achilles") {
            rec = {
                text: "Tênis com Drop Elevado Recomendado",
                image: "📐",
                feature: "Drop > 8mm",
                details: "Ajuda a Reduzir a tensão mecânica no tendão Avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de minimizar a sobrecarga no tendão de Aquiles e músculos da panturrilha",
                color: "bg-blue-50 border-blue-200 text-blue-900"
            };
        } else if (type === "pfps") {
            rec = {
                text: "Tênis com Drop Baixo / Minimalista",
                image: "👣",
                feature: "Drop 0-4mm",
                details: "Ajuda a Reduzir o estresse na articulação patelofemoral reduzindo a dor anterior do joelho. Avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de melhorar a distribuição de forças na articulação patelofemoral",
                color: "bg-green-50 border-green-200 text-green-900"
            };
        } else if (type === "stress_fracture") {
            rec = {
                text: "Maximalista / Rocker Sole",
                image: "☁️",
                feature: "Stack Alto | Rocker Sole",
                details: "Protege os metatarsos durante a fase de propulsão. Avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de reduzir a pressão nos metatarsos",
                color: "bg-orange-50 border-orange-200 text-orange-900"
            };
        }
        return rec;
    }, [shoeVals]);

    return (
        <AccordionItem
            value="shoe"
            data-value="shoe"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'shoe' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-blue-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('shoe') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <Footprints className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-blue-600 transition-colors">Tênis (Recomendação Técnica)</span>
                </div>
                <div className="flex items-center gap-2 mr-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="p-1.5 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open('https://www.youtube.com/watch?v=OcJgc8wTk9k', '_blank');
                                    }}
                                >
                                    <BookOpen className="w-4 h-4" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-[10px] font-bold">Ver Tutorial: Índice Minimalista</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {isSectionFilled('shoe') && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6 border-t border-slate-50">
                <div className="flex justify-start">
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl px-4 shadow-sm group">
                                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Buscar Tênis no Banco de Dados
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0 rounded-2xl shadow-2xl border-blue-100" align="start">
                            <Command className="rounded-2xl">
                                <CommandInput placeholder="Ex: Pegasus, Nimbus, Adios Pro..." className="h-10" />
                                <CommandList className="max-h-[300px]">
                                    <CommandEmpty>Calçado não encontrado no banco.</CommandEmpty>
                                    <CommandGroup heading="Calçados (The Running Clinic)">
                                        {ALL_SHOES.map((shoe) => (
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

                <div className="space-y-1">
                    <FormLabel className="text-blue-900 text-xs font-bold uppercase tracking-wider">1. Localização / Tipo de Lesão</FormLabel>
                    <Select onValueChange={v => form.setValue("shoe.injuryType", v)}>
                        <SelectTrigger className="bg-white border-blue-200 h-10 shadow-sm w-full">
                            <SelectValue placeholder="Selecione a patologia..." />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" className="z-[110]">
                            <SelectItem value="achilles">Tendinopatia de Aquiles / Panturrilha</SelectItem>
                            <SelectItem value="pfps">Dor Patelofemoral (Joelho)</SelectItem>
                            <SelectItem value="stress_fracture">Fratura por Estresse / Metatarsalgia</SelectItem>
                            <SelectItem value="plantar_fasciitis">Fasciíte Plantar</SelectItem>
                            <SelectItem value="none">Prevenção / Outros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Estado da Lesão</FormLabel>
                        <Select onValueChange={v => form.setValue("shoe.injuryStatus", v)}>
                            <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent position="popper" side="bottom" className="z-[110]">
                                <SelectItem value="none">Sem Lesão Ativa</SelectItem>
                                <SelectItem value="acute">Fase Aguda (Recente)</SelectItem>
                                <SelectItem value="chronic">Fase Crônica ({'>'} 3 meses)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Objetivo</FormLabel>
                        <Select onValueChange={v => form.setValue("shoe.goals", [v])}>
                            <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent position="popper" side="bottom" className="z-[110]">
                                <SelectItem value="pain_reduction">Conforto / Menos Dor</SelectItem>
                                <SelectItem value="performance">Performance / Velocidade</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Nível</FormLabel>
                        <Select onValueChange={v => form.setValue("shoe.experience", v)}>
                            <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent position="popper" side="bottom" className="z-[110]">
                                <SelectItem value="beginner">Iniciante</SelectItem>
                                <SelectItem value="amateur">Amador</SelectItem>
                                <SelectItem value="elite">Elite</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className={cn("p-5 rounded-2xl border-2 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 transition-all shadow-sm", shoeRecommendations.color)}>
                    <div className="flex-shrink-0 w-16 h-16 bg-white/80 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-white">
                        {shoeRecommendations.image}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <Badge className="mb-2 text-[10px] uppercase font-black tracking-widest bg-white/20 hover:bg-white/30 text-current border-none">
                            {shoeRecommendations.feature}
                        </Badge>
                        <h4 className="font-bold text-lg leading-tight mb-1">{shoeRecommendations.text}</h4>
                        <p className="text-sm leading-relaxed font-medium opacity-90 italic">
                            {shoeRecommendations.details}
                        </p>
                    </div>
                </div>

                <div className="space-y-1">
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Modelo / Marca do Tênis</FormLabel>
                    <Input
                        {...form.register("shoe.model")}
                        placeholder="Ex: Nike Pegasus 40, Olympikus Corre 3..."
                        className="h-10 bg-white border-slate-200 font-bold text-slate-700"
                    />
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative group">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Peso (g)</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="text-[10px]">{ORIENTATIONS.peso}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.weight")} />
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative group">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Drop (mm)</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="text-[10px]">{ORIENTATIONS.drop}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.drop")} />
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative group">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Stack (mm)</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="text-[10px]">{ORIENTATIONS.stack}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.stack")} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ShoeScale
                            label="Flex. Longitudinal"
                            value={form.watch("shoe.flex_long")}
                            onChange={(v) => form.setValue("shoe.flex_long", v)}
                            options={[{ val: "0", label: "" }, { val: "0.5", label: "" }, { val: "1", label: "" }, { val: "1.5", label: "" }, { val: "2", label: "" }, { val: "2.5", label: "" }]}
                            tooltip={ORIENTATIONS.flex_long}
                        />
                        <ShoeScale
                            label="Flex. Torsional"
                            value={form.watch("shoe.flex_tors")}
                            onChange={(v) => form.setValue("shoe.flex_tors", v)}
                            options={[{ val: "0", label: "" }, { val: "0.5", label: "" }, { val: "1", label: "" }, { val: "1.5", label: "" }, { val: "2", label: "" }, { val: "2.5", label: "" }]}
                            tooltip={ORIENTATIONS.flex_tor}
                        />
                        <ShoeScale
                            label="Estabilidade"
                            value={form.watch("shoe.stability")}
                            onChange={(v) => form.setValue("shoe.stability", v)}
                            options={[{ val: "5", label: "" }, { val: "4", label: "" }, { val: "3", label: "" }, { val: "2", label: "" }, { val: "1", label: "" }, { val: "0", label: "" }]}
                            tooltip={ORIENTATIONS.estabilidade}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-2xl flex flex-col md:flex-row items-center justify-between text-white shadow-xl gap-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Youtube className="w-24 h-24" />
                    </div>
                    <div className="space-y-1 text-center md:text-left z-10">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Índice Minimalista Estimado</h4>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[280px] p-4 bg-slate-800 text-white border-none shadow-2xl">
                                        <div className="space-y-2">
                                            <p className="font-bold text-sm text-blue-400">Minimalismo x Maximalismo</p>
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
                        <p className="text-[10px] text-slate-400">Metodologia: The Running Clinic.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 z-10">
                        <div className="flex flex-col items-center sm:items-end gap-2">
                            <div className="text-5xl font-black text-white">{minIndexResult}%</div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[9px] font-black uppercase tracking-tighter bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all gap-1.5 focusable-element"
                                onClick={handleSaveNewShoe}
                                disabled={isSavingShoe}
                            >
                                {isSavingShoe ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                                Salvar no Banco Global
                            </Button>
                        </div>
                        <Badge className={cn("px-4 py-1.5 font-bold text-[11px] w-full sm:w-auto justify-center shadow-lg uppercase",
                            minIndexResult > 70 ? "bg-green-500 shadow-green-500/20" :
                                minIndexResult < 30 ? "bg-red-500 shadow-red-500/20" :
                                    "bg-blue-500 shadow-blue-500/20")}>
                            {minIndexResult > 70 ? "MINIMALISTA" : minIndexResult < 30 ? "MAXIMALISTA" : "TRANSIÇÃO"}
                        </Badge>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
