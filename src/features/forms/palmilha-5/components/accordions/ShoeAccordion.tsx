import React, { useState, useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Footprints, BookOpen, Search, Youtube, Info, Database, Loader2, Zap, ThumbsUp, Activity, Ruler, Bone, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
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
    drop: "Diferença de altura entre o calcanhar e o antepé. Drops baixos (0-4mm) favorecem a pisada de meio-pé/antepé.",
    stack: "Espessura total da sola do chão. Espessuras menores que 20mm aumentam o feedback sensorial do pé.",
    estabilidade: "Presença de tecnologias de controle de pronação (placas firmes, cunhas mediais). Se o tênis for DURO/CHEIO DE CONTROLE, marque 5. Se for de espuma limpa (TOTALMENTE NEUTRO), marque 0.",
    flex_long: "Rigidez na ponta do tênis. Se você conseguir dobrar a frente do tênis com 1 dedo facilmente, marque 2.5 (Minimalista). Se não dobrar nada (ex: placa de carbono, sola muito dura), marque 0 (Maximalista).",
    flex_tor: "Capacidade de torcer o tênis como um pano. Se torcer com muita facilidade, marque 2.5 (Minimalista). Se o chassi for rígido e o tênis não torcer nada lateralmente, marque 0 (Maximalista).",
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

export const getShoeRecommendationFlow = (shoeVals: any) => {
    const exp = shoeVals?.experience || "recreational";
    const isInjured = shoeVals?.isInjured === "true" || shoeVals?.isInjured === true;
    const injuryStatus = shoeVals?.injuryStatus || "acute";
    const injuryLoc = shoeVals?.injuryLocation || "achilles";
    const perfGoal = shoeVals?.perfGoal || "satisfied";
    const seasonPhase = shoeVals?.seasonPhase || "lasting";

    let rec = {
        text: "Prescrição Baseada em Conforto",
        image: <Footprints className="w-8 h-8 text-slate-400" />,
        feature: "Manter o calçado atual se confortável",
        details: "Preencha os campos para visualizar a recomendação técnica automática baseada na árvore de decisão da The Running Clinic.",
        color: "bg-slate-50 border-slate-200 text-slate-700"
    };

    if (isInjured) {
        if (injuryStatus === "acute") {
            if (injuryLoc === "anterior") {
                rec = { text: "Lesão Aguda: Perna Anterior, Joelho ou Acima", image: <Activity className="w-8 h-8 text-amber-500" />, feature: "Minimalista (> 60%)", details: "Perna anterior ou joelho: recomendado transferir a carga mecânica. Busque maior Índice Minimalista.", color: "bg-amber-50 border-amber-200 text-amber-900" };
            } else if (injuryLoc === "achilles") {
                rec = { text: "Lesão Aguda: Tendão de Aquiles ou Panturrilha", image: <AlertCircle className="w-8 h-8 text-orange-500" />, feature: "Proteção / Maximalista (< 50%)", details: "Maior Stack Height (Espessura) e Maior Amortecimento para reduzir imediata tensão na perna posterior.", color: "bg-orange-50 border-orange-200 text-orange-900" };
            } else if (injuryLoc === "metatarsal") {
                rec = { text: "Lesão Aguda: Metatarsalgia ou Fratura por Estresse", image: <Bone className="w-8 h-8 text-red-500" />, feature: "Rocker / Estruturado (< 40%)", details: "Maior Stack Height, Maior Amortecimento e Maior Rigidez Longitudinal (Placa/Rocker) para isolar os metatarsos.", color: "bg-red-50 border-red-200 text-red-900" };
            } else if (injuryLoc === "tibialis") {
                rec = { text: "Lesão Aguda: Tibial Posterior / Canelite", image: <Activity className="w-8 h-8 text-rose-500" />, feature: "Estrutural (< 50%)", details: "Maior Stack Height e Controle de Movimento (Motion Control).", color: "bg-rose-50 border-rose-200 text-rose-900" };
            } else if (injuryLoc === "plantar") {
                rec = { text: "Lesão Aguda: Fasciopatia Plantar", image: <Footprints className="w-8 h-8 text-rose-600" />, feature: "Estruturado (< 40%)", details: "Maior Stack Height, Maior Suporte de Arco e Maior Rigidez Longitudinal.", color: "bg-rose-50 border-rose-200 text-rose-900" };
            } else if (injuryLoc === "compartment") {
                rec = { text: "Lesão Aguda: Síndrome Compartimental Post.", image: <Activity className="w-8 h-8 text-amber-600" />, feature: "Proteção (< 50%)", details: "Maior Stack Height e Maior Amortecimento.", color: "bg-amber-50 border-amber-200 text-amber-900" };
            }
        } else {
            if (injuryLoc === "anterior") {
                rec = { text: "Lesão Persistente: Perna Anterior ou Joelho", image: <Activity className="w-8 h-8 text-green-500" />, feature: "Altamente Minimalista (> 70%)", details: "Adaptação recomendada para redução crônica de impacto no joelho.", color: "bg-green-50 border-green-200 text-green-900" };
            } else if (injuryLoc === "muscle_tendon" || injuryLoc === "achilles" || injuryLoc === "compartment") {
                rec = { text: "Lesão Persistente: Músculo ou Tendão", image: <Zap className="w-8 h-8 text-blue-500" />, feature: "Rápida Adaptação (> 50%)", details: "Tecidos com alto potencial de adaptação rápida. Progredir para calçados mais minimalistas.", color: "bg-blue-50 border-blue-200 text-blue-900" };
            } else if (injuryLoc === "fascia_bone" || injuryLoc === "tibialis" || injuryLoc === "plantar" || injuryLoc === "metatarsal") {
                rec = { text: "Lesão Persistente: Fáscia, Periósteo ou Osso", image: <Ruler className="w-8 h-8 text-cyan-500" />, feature: "Adaptação Lenta (> 50%)", details: "Alto potencial, mas para uma adaptação mais lenta (transição gradual e cautelosa).", color: "bg-cyan-50 border-cyan-200 text-cyan-900" };
            } else if (injuryLoc === "neuroma_arthrosis") {
                rec = { text: "Lesão Persistente: Neuroma, Artrose, Metatarsalgia", image: <AlertCircle className="w-8 h-8 text-red-500" />, feature: "Baixo Potencial (< 60%)", details: "Baixo potencial anatômico para adaptação à carga. Mantenha suporte.", color: "bg-red-50 border-red-200 text-red-900" };
            } else if (injuryLoc === "toe_hallux") {
                rec = { text: "Lesão Persistente: Dedos (Hallux Valgus/Rigidus)", image: <Bone className="w-8 h-8 text-orange-600" />, feature: "Ajuste Anatômico (< 80%)", details: "Ajuste anatômico largo e MAIOR rigidez longitudinal.", color: "bg-orange-50 border-orange-200 text-orange-900" };
            }
        }
    } else {
        if (exp === "beginner") {
            if (injuryLoc === "none") {
                rec = { text: "Iniciante: Sem Histórico de Lesão", image: <ThumbsUp className="w-8 h-8 text-indigo-500" />, feature: "Transição Sugerida (> 70%)", details: "Almejar maior índice minimalista a longo prazo com integração gradual para garantir adaptação sem dor.", color: "bg-indigo-50 border-indigo-200 text-indigo-900" };
            } else if (injuryLoc === "history_anterior") {
                rec = { text: "Iniciante: Com Histórico (Joelho/Anterior)", image: <Activity className="w-8 h-8 text-emerald-500" />, feature: "Transição Sugerida (> 70%)", details: "Integrar gradualmente novos tênis minimalistas na rotina.", color: "bg-emerald-50 border-emerald-200 text-emerald-900" };
            } else if (injuryLoc === "history_posterior") {
                rec = { text: "Iniciante: Com Histórico (Perna Posteior/Pé)", image: <AlertCircle className="w-8 h-8 text-amber-500" />, feature: "Cuidado na Transição (> 40%)", details: "Devido ao histórico no tendão/pé, mantenha perfil estruturado com cautela na transição minimalista.", color: "bg-amber-50 border-amber-200 text-amber-900" };
            }
        } else if (exp === "competitive") {
            if (seasonPhase === "beginning") {
                rec = { text: "Competitivo: Início de Temporada", image: <Zap className="w-8 h-8 text-violet-500" />, feature: "Leveza (> 50%)", details: "Quanto mais leve, melhor. Use tênis de performance na maioria das sessões.", color: "bg-violet-50 border-violet-200 text-violet-900" };
            } else if (seasonPhase === "lasting") {
                rec = { text: "Competitivo: Durante a Temporada", image: <Zap className="w-8 h-8 text-purple-600" />, feature: "Manutenção (> 50%)", details: "Evite mudanças bruscas de hábitos. O atleta pode adaptar para tênis de performance integrando gradualmente durante os treinos.", color: "bg-purple-50 border-purple-200 text-purple-900" };
            } else if (seasonPhase === "off") {
                rec = { text: "Competitivo: Off-Season", image: <ThumbsUp className="w-8 h-8 text-blue-500" />, feature: "Repouso Mecânico (> 70%)", details: "Use tênis de performance e minimalistas em corridas curtas de distância.", color: "bg-blue-50 border-blue-200 text-blue-900" };
            }
        } else {
            if (perfGoal === "satisfied") {
                rec = { text: "Recreacional: Satisfeito com Performance", image: <ThumbsUp className="w-8 h-8 text-emerald-500" />, feature: "Sem Mudança de Hábitos", details: "A regra de ouro neste cenário é NÃO MUDAR radicalmente a tecnologia do tênis atual.", color: "bg-emerald-50 border-emerald-200 text-emerald-900" };
            } else if (perfGoal === "improve_efficient") {
                rec = { text: "Recreacional: Melhorar Performance (Eficiente)", image: <Activity className="w-8 h-8 text-blue-500" />, feature: "Treinar Performance (> 50%)", details: "Mecânica eficiente (Cadência > 170). Use em todas as sessões: quanto mais leve melhor.", color: "bg-blue-50 border-blue-200 text-blue-900" };
            } else if (perfGoal === "improve_inefficient") {
                rec = { text: "Recreacional: Melhorar Performance (Ineficiente)", image: <AlertCircle className="w-8 h-8 text-indigo-500" />, feature: "Treinar Performance (> 50%)", details: "Mecânica menos eficiente (Cadência < 160, desgaste no calcanhar). Use em todas as sessões: quanto mais leve melhor.", color: "bg-indigo-50 border-indigo-200 text-indigo-900" };
            }
        }
    }
    return rec;
};

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

    const shoeVals = form.watch("shoe");
    const minIndexResult = calculateMinimalistIndex(shoeVals || {});

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

    const shoeRecommendations = useMemo(() => getShoeRecommendationFlow(shoeVals), [JSON.stringify(shoeVals)]);

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

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <FormLabel className="text-blue-900 text-[10px] font-bold uppercase tracking-wider">A) Nível de Experiência</FormLabel>
                            <Select onValueChange={v => form.setValue("shoe.experience", v)} value={shoeVals?.experience || "recreational"}>
                                <SelectTrigger className="bg-white border-blue-200 h-10 shadow-sm w-full font-semibold">
                                    <SelectValue placeholder="Selecione o nível..." />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="z-[110]">
                                    <SelectItem value="beginner">Iniciante (&lt; 6 meses)</SelectItem>
                                    <SelectItem value="recreational">Recreacional (&gt; 6 meses)</SelectItem>
                                    <SelectItem value="competitive">Competitivo (Foco em Performance)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <FormLabel className="text-blue-900 text-[10px] font-bold uppercase tracking-wider">B) Paciente está Lesionado?</FormLabel>
                            <Select onValueChange={v => form.setValue("shoe.isInjured", v)} value={shoeVals?.isInjured || "false"}>
                                <SelectTrigger className="bg-white border-blue-200 h-10 shadow-sm w-full font-semibold">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="z-[110]">
                                    <SelectItem value="true">SIM (Lesionado / Com Dor)</SelectItem>
                                    <SelectItem value="false">NÃO (Sem Lesão Atual)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 gap-4">
                        {shoeVals?.isInjured === "true" ? (
                            <>
                                <div className="space-y-1">
                                    <FormLabel className="text-slate-600 text-[10px] font-bold uppercase">Estado da Lesão Atual</FormLabel>
                                    <Select onValueChange={v => form.setValue("shoe.injuryStatus", v)} value={shoeVals?.injuryStatus || "acute"}>
                                        <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            <SelectItem value="acute">Dor Aguda / Recente (&lt; 6 Semanas)</SelectItem>
                                            <SelectItem value="chronic">Dor Persistente (&gt; 6 Semanas)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <FormLabel className="text-slate-600 text-[10px] font-bold uppercase">Tipo / Localização da Lesão</FormLabel>
                                    <Select onValueChange={v => form.setValue("shoe.injuryLocation", v)} value={shoeVals?.injuryLocation || "anterior"}>
                                        <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione a patologia..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            {shoeVals?.injuryStatus === "acute" ? (
                                                <SelectGroup>
                                                    <SelectLabel>Fase Aguda (&lt; 6 Semanas)</SelectLabel>
                                                    <SelectItem value="anterior">Perna Anterior, Joelho ou Acima</SelectItem>
                                                    <SelectItem value="achilles">Tendão de Aquiles ou Panturrilha</SelectItem>
                                                    <SelectItem value="metatarsal">Metatarsalgia ou Fratura por Estresse</SelectItem>
                                                    <SelectItem value="tibialis">Tendinopatia Tibial Posterior ou Canelite</SelectItem>
                                                    <SelectItem value="plantar">Fasciopatia Plantar</SelectItem>
                                                    <SelectItem value="compartment">Síndrome do Compartimento Posterior</SelectItem>
                                                </SelectGroup>
                                            ) : (
                                                <SelectGroup>
                                                    <SelectLabel>Fase Persistente (&gt; 6 Semanas)</SelectLabel>
                                                    <SelectItem value="anterior">Perna Anterior, Joelho ou Acima</SelectItem>
                                                    <SelectItem value="muscle_tendon">Lesões Musculares ou Tendíneas</SelectItem>
                                                    <SelectItem value="fascia_bone">Lesão na Fáscia, Periósteo ou Osso</SelectItem>
                                                    <SelectItem value="neuroma_arthrosis">Neuroma, Metatarsalgia, Dor no Calcanhar ou Osteoartrite</SelectItem>
                                                    <SelectItem value="toe_hallux">Lesões nos Dedos (Hallux Valgus/Rigidus)</SelectItem>
                                                </SelectGroup>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <>
                                {shoeVals?.experience === "beginner" && (
                                    <div className="space-y-1">
                                        <FormLabel className="text-slate-600 text-[10px] font-bold uppercase">Histórico Prévio (Prevenção)</FormLabel>
                                        <Select onValueChange={v => form.setValue("shoe.injuryLocation", v)} value={shoeVals?.injuryLocation || "none"}>
                                            <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent position="popper" side="bottom" className="z-[110]">
                                                <SelectItem value="none">Sem Histórico de Lesão</SelectItem>
                                                <SelectItem value="history_anterior">Histórico de Lesão em Perna Anterior/Joelho</SelectItem>
                                                <SelectItem value="history_posterior">Histórico de Lesão em Perna Posterior/Pé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {(shoeVals?.experience === "recreational" || !shoeVals?.experience) && (
                                    <div className="space-y-1">
                                        <FormLabel className="text-slate-600 text-[10px] font-bold uppercase">Objetivo e Mecânica (Recreacional)</FormLabel>
                                        <Select onValueChange={v => form.setValue("shoe.perfGoal", v)} value={shoeVals?.perfGoal || "satisfied"}>
                                            <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent position="popper" side="bottom" className="z-[110]">
                                                <SelectItem value="satisfied">Satisfeito com a Performance Atual</SelectItem>
                                                <SelectItem value="improve_efficient">Melhorar Performance (Mecânica Eficiente - Cadência &gt; 170)</SelectItem>
                                                <SelectItem value="improve_inefficient">Melhorar Performance (Mecânica Ineficiente - Cadência &lt; 160)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {shoeVals?.experience === "competitive" && (
                                    <div className="space-y-1">
                                        <FormLabel className="text-slate-600 text-[10px] font-bold uppercase">Fase da Temporada (Competitivo)</FormLabel>
                                        <Select onValueChange={v => form.setValue("shoe.seasonPhase", v)} value={shoeVals?.seasonPhase || "beginning"}>
                                            <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent position="popper" side="bottom" className="z-[110]">
                                                <SelectItem value="beginning">Beginning of Season (Início)</SelectItem>
                                                <SelectItem value="lasting">Lasting Season (Durante a Temporada)</SelectItem>
                                                <SelectItem value="off">Off Season (Fora de Temporada)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}
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
