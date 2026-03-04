import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Ear, MapPin, Search, ChevronsUpDown, Trash2, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const REGION_OPTIONS = [
    { id: "coluna_lombar", label: "Coluna Lombar", keywords: ["lombar", "costas", "ciático", "glúteo"] },
    { id: "coluna_cervical", label: "Coluna Cervical", keywords: ["pescoço", "nuca", "cervical", "ombros"] },
    { id: "ombro", label: "Ombro", keywords: ["ombro", "braço", "bíceps", "manguito"] },
    { id: "joelho", label: "Joelho", keywords: ["joelho", "falseio", "travamento", "edema", "menisco"] },
    { id: "tornozelo_pe", label: "Tornozelo e Pé", keywords: ["pé", "tornozelo", "calcanhar", "dedo", "diabet", "sensib"] },
    { id: "quadril", label: "Quadril", keywords: ["quadril", "virilha", "fêmur"] },
    { id: "cotovelo_mao", keywords: ["mão", "punho", "dedo", "carpo", "cotovelo"], label: "Cotovelo/Punho/Mão" },
    { id: "atm", label: "ATM (Temporomandibular)", keywords: ["boca", "mandíbula", "estalo", "rosto"] },
];

const QUESTION_BANK = [
    { id: "start", text: "Qual o motivo da sua consulta hoje?", keywords: ["dor", "motivo", "buscando", "vontade", "queixa", "incomoda"] },
    { id: "duration", text: "Há quanto tempo você sente esse sintoma?", keywords: ["tempo", "dia", "mês", "ano", "semana", "desde", "quanto tempo"] },
    { id: "onset", text: "Começou de repente ou foi aparecendo aos poucos?", keywords: ["repente", "súbito", "lento", "progressivo", "devagar", "acidente", "trauma"] },
    { id: "behavior_p", text: "O que você faz que piora a sua dor?", keywords: ["piora", "agrav", "sentar", "correr", "andar", "subir", "esforço", "peso"] },
    { id: "behavior_m", text: "O que você faz que traz algum alívio?", keywords: ["melhora", "alívi", "repouso", "gelo", "remédio", "deitar", "descanso"] },
    { id: "quality", text: "Como é essa dor? Pontada, agulhada, queimação ou peso?", keywords: ["tipo", "como", "pontada", "queima", "peso", "choque", "agulha", "finca"] },
    { id: "irradiance", text: "A dor fica parada em um lugar ou ela 'corre' para algum lugar?", keywords: ["irradia", "corre", "desce", "ponta", "mão", "pé", "sobe"] },
    { id: "night", text: "A dor te acorda à noite ou te impede de dormir?", keywords: ["noite", "dormir", "madrugada", "insônia", "sono"] },
    { id: "neuro", text: "Sente algum formigamento, dormência ou fraqueza?", keywords: ["formiga", "dormência", "choque", "fraqueza", "sensib", "adormece"] },
    { id: "impact", text: "Como isso está limitando seu trabalho ou lazer?", keywords: ["trabalho", "academia", "lazer", "limit", "impede", "esporte", "dia a dia"] },
    { id: "trauma", text: "Houve algum acidente ou queda recente?", keywords: ["acidente", "queda", "bato", "trauma", "caí", "pancada"] },
];

interface HmaAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    setFeegowImportOpen: (open: boolean) => void;
    isImported: boolean;
    sectionStyle: { border: string; iconColor: string };
    isListening?: boolean;
}

export function HmaAccordion({ openSection, isSectionFilled, setFeegowImportOpen, isImported, sectionStyle, isListening }: HmaAccordionProps) {
    const form = useFormContext();
    const [openRegion, setOpenRegion] = React.useState(false);
    const [draftText, setDraftText] = React.useState("");

    React.useEffect(() => {
        if (!isListening) {
            setDraftText("");
            return;
        }

        const draft = localStorage.getItem('axiom-copilot-draft') || "";
        setDraftText(draft);

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'axiom-copilot-draft') {
                setDraftText(e.newValue || "");
            }
        };

        const interval = setInterval(() => {
            const current = localStorage.getItem('axiom-copilot-draft') || "";
            if (current !== draftText) {
                setDraftText(current);
            }
        }, 1000);

        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, [isListening, draftText]);

    // Safely parse EVA value whether it's an array or number
    const evaRaw = form.watch('hma.eva');
    const evaValue = Array.isArray(evaRaw) ? (evaRaw[0] || 0) : (Number(evaRaw) || 0);
    const selectedRegions = form.watch('hma.mainRegions') || [];

    const handleRegionToggle = (id: string) => {
        const current = form.getValues('hma.mainRegions') || [];
        if (current.includes(id)) {
            form.setValue('hma.mainRegions', current.filter((r: string) => r !== id));
        } else {
            form.setValue('hma.mainRegions', [...current, id]);
        }
    };

    return (
        <AccordionItem
            value="hma"
            data-value="hma"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'hma' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-blue-50' : 'col-span-1',
                isSectionFilled('hma') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <Ear className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-blue-600 transition-colors">Anamnese e Queixa Principal</span>
                </div>
                <div className="flex items-center gap-2 mr-4">
                    {selectedRegions.length > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none text-[10px] h-5 font-black px-2">
                            {selectedRegions.length} REG
                        </Badge>
                    )}
                    {isSectionFilled('hma') && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-5 space-y-6 border-t border-slate-50">
                {/* Region Mapping */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mapeamento das Regiões de Queixa</FormLabel>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                        {selectedRegions.length > 0 ? (
                            selectedRegions.map((region: string) => (
                                <Badge key={region} className="bg-blue-600 hover:bg-blue-700 text-white pl-3 pr-1 py-1 rounded-xl flex items-center gap-1.5 shadow-sm transition-all animate-in zoom-in-90 border-none">
                                    <span className="text-[10px] font-black uppercase tracking-tight">{REGION_OPTIONS.find(r => r.id === region)?.label || region}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 hover:bg-blue-800 text-white/70 rounded-lg transition-colors"
                                        onClick={() => handleRegionToggle(region)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))
                        ) : (
                            <p className="text-[10px] font-bold text-slate-300 italic uppercase py-1">Nenhuma região selecionada para protocolos regionais...</p>
                        )}
                    </div>

                    <Popover open={openRegion} onOpenChange={setOpenRegion}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-12 bg-white border-slate-200 rounded-xl shadow-sm hover:border-blue-300 hover:bg-blue-50/10 text-slate-600 font-bold text-xs transition-all">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-blue-500" />
                                    {selectedRegions.length === 0 ? "Adicionar Região de Queixas..." : `${selectedRegions.length} Regiões Selecionadas`}
                                </div>
                                <ChevronsUpDown className="h-4 w-4 opacity-30" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0 rounded-2xl overflow-hidden shadow-2xl border-none z-[150]" align="start">
                            <Command className="border-none">
                                <CommandInput placeholder="Ex: Joelho, Cervical..." className="h-12 border-none ring-0 focus:ring-0" />
                                <CommandList className="max-h-[300px] p-2 bg-white">
                                    <CommandEmpty className="p-4 text-center text-slate-400 text-xs font-medium italic uppercase tracking-tighter">Nenhuma região encontrada.</CommandEmpty>
                                    <CommandGroup>
                                        {REGION_OPTIONS.map(opt => {
                                            const isSelected = selectedRegions.includes(opt.id);
                                            return (
                                                <CommandItem
                                                    key={opt.id}
                                                    onSelect={() => handleRegionToggle(opt.id)}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 group",
                                                        isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 group-hover:border-blue-400"
                                                        )}>
                                                            {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-slate-300" />}
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-tight">{opt.label}</span>
                                                    </div>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">Queixa Principal (QP)</FormLabel>
                        <Input
                            {...form.register('hma.qp')}
                            className="bg-white h-11 border-slate-200 rounded-xl font-medium focus:ring-blue-500 shadow-sm"
                            placeholder="Motivo principal do comparecimento à clínica..."
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">História da Moléstia Atual (HMA)</FormLabel>
                    <Textarea
                        {...form.register('hma.history')}
                        placeholder={(() => {
                            const qp = form.watch('hma.qp')?.toLowerCase() || "";
                            const hist = form.watch('hma.history')?.toLowerCase() || "";
                            const text = (qp + " " + hist + " " + draftText).toLowerCase();

                            if (isListening || draftText) {
                                // Filter questions not yet answered (by keyword check)
                                const available = QUESTION_BANK.filter(q =>
                                    !text.split(' ').some(word => q.keywords.some(k => word.includes(k)))
                                );

                                // Take 4 suggestions
                                const suggestions = available.slice(0, 4);

                                if (suggestions.length === 0) return "ANAMNESE COMPLETA! IA está processando os dados finais...";

                                return "Assistente de IA ATIVO: Principais perguntas para fazer agora:\n" +
                                    suggestions.map((s, i) => `${i + 1}. ${s.text}`).join("\n");
                            }

                            if (text.includes("diabet") || text.includes("pé") || text.includes("ferid") || text.includes("sensib")) {
                                return "Perguntas Chave (Pé Diabético):\n1. Já teve feridas nos pés que demoraram a cicatrizar?\n2. Sente queimação ou formigamento constante?\n3. Já teve úlceras prévias ou amputações?";
                            }
                            if (text.includes("lombar") || text.includes("costas") || text.includes("ciátic")) {
                                return "Perguntas Chave (Coluna Lombar):\n1. A dor irradia para as pernas?\n2. Sente fraqueza nos pés ou pernas ao caminhar?\n3. Teve perda de força súbita ou alteração de sensibilidade em sela?";
                            }
                            if (text.includes("cervical") || text.includes("pescoç") || text.includes("braç")) {
                                return "Perguntas Chave (Pescoço/Braço):\n1. A dor irradia para as mãos?\n2. Sente tonturas, visão turva ou náuseas?\n3. Teve algum trauma de chicote (acidente)?";
                            }

                            return "Registre o histórico completo dos sintomas e mecanismos de lesão do paciente... (Dica: Use a Inteligência Artificial do Axiom abaixo para transcrever isso!)";
                        })()}
                        className="bg-white min-h-[160px] text-sm leading-relaxed border-slate-200 rounded-xl focus:ring-blue-500 shadow-sm"
                    />
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex justify-between items-end mb-5">
                        <div className="space-y-1">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500">Intensidade da Dor</FormLabel>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Escala Visual Analógica (EVA)</p>
                        </div>
                        <span className={cn(
                            "text-4xl font-black transition-colors",
                            evaValue >= 8 ? "text-red-500" :
                                evaValue >= 4 ? "text-orange-500" :
                                    "text-emerald-500"
                        )}>{evaValue}</span>
                    </div>
                    <Slider
                        max={10}
                        step={1}
                        value={[evaValue]}
                        onValueChange={(v: number[]) => form.setValue('hma.eva', v)}
                        className={cn(
                            "[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:border-4 transition-colors duration-300",
                            evaValue >= 8 ? "[&_[role=slider]]:border-red-500 [&_.bg-primary]:bg-red-500" :
                                evaValue >= 4 ? "[&_[role=slider]]:border-orange-500 [&_.bg-primary]:bg-orange-500" :
                                    "[&_[role=slider]]:border-emerald-500 [&_.bg-primary]:bg-emerald-500"
                        )}
                    />
                    <div className="flex justify-between mt-3 px-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">SEM DOR</span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">DOR INSUPORTÁVEL</span>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
