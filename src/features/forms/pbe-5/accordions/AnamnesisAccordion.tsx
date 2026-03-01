"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel, FormField, FormItem, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Activity, Thermometer, Trash2, Search, Plus, ChevronsUpDown, Settings2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { AxiomCopilot } from "@/components/copilot/AxiomCopilot";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, AlertCircle, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const REGION_OPTIONS = [
    { id: "coluna_lombar", label: "Coluna Lombar" },
    { id: "coluna_cervical", label: "Coluna Cervical" },
    { id: "ombro", label: "Ombro" },
    { id: "joelho", label: "Joelho" },
    { id: "tornozelo_pe", label: "Tornozelo e Pé" },
    { id: "quadril", label: "Quadril" },
    { id: "cotovelo_mao", label: "Cotovelo/Punho/Mão" },
    { id: "atm", label: "ATM (Temporomandibular)" },
];

const SPECIALTY_OPTIONS = [
    { id: "ortopedia", label: "Ortopedia e Esportes" },
    { id: "neuropediatria", label: "Neuropediatria e Neurodesenvolvimento" },
    { id: "neurofuncional_adulto", label: "Neurofuncional Adulto" },
    { id: "saude_mulher", label: "Saúde da Mulher & Pélvica" },
    { id: "cardio_respiratorio", label: "Cardiovascular e Respiratório Ambulatorial" },
    { id: "saude_trabalho", label: "Saúde do Trabalho (Ergonomia / Pericial)" },
    { id: "gerontologia", label: "Gerontologia" },
];

const RED_FLAGS_DATA: Record<string, { id: string; label: string; alerts: string[] }[]> = {
    coluna_lombar: [
        {
            id: "cauda_equina",
            label: "SÍNDROME DA CAUDA EQUINA (CES)",
            alerts: [
                "Anestesia em sela (dormência perineal)",
                "Disfunção vesical de início súbito (retenção/incontinência)",
                "Distúrbios de esfíncter anal ou redução do tônus",
                "Fraqueza progressiva ou motora nos membros inferiores",
                "Déficit sensorial disseminado nos membros inferiores",
                "Anormalidade ou distúrbio de marcha",
                "Incontinência fecal",
                "Ciática ou dor irradiada em ambas as pernas"
            ]
        },
        {
            id: "lombar_malignancy",
            label: "SUSPEITA DE MALIGNIDADE",
            alerts: [
                "Histórico prévio de câncer (Red flag mais consensual)",
                "Perda de peso inexplicada ou não intencional",
                "Dor noturna (que aumenta ao deitar)",
                "Dor contínua ao repouso",
                "Dor em múltiplos locais",
                "Idade > 50 anos (especialmente se dor severa inédita)",
                "Falha na melhora após 4-6 semanas de tratamento",
                "Velocidade de hemossedimentação (VHS) elevada",
                "Malaise geral ou fadiga rápida",
                "Redução de apetite",
                "Paraparesia ou sintomas progressivos",
                "Febre"
            ]
        },
        {
            id: "lombar_fracture",
            label: "FRATURA VERTEBRAL",
            alerts: [
                "Trauma maior (acidente, queda de altura)",
                "Trauma menor em idosos (tossir, levantar peso leve)",
                "Uso prolongado de corticosteroides/imunossupressores",
                "Histórico de Osteoporose",
                "Idade avançada (Cut-off graduado: >50, >60 ou >70 anos)",
                "Gênero feminino (fraturas osteoporóticas)",
                "Início súbito de dor severa",
                "Dor ao carregar peso (loading pain)",
                "Deformidade estrutural ou aumento da cifose torácica",
                "Contusão ou abrasão local",
                "Baixo peso corporal"
            ]
        },
        {
            id: "lombar_infection",
            label: "INFECÇÃO ESPINAL",
            alerts: [
                "Febre (≥ 38°C) ou calafrios",
                "Uso de drogas intravenosas",
                "Uso de corticosteroides ou imunotransplantados",
                "Imunodeficiência, HIV ou AIDS",
                "Infecção urinária recente ou recorrente",
                "Cirurgia de coluna ou infiltração espinal recente",
                "Dor com recrudescência noturna ou em repouso",
                "Sensibilidade óssea sobre o processo espinhoso",
                "Ferida penetrante próxima à coluna"
            ]
        },
        {
            id: "espondiloartropatia",
            label: "ESPONDILOARTROPATIAS INFLAMATÓRIA",
            alerts: [
                "Idade de início < 20 ou < 45 anos",
                "Rigidez matinal > 30-60 min",
                "Melhora com exercício e sem alívio com repouso",
                "Dor que desperta o paciente à noite",
                "Histórico familiar de espondiloartrite",
                "Presença de uveíte, psoríase ou doença inflamatória intestinal"
            ]
        },
        {
            id: "outras_espinais",
            label: "OUTRAS PATOLOGIAS ESPINAIS",
            alerts: [
                "Aneurisma de aorta: Massa abdominal pulsante, idade > 60 anos, aterosclerose",
                "Mielopatia: Sinal de Babinski ou clônus sustentado, fraqueza do neurônio motor superior",
                "Espondilolistese severa: Desalinhamento palpável dos processos espinhosos (L4-L5)"
            ]
        }
    ],
    coluna_cervical: [
        {
            id: "ivb_cervical",
            label: "Insuficiência Vertebrobasilar (IVB)",
            alerts: ["Diplopia", "Dizziness", "Drop attacks", "Dysarthria", "Dysphagia", "Nausea", "Numbness", "Nystagmus"]
        },
        {
            id: "myelopathy_cervical",
            label: "Mielopatia Cervical",
            alerts: ["Alteração de marcha", "Fraqueza bilateral em mãos", "Sinal de Hoffman", "Sinal de Babinski/Clônus"]
        },
        {
            id: "upper_cervical_instability",
            label: "Instabilidade Cervical Alta",
            alerts: ["Sensação de cabeça pesada", "Nistagmo", "Parestesia global", "Sinal de Lhermitte"]
        },
        {
            id: "cervical_malignancy",
            label: "Suspeita de Malignidade",
            alerts: ["Histórico de Câncer", "Perda de peso inexplicada", "Dor constante que não cede ao repouso", "Idade > 50 anos"]
        },
        {
            id: "cervical_fracture",
            label: "Suspeita de Fratura",
            alerts: ["Trauma de alta energia", "Dor severa à palpação de processos espinhosos", "Deformidade visível", "Uso crônico de corticoide"]
        },
        {
            id: "cervical_infection",
            label: "Suspeita de Infecção",
            alerts: ["Febre / Calafrios", "Histórico de cirurgia recente", "Uso de drogas IV", "Malaise generalizado"]
        },
    ],
    ombro: [
        {
            id: "shoulder_infarction",
            label: "Dor Referida Visceral (Cardíaca)",
            alerts: ["Dor em ombro E associada a aperto no peito", "Dor desproporcional ao esforço", "Sudorese fria"]
        },
        {
            id: "shoulder_septic_arthritis",
            label: "Artrite Séptica",
            alerts: ["Calor", "Rubor intenso", "Febre", "Incapacidade total de mover"]
        },
    ],
    joelho: [
        {
            id: "knee_tvd",
            label: "Trombose Venosa Profunda (TVP)",
            alerts: ["Edema unilateral", "Calor", "Dor na panturrilha (Sinal de Homans)", "Pós-operatório recente"]
        },
        {
            id: "knee_fracture",
            label: "Suspeita de Fratura",
            alerts: ["Incapacidade imediata de suportar peso (dar 4 passos)", "Dor focal óssea em Patela ou Cabeça da Fíbula", "Trauma de alta energia ou queda direta no joelho", "Idade > 55 anos"]
        },
    ],
    quadril: [
        {
            id: "hip_necrosis",
            label: "Osteonecrose da Cabeça Femoral",
            alerts: ["Dor inguinal profunda", "Uso prolongado de corticoides", "Histórico de alcoolismo"]
        },
        {
            id: "hip_fracture",
            label: "Fratura de Colo Femoral",
            alerts: ["Encurtamento do membro", "Rotação externa fixa", "Incapacidade de apoiar peso"]
        },
        {
            id: "hip_septic_arthritis",
            label: "Artrite Séptica (Quadril)",
            alerts: ["Calor", "Rubor intenso", "Febre", "Incapacidade total de mover a articulação"]
        },
    ],
    atm: [
        {
            id: "atm_malignancy",
            label: "Sinais de Alerta (ATM / Cabeça e Pescoço)",
            alerts: [
                "Perda de peso inexplicada",
                "Dificuldade de deglutição (Disfagia)",
                "Alterações sensoriais súbitas na face",
                "Trismo severo (Bloqueio total da mandíbula)",
                "Histórico de câncer em região de cabeça e pescoço"
            ]
        },
    ],
    tornozelo_pe: [
        {
            id: "ankle_fracture",
            label: "SUSPEITA DE FRATURA",
            alerts: [
                "Incapacidade imediata de suportar peso (dar 4 passos)",
                "Dor focal óssea em Maléolo (Medial ou Lateral)",
                "Dor focal em Navicular ou Base do 5º Metatarso",
                "Trauma de alta energia ou queda de altura"
            ]
        },
        {
            id: "ankle_tvd",
            label: "TROMBOSE VENOSA PROFUNDA (TVP)",
            alerts: [
                "Edema unilateral na panturrilha/tornozelo",
                "Calor e rubor localizado",
                "Dor à palpação profunda da panturrilha",
                "Pós-operatório recente de membros inferiores"
            ]
        },
        {
            id: "charcot_foot",
            label: "NEUROARTROPATIA DE CHARCOT (PÉ DIABÉTICO)",
            alerts: [
                "Edema importante e indolor",
                "Aumento de temperatura local sem febre sistêmica",
                "Neuropatia periférica / Diabetes Mellitus instalada",
                "Deformidade plantar progressiva (pé em balanço)"
            ]
        }
    ],
    cotovelo_mao: [
        {
            id: "wrist_fracture",
            label: "FRATURA DE PUNHO / MÃO",
            alerts: [
                "Deformidade em 'garfo' (Sinal de Colles)",
                "Dor na tabaqueira anatômica (Escafoide)",
                "Edema e rubor severo pós-trauma",
                "Incapacidade funcional total de preensão"
            ]
        },
        {
            id: "hand_infection",
            label: "INFECÇÃO PROFUNDA / TENOSSINOVITE SÉPTICA",
            alerts: [
                "Sinais de Kanavel (Dedo em flexão, dor ao estender)",
                "Aumento de volume cilíndrico do dedo (fusiforme)",
                "Febre associada a ferimento penetrante",
                "Calor e rubor ascendente"
            ]
        }
    ]
};

interface AnamnesisAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

const QUESTION_BANK = [
    { text: "Há quanto tempo você sente essa dor?", keywords: ["tempo", "quanto tempo", "quando começou", "desde quando"] },
    { text: "Como essa dor começou?", keywords: ["mecanismo", "como começou", "início", "causa", "acidente"] },
    { text: "A dor irradia para algum outro lugar?", keywords: ["irradia", "irradiação", "para onde vai", "desce para", "sobe para"] },
    { text: "Como é a sensação dessa dor? (Ex: pontada, queimação, aperto)", keywords: ["sensação", "tipo de dor", "queimação", "pontada", "peso", "formigamento"] },
    { text: "O que faz a dor piorar?", keywords: ["piora", "movimento", "quando dói mais", "fator de piora"] },
    { text: "O que faz a dor melhorar?", keywords: ["melhora", "repouso", "remédio", "fator de alívio"] },
    { text: "A dor atrapalha o seu sono?", keywords: ["sono", "noite", "dormir", "acorda à noite"] },
    { text: "Já sentiu isso antes?", keywords: ["antes", "recorrente", "outra vez", "passado", "histórico"] },
    { text: "Você toma alguma medicação para isso?", keywords: ["remédio", "medicação", "anti-inflamatório", "analgésico"] },
];

export function AnamnesisAccordion({ openSection, isSectionFilled, sectionStyle }: AnamnesisAccordionProps) {
    const { register, watch, setValue, control } = useFormContext();
    const [openRegion, setOpenRegion] = React.useState(false);

    const qp = watch('anamnesis.qp') || "";
    const hma = watch('anamnesis.hma') || "";
    const evaValue = watch('anamnesis.eva') || 0;
    const selectedRegions = watch('anamnesis.mainRegions') || [];

    // [NEW] Dynamic AI Interview Placeholder Logic
    const hmaPlaceholder = React.useMemo(() => {
        if (!qp) return "Aguardando queixa principal para sugerir perguntas...";

        const fullText = (qp + " " + hma).toLowerCase();

        // Filter out questions already answered (based on keywords)
        const suggestions = QUESTION_BANK.filter((q: any) => {
            return !q.keywords.some((kw: string) => fullText.includes(kw.toLowerCase()));
        }).map((q: any) => q.text);

        if (suggestions.length === 0) return "HMA Completa. Continue detalhando conforme necessário.";

        // Special: If regions are selected but not mentioned in HMA detail
        const regionPrompt = selectedRegions.length > 0 && !hma.includes("região")
            ? `Como essa dor se comporta na região do ${REGION_OPTIONS.find(r => r.id === selectedRegions[0])?.label}? `
            : "";

        return `SUGESTÕES DE PERGUNTAS:\n${regionPrompt}${suggestions.slice(0, 4).map(s => `• ${s}`).join("\n")}`;
    }, [qp, hma, selectedRegions]);

    return (
        <AccordionItem
            value="anamnesis"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'anamnesis' ? 'bg-white ring-2 ring-blue-50' : 'bg-white/50',
                isSectionFilled('anamnesis') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'anamnesis' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600")}>
                        <Activity className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'anamnesis' ? "text-slate-900" : "text-slate-600")}>1. Anamnese e Queixa Principal</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Motivo da consulta e histórico atual</p>
                    </div>
                </div>
                {isSectionFilled('anamnesis') && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PREENCHIDO</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-10 border-t border-slate-50">
                <div className="flex flex-col gap-10 max-w-6xl mx-auto">

                    {/* Identification Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-blue-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Configurações da Avaliação</h4>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <Settings2 className="w-4 h-4 text-blue-500" />
                                    <FormLabel className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Área de Atuação Clínica</FormLabel>
                                </div>
                                <Controller
                                    name="clinical.specialty"
                                    control={control}
                                    defaultValue="ortopedia"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white font-bold text-sm shadow-sm">
                                                <SelectValue placeholder="Selecione a área clínica..." />
                                            </SelectTrigger>
                                            <SelectContent className="z-[500]">
                                                {SPECIALTY_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id} className="font-bold py-3">
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-1">Otimiza os campos e escalas baseado na especialidade selecionada.</p>
                            </div>

                            <div className="flex flex-col justify-center space-y-3">
                                <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 transition-all group">
                                    <Controller
                                        name="clinical.advancedPhysical"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="advanced-physical"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="h-6 w-6 border-slate-300 data-[state=checked]:bg-blue-600 rounded-lg"
                                            />
                                        )}
                                    />
                                    <div className="space-y-0.5 cursor-pointer" onClick={() => setValue('clinical.advancedPhysical', !watch('clinical.advancedPhysical'))}>
                                        <label htmlFor="advanced-physical" className="text-[11px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">Avaliação Física Avançada</label>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Habilita exames sistêmicos e biofotogrametria.</p>
                                    </div>
                                    <ShieldCheck className="w-5 h-5 text-blue-500 ml-auto opacity-30 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <div className="w-1 h-5 bg-blue-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">A queixa do paciente</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-tighter ml-1">Queixa Principal (QP)</FormLabel>
                                <Textarea
                                    {...register('anamnesis.qp')}
                                    placeholder="O que trouxe você aqui hoje? Descreva o sintoma principal..."
                                    className="min-h-[100px] rounded-2xl border-slate-200 focus:ring-blue-500 bg-white text-base font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-tighter ml-1">Tempo de Evolução</FormLabel>
                                    <Input
                                        {...register('anamnesis.painDuration')}
                                        placeholder="Ex: 3 meses, 2 semanas..."
                                        className="h-12 rounded-xl border-slate-200 bg-white font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end mb-2 px-1">
                                        <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Dor Atual (EVA)</FormLabel>
                                        <span className={cn(
                                            "text-xl font-black transition-colors",
                                            evaValue >= 8 ? "text-red-600" : evaValue >= 4 ? "text-orange-500" : "text-emerald-600"
                                        )}>{evaValue}/10</span>
                                    </div>
                                    <div className="px-3 h-12 flex items-center bg-slate-50/50 border border-slate-200 rounded-xl">
                                        <Slider
                                            max={10}
                                            step={1}
                                            value={[evaValue]}
                                            onValueChange={(v) => setValue('anamnesis.eva', v[0])}
                                            className="accent-blue-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-tighter ml-1">HMA (História da Moléstia Atual)</FormLabel>
                                <Textarea
                                    {...register('anamnesis.hma')}
                                    placeholder={hmaPlaceholder}
                                    className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-blue-500 bg-white text-base font-medium"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Regions Section */}
                    <div className={cn("p-8 rounded-[2rem] border transition-all", sectionStyle.bg, openSection === 'anamnesis' ? "border-blue-100 shadow-inner" : "border-transparent")}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-5 bg-blue-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mapeamento das Regiões</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Regiões Ativas ({selectedRegions.length})</div>
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {selectedRegions.length > 0 ? (
                                        selectedRegions.map((region: string) => (
                                            <Badge key={region} className="bg-blue-600 hover:bg-blue-700 text-white pl-4 pr-1 py-1.5 rounded-xl flex items-center gap-2 shadow-sm transition-all animate-in zoom-in-90">
                                                <span className="text-xs font-bold uppercase tracking-tight">{REGION_OPTIONS.find(r => r.id === region)?.label || region}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 hover:bg-blue-800 text-white/70 rounded-lg transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setValue('anamnesis.mainRegions', selectedRegions.filter((r: string) => r !== region));
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-xs font-bold text-slate-300 italic py-2">Nenhuma região selecionada...</p>
                                    )}
                                </div>
                            </div>

                            <Popover open={openRegion} onOpenChange={setOpenRegion}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between h-14 bg-white border-slate-200 rounded-xl shadow-sm hover:border-blue-300 hover:bg-blue-50/10 text-slate-700 font-bold transition-all">
                                        <div className="flex items-center gap-2">
                                            <Search className="h-4 w-4 text-blue-500" />
                                            {selectedRegions.length === 0 ? "Adicionar Região..." : `${selectedRegions.length} Regiões Selecionadas`}
                                        </div>
                                        <ChevronsUpDown className="h-4 w-4 opacity-30" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0 rounded-2xl overflow-hidden shadow-2xl border-slate-200" align="start">
                                    <Command className="border-none">
                                        <CommandInput placeholder="Buscar região articular..." className="h-12 border-none ring-0 focus:ring-0" />
                                        <CommandList className="max-h-[400px] p-2 bg-white">
                                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                                                Articulações & Segmentos
                                            </div>
                                            <CommandEmpty className="p-4 text-center text-slate-400 text-xs font-medium italic">Nenhuma região encontrada.</CommandEmpty>
                                            <CommandGroup>
                                                {REGION_OPTIONS.map(opt => {
                                                    const isSelected = selectedRegions.includes(opt.id);
                                                    return (
                                                        <div
                                                            key={opt.id}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 group",
                                                                isSelected ? "bg-blue-50 text-blue-700 shadow-sm" : "hover:bg-slate-50 text-slate-600"
                                                            )}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (isSelected) {
                                                                    setValue('anamnesis.mainRegions', selectedRegions.filter((id: string) => id !== opt.id));
                                                                } else {
                                                                    setValue('anamnesis.mainRegions', [...selectedRegions, opt.id]);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    className={cn(
                                                                        "h-5 w-5 rounded-md border-2 transition-all",
                                                                        isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 group-hover:border-blue-300"
                                                                    )}
                                                                />
                                                                <span className="text-sm font-black uppercase tracking-tight">{opt.label}</span>
                                                            </div>
                                                            {isSelected && <Plus className="h-3 w-3 text-blue-500 opacity-50" />}
                                                        </div>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            <p className="text-[10px] leading-relaxed text-slate-400 font-medium px-1">
                                <span className="text-blue-500 font-extrabold mr-1">DICA:</span>
                                A seleção da região ativa habilita automaticamente os protocolos de testes específicos do PBE na Etapa 6.
                            </p>
                        </div>
                    </div>

                    {/* SEÇÃO 3: Red Flags (MIGRADO & EXPANDIDO) */}
                    {selectedRegions.length > 0 && (
                        <div className="bg-rose-50/20 p-8 rounded-[3rem] border border-rose-100 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-rose-600 animate-pulse" />
                                <div>
                                    <h4 className="font-black text-rose-900 uppercase text-[10px] tracking-widest leading-none mb-1">Trigger de Alerta: Red Flags</h4>
                                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Sinais e Sintomas de Alerta para Patologias Graves</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedRegions.map((regionId: string) => {
                                    const flags = RED_FLAGS_DATA[regionId] || [];
                                    return flags.map((flag) => {
                                        const isMainActive = watch(`clinical.redFlags.${flag.id}`);

                                        return (
                                            <div
                                                key={flag.id}
                                                className={cn(
                                                    "p-6 rounded-[2.5rem] border transition-all duration-300 space-y-5 group relative overflow-hidden",
                                                    isMainActive
                                                        ? "bg-rose-50/40 border-rose-300 shadow-md ring-1 ring-rose-500/10"
                                                        : "bg-white border-rose-100 shadow-sm opacity-80"
                                                )}
                                            >
                                                <div className="flex items-center justify-between border-b border-rose-100/50 pb-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn(
                                                            "p-1.5 rounded-lg transition-colors",
                                                            isMainActive ? "bg-rose-600 text-white shadow-sm" : "bg-rose-50 text-rose-400"
                                                        )}>
                                                            <AlertCircle className="h-4 w-4" />
                                                        </div>
                                                        <h5 className={cn(
                                                            "font-black text-[11px] uppercase tracking-widest leading-none pt-1 transition-colors",
                                                            isMainActive ? "text-rose-900" : "text-slate-600"
                                                        )}>
                                                            {flag.label}
                                                        </h5>
                                                    </div>
                                                    <Controller
                                                        name={`clinical.redFlags.${flag.id}`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={(checked) => {
                                                                    field.onChange(checked);
                                                                    // Se desligar manualmente, apaga os subtópicos para manter coerência
                                                                    if (!checked) {
                                                                        setValue(`clinical.redFlagsItems.${flag.id}`, {});
                                                                    }
                                                                }}
                                                                className="data-[state=checked]:bg-rose-600 scale-90"
                                                            />
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-1.5 px-1">
                                                    {flag.alerts.map((alert, idx) => {
                                                        const fieldName = `clinical.redFlagsItems.${flag.id}.${idx}`;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={cn(
                                                                    "flex items-start gap-3 p-2 rounded-xl transition-all cursor-pointer select-none group/item",
                                                                    watch(fieldName)
                                                                        ? "bg-rose-100/40 translate-x-1"
                                                                        : "hover:bg-slate-50"
                                                                )}
                                                                onClick={() => {
                                                                    const currentVal = watch(fieldName);
                                                                    setValue(fieldName, !currentVal);

                                                                    // Lógica de auto-toggle
                                                                    if (!currentVal) {
                                                                        // Se marcou algum, liga a categoria
                                                                        setValue(`clinical.redFlags.${flag.id}`, true);
                                                                    } else {
                                                                        // Se desmarcou, verifica se sobrou algum
                                                                        const allSubItems = watch(`clinical.redFlagsItems.${flag.id}`) || {};
                                                                        const anyRemaining = Object.entries(allSubItems).some(([key, val]) =>
                                                                            key !== idx.toString() && val === true
                                                                        );
                                                                        if (!anyRemaining) {
                                                                            setValue(`clinical.redFlags.${flag.id}`, false);
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <Controller
                                                                    name={fieldName}
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Checkbox
                                                                            checked={field.value}
                                                                            onCheckedChange={() => { }} // Controlado pelo div onClick
                                                                            className={cn(
                                                                                "mt-1 border-rose-200 transition-all",
                                                                                field.value ? "bg-rose-600 border-rose-600 scale-110" : ""
                                                                            )}
                                                                        />
                                                                    )}
                                                                />
                                                                <span className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-tight leading-snug transition-colors",
                                                                    watch(fieldName) ? "text-rose-900" : "text-slate-400"
                                                                )}>
                                                                    {alert}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    });
                                })}
                            </div>

                            {/* Alertas Clínicos de Diagnóstico */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 flex gap-4 transition-all hover:bg-amber-50 group">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
                                    <div className="space-y-1.5">
                                        <h6 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Atenção a Falsos Positivos</h6>
                                        <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase tracking-tighter">
                                            Até 80% dos pacientes na atenção primária podem apresentar pelo menos uma Red Flag, mesmo sem patologia séria. Evite exames desnecessários sem combinação de sinais claros.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex gap-4 transition-all hover:bg-indigo-50 group">
                                    <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-1" />
                                    <div className="space-y-1.5">
                                        <h6 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Cluster de Sinais (Combinação)</h6>
                                        <p className="text-[9px] font-bold text-indigo-700 leading-relaxed uppercase tracking-tighter">
                                            O diagnóstico é mais preciso quando os sinais são combinados (ex: Presença de 3 fatores para Fratura, como Idade {'>'} 70 + Gênero Feminino + Trauma, aumenta probabilidade para 90%).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
