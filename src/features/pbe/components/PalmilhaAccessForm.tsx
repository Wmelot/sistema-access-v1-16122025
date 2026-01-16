// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Form, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    Plus, Trash2, Send, Eye, Loader2, Mic, Search, Info,
    CheckCircle2, Flame, Footprints, ChevronDown, Menu, AlertTriangle,
    ChevronsUpDown, Check, MessageCircle, Stethoscope, Target, Activity,
    Zap, Ruler, User, Bed, Scan, Video, FileText, ClipboardList, TrendingDown,
    ShieldCheckIcon,
    OctagonPause,
    TimerReset,
    ArrowBigUp,
    ArrowBigDown,
    Camera,
    Gauge,
    Pill,
    PillBottle,
    PencilRuler,
    Volume2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip as RechartsTooltip, Legend, CartesianGrid
} from 'recharts';

import { COLOR_LEFT_FOOT, COLOR_RIGHT_FOOT, COLOR_REF_LINE } from "@/utils/report-constants";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

// COMPONENTES FILHOS
import { BiomechanicsSidebar } from "./biomechanics-sidebar";
import { PhysicalAssessmentForm } from "@/components/assessments/physical-assessment-form";
import { SmartAssessmentForm } from "@/components/assessments/smart-assessment-form";
import WomensHealthForm from "@/features/womens-health/components/WomensHealthForm";
import { BodyPainMap } from "@/features/biomechanics/components/body-pain-map";
import { PasteUploadZone } from "@/components/ui/paste-upload-zone";
import { BipolarSlider } from "@/components/ui/bipolar-slider";
import { AudioTextarea } from "./audio-textarea";
import { PropulsaoAccordionItem } from "./PropulsaoAccordionItem";
import { BiomechanicsReport } from "./biomechanics-report";
import { CLINICAL_REFS, checkStatus, checkNavicularStatus, calculateMinimalistIndex, calculateFlexibilityScore, calculateRadarData } from "@/utils/clinical-references";
import { MEDICATIONS_DB, MED_DESCRIPTIONS } from "@/utils/medication-db";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info as InfoIcon } from "lucide-react";
import { getOrganizationSettings } from "@/app/dashboard/settings/organization/actions";
import { QuestionnaireSender } from "./QuestionnaireSender";

const QUESTIONNAIRES = [
    "LEFS (Lower Extremity Functional Scale)",
    "HHS (Harris Hip Score)",
    "HOOS (Hip Dysfunction and Osteoarthritis Outcome Score)",
    "IHOT-33 (International Hip Outcome Tool)",
    "KOOS (Knee Injury and Osteoarthritis Outcome Score)",
    "IKDC (International Knee Documentation Committee)",
    "Lysholm Knee Score",
    "VISA-P (Victorian Institute of Sport Assessment - Patella)",
    "Kujala Score (Anterior Knee Pain)",
    "FAAM (Foot and Ankle Ability Measure)",
    "FADI (Foot and Ankle Disability Index)",
    "VISA-A (Victorian Institute of Sport Assessment - Achilles)",
    "AOFAS (American Orthopaedic Foot & Ankle Society)"
];

const EXERCISES_DB = [
    "Fortalecimento de Glúteo Médio (Drop Pélvico)",
    "Fortalecimento de Glúteo Médio (Ostra)",
    "Fortalecimento Excêntrico de Tríceps Sural",
    "Fortalecimento de Glúteo Máximo",
    "Controlo de CORE e Respiração Diagmática",
    "Ponte Unilateral / Ponte Lateral",
    "Fortalecimento de Quadríceps (CCF/CCA)",
    "Excêntrico de Isquiosurais em Longitude",
    "Mobilidade de Quadril",
    "Mobilidade de Tornozelo / Flexão Dorsal"
];


// Componente de Status de Referência com Lógica Cinza (Vazio)
const KCAL_TABLE: Record<string, number> = { "Arremesso de Peso/Disco": 300, "Balé": 450, "Basquete": 650, "Beach Tênis": 550, "Bicicleta Ergométrica (Intensa)": 600, "Bike (Ciclismo de Estrada)": 500, "Boxe (Treino)": 800, "Caminhada (5 km/h)": 300, "Caminhada em Trilha (Hiking)": 450, "Capoeira": 650, "Corrida (10 km/h)": 900, "Crossfit": 700, "Dança de Salão": 350, "Danças Urbanas/Hip Hop": 500, "Escalada": 600, "Esgrima": 450, "Frescobol": 400, "Futebol": 800, "Futsal": 750, "Futevôlei": 600, "Ginástica Artística": 400, "Ginástica Laboral": 150, "Ginástica Olímpica": 500, "Golfe": 250, "Handebol": 700, "Hidroginástica": 400, "Jiu-Jitsu": 750, "Judô": 700, "Karatê": 650, "Kickboxing": 850, "Krav Maga": 700, "Musculação": 350, "Muay Thai": 800, "Natação (Crawl moderado)": 600, "Natação (Borboleta/Intenso)": 850, "Padel": 550, "Patinação": 500, "Pilates": 300, "Pular Corda (Rápido)": 950, "Remo": 600, "Rugby": 800, "Skate": 400, "Spinning": 700, "Squash": 900, "Surf": 350, "Tênis": 500, "Tênis de Mesa": 300, "Treino Funcional": 550, "Triatlo": 900, "Vôlei de Praia": 600, "Vôlei de Quadra": 400, "Yoga": 250, "Zumba": 550 };
const ReferenceStatus = ({ value, type }: { value: any, type: string }) => {
    const v = Number(value);
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">Sem Dados</div>;

    // Lógica Centralizada (Brain)
    const status = checkStatus(type as any, v);

    // Fallback se não encontrar
    if (!status) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">N/A</div>;

    return <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase transition-all duration-300", status.color)}>{status.label}</div>;
};

// Componente de Escala de Calçados (Dropdown)
// Componente de Escala de Calçados (Bolinhas)
const ShoeScale = ({ label, value, onChange, options }: { label: string, value: any, onChange: (val: string) => void, options: { val: string, label: string }[] }) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
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

const ComboboxSelector = ({ value, onChange, database, placeholder = "Buscar..." }: { value: string, onChange: (v: string) => void, database: string[], placeholder?: string }) => {
    const [open, setOpen] = useState(false);


    return (

        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full h-9 justify-between bg-white text-left font-normal text-slate-700 px-3">
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Digite para buscar..." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-xs text-slate-500 text-center">Para adicionar novo, digite abaixo 👇</div>
                        </CommandEmpty>
                        <CommandGroup heading="Sugestões Populares" className="max-h-[200px] overflow-auto">
                            {database.map((item) => (
                                <CommandItem
                                    key={item}
                                    value={item}
                                    onSelect={(currentValue) => {
                                        onChange(item)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item ? "opacity-100" : "opacity-0")} />
                                    {item}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                <div className="p-2 border-t bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Não encontrou? Digite aqui:</div>
                    <Input
                        className="h-8 bg-white border-slate-200 text-xs shadow-none"
                        placeholder="Nome personalizado..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onChange(e.currentTarget.value);
                                setOpen(false);
                            }
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>

    )
};

const MedicationCombobox = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={MEDICATIONS_DB} placeholder="Buscar medicamento..." />;
};

const ExerciseCombobox = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={EXERCISES_DB} placeholder="Buscar exercício..." />;
};

// Ordem das Seções para Navegação via Tab
const SECTION_ORDER = [
    'hma', 'history', 'map', 'efep', 'sports', 'shoe',
    'static', 'fpi_detail', 'orto', 'dorsal', 'ventral', 'dynamic', 'exams', 'exercises'
];

// Hook de Navegação Inteligente entre Accordions
const useAccordionNavigation = (
    openSection: string,
    setOpenSection: (s: string) => void,
    formId: string
) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const activeEl = document.activeElement;
            if (!activeEl) return;

            // Busca o AccordionItem atual baseando-se no elemento focado
            const currentItem = activeEl.closest('[data-value]');
            if (!currentItem) return;

            const currentSectionValue = currentItem.getAttribute('data-value');
            if (!currentSectionValue) return;

            // LISTA DE ELEMENTOS FOCÁVEIS (ATUALIZADA)
            const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), div[contenteditable="true"]';

            const focusable = Array.from(currentItem.querySelectorAll(focusableSelector))
                .filter(el => {
                    // Filtra elementos invisíveis ou dentro de containers ocultos
                    const isVisible = (el as HTMLElement).offsetParent !== null;
                    // Filtra o input de arquivo "escondido" (opacity-0) se tivermos o contentEditable por cima
                    if (el.tagName === 'INPUT' && (el as HTMLElement).classList.contains('opacity-0')) return false;
                    return isVisible;
                });

            if (focusable.length === 0) return;

            const firstEl = focusable[0] as HTMLElement;
            const lastEl = focusable[focusable.length - 1] as HTMLElement;
            const currentIndex = SECTION_ORDER.indexOf(currentSectionValue);

            if (currentIndex === -1) return;

            // --- DETECTA SE O FOCO ESTÁ EM UM "CAMPO FANTASMA" (Ex: Upload Zone) ---
            // Se o elemento ativo for o contentEditable, tratamos ele como foco válido.

            // --- SHIFT + TAB: VOLTAR SEÇÃO ---
            if (e.shiftKey) {
                if (activeEl === firstEl && currentIndex > 0) {
                    e.preventDefault();
                    const prevSection = SECTION_ORDER[currentIndex - 1];
                    setOpenSection(prevSection);
                    setTimeout(() => {
                        const formContainer = document.getElementById(formId);
                        const prevContainer = formContainer?.querySelector(`[data-value="${prevSection}"]`);
                        const prevFocusable = prevContainer?.querySelectorAll(focusableSelector);
                        // Foka no ÚLTIMO elemento da seção anterior
                        if (prevFocusable && prevFocusable.length > 0) {
                            (prevFocusable[prevFocusable.length - 1] as HTMLElement).focus();
                        }
                    }, 300);
                }
            }
            // --- TAB: AVANÇAR SEÇÃO ---
            else {
                // Se estamos no último elemento OU se estamos num contentEditable que é o último
                if (activeEl === lastEl && currentIndex < SECTION_ORDER.length - 1) {
                    e.preventDefault();
                    const nextSection = SECTION_ORDER[currentIndex + 1];
                    setOpenSection(nextSection);
                    setTimeout(() => {
                        const formContainer = document.getElementById(formId);
                        const nextContainer = formContainer?.querySelector(`[data-value="${nextSection}"]`);
                        const nextFocusable = nextContainer?.querySelectorAll(focusableSelector);
                        // Foca no PRIMEIRO elemento da próxima seção
                        if (nextFocusable && nextFocusable.length > 0) {
                            (nextFocusable[0] as HTMLElement).focus();
                        }
                    }, 300);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openSection, setOpenSection, formId]);
};

export default function PalmilhaAccessForm({ patientId, initialData, onSave, patient }: { patientId: string, initialData?: any, onSave?: (data: any) => void, patient?: any }) {
    const [activeForm, setActiveForm] = useState("palmilha");

    // Auto-Save
    const debouncedSave = useDebouncedCallback((data) => {
        if (onSave) {
            onSave(data);
        }
    }, 1500);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [openSection, setOpenSection] = useState("hma");
    const [orgSettings, setOrgSettings] = useState<any>(null);

    useEffect(() => {
        getOrganizationSettings().then(data => {
            if (data?.org) setOrgSettings(data.org)
        })
    }, []);

    // Ativa a Navegação Inteligente
    useAccordionNavigation(openSection, setOpenSection, "palmilha-form-container");

    const defaults = {
        hma: { qp: "", history: "", eva: [0] },
        history: { comorbidities: [], meds: [], treatments: [] },
        anthropometry: { weight: "" },
        sports: [],
        efep: [{ activity: "", score: "" }],
        postural: { navicular: { left: "", right: "" }, shoeSize: "", fpi_left: {}, fpi_right: {} },
        tests: {
            jack: { left: 0, right: 0 }, lunge: { left: "", right: "" },
            thomas: { left: "", right: "" }, slr: { left: "", right: "" },
            glute_strength: { med_left: 5, med_right: 5, max_left: 5, max_right: 5 },
            ventral: { rotation: { left: "", right: "" }, craig: { left: "", right: "" } },
            ybalance: { legLength: { left: "", right: "" } }
        },
        shoe: { injuryType: "none", weight: "", drop: "", stack: "" },
        plan: { orientations: "", exercises: [] }
    };

    const form = useForm({
        mode: "onChange",
        defaultValues: initialData ? { ...defaults, ...initialData } : defaults
    });

    // Auto-Save Watcher
    useEffect(() => {
        const subscription = form.watch((value) => {
            debouncedSave(value);
        });
        return () => subscription.unsubscribe();
    }, [form.watch, debouncedSave]);

    const { fields: efepFields, append: appendEfep, remove: removeEfep } = useFieldArray({ control: form.control, name: "efep" });
    const { fields: painFields, append: appendPain, remove: removePain, update: updatePain } = useFieldArray({ control: form.control, name: "painPoints" });
    const { fields: sportFields, append: appendSport, remove: removeSport } = useFieldArray({ control: form.control, name: "sports" });
    const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({ control: form.control, name: "history.meds" });
    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({ control: form.control, name: "plan.exercises" });

    const weightVal = useWatch({ control: form.control, name: "anthropometry.weight" });
    const sportsVal = useWatch({ control: form.control, name: "sports" });
    // 1. Gasto Calórico (Restaurado com Precisão)
    const calData = useMemo(() => {
        const weight = Number(weightVal) || 70;
        const sports = sportsVal || [];

        let weeklyBurn = 0, totalMinutes = 0;
        sports.forEach((s: any) => {
            const met = KCAL_TABLE[s?.type] || 300;
            const hourlyBurnAdjusted = (met / 70) * weight;
            weeklyBurn += hourlyBurnAdjusted * (Number(s?.duration) / 60) * Number(s?.freq);
            totalMinutes += Number(s?.freq) * Number(s?.duration);
        });

        let level = "Sedentário", color = "bg-slate-500", riskText = "Alto Risco";
        if (totalMinutes >= 150) { level = "Ativo"; color = "bg-green-500"; riskText = "Baixo Risco"; }
        if (totalMinutes >= 300) { level = "Muito Ativo"; color = "bg-purple-600"; riskText = "Risco Mínimo"; }

        return { weekly: Math.round(weeklyBurn), minutes: totalMinutes, level, color, riskText };
    }, [weightVal, sportsVal]);

    // 2. Lógica FPI-6 (Ref: PDF p.2)
    const fpiLeftVals = useWatch({ control: form.control, name: "postural.fpi_left" });
    const fpiRightVals = useWatch({ control: form.control, name: "postural.fpi_right" });
    const fpiData = useMemo(() => {
        const sum = (v: any) => v ? Object.values(v).reduce((acc: number, c: any) => acc + (Number(c) || 0), 0) : 0;
        const getC = (s: number) => {
            if (s >= 6) return { l: "Plano", c: "bg-red-500", desc: "Queda do arco medial, aumentando o estresse em estruturas internas." };
            if (s <= -6) return { l: "Cavo", c: "bg-orange-500", desc: "Arco elevado, gerando picos de pressão no calcanhar e metatarsos." };
            return { l: "Neutro", c: "bg-green-500", desc: "Alinhamento fisiológico com excelente distribuição de carga." };
        };
        return { left: { s: sum(fpiLeftVals), ...getC(sum(fpiLeftVals)) }, right: { s: sum(fpiRightVals), ...getC(sum(fpiRightVals)) } };
    }, [fpiLeftVals, fpiRightVals]);

    // 3. Matemática do Radar - Conversão para 0-100 (Calculado no Brain)
    const radarData = useMemo(() => {
        // Envia o objeto inteiro do form para o Brain processar
        const allValues = form.getValues();
        // Nota: O watch é necessário para atualizar em tempo real, então usamos as dependências abaixo
        return calculateRadarData(allValues);
    }, [form.watch()]);

    const shoeVals = useWatch({ control: form.control, name: "shoe" });
    // 3. Recomendação de Calçados (Baseada no PDF "Selecting the Right Running Shoes")
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

    // 4. Índice Minimalista (Calculado no Brain)
    const minIndexResult = useMemo(() => {
        if (!shoeVals) return 0;
        return calculateMinimalistIndex(shoeVals);
    }, [shoeVals]);
    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">

            {/* --- CABEÇALHO --- */}
            <div className="w-full space-y-2">
                <div className="bg-white p-3 border rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Menu className="w-5 h-5" /></div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Formulário Atual</span>
                            <Select value={activeForm} onValueChange={setActiveForm}>
                                <SelectTrigger className="border-none shadow-none p-0 h-auto font-bold text-lg text-slate-800 focus:ring-0">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="palmilha">Palmilha Biomecânica 2.0</SelectItem>
                                    <SelectItem value="avancada">Avaliação Física Avançada</SelectItem>
                                    <SelectItem value="clinica">Avaliação Clínica Inteligente</SelectItem>
                                    <SelectItem value="mulher">Saúde da Mulher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => setPreviewOpen(true)}
                        >
                            <Eye className="w-4 h-4" />
                            Prévia do Relatório
                        </Button>

                        <Badge variant="outline" className="gap-2 px-3 py-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-xs font-medium text-slate-600">Salvamento Automático</span>
                        </Badge>
                    </div>
                </div>

                {/* Sandbox Alert Removed */}
            </div>

            {activeForm === 'palmilha' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6" id="palmilha-form-container">
                        <Form {...form}>
                            <form className="space-y-6">
                                <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* 1. ANAMNESE */}
                                    <AccordionItem value="hma" data-value="hma" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'hma' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#59cbbb' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Volume2 className="h-5 w-5 text-blue-600" />
                                            Anamnese & Queixa Principal
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="space-y-2">
                                                <FormLabel>Queixa Principal (QP)</FormLabel>
                                                <Input {...form.register('hma.qp')} className="bg-white" placeholder="Motivo principal do comparecimento a clínica..." />
                                            </div>
                                            <div className="space-y-2">
                                                <FormLabel>História da Moléstia Atual (HMA)</FormLabel>
                                                <AudioTextarea
                                                    value={form.watch('hma.history')}
                                                    onChange={(e) => form.setValue('hma.history', e.target.value)}
                                                    onTranscription={(text) => form.setValue('hma.history', text)}
                                                    placeholder="Registre o histórico completo dos sintomas e mecanismos de lesão do paciente..."
                                                />
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex justify-between mb-4">
                                                    <FormLabel>Intensidade da Dor (EVA)</FormLabel>
                                                    <span className="text-2xl font-bold text-blue-600">{form.watch('hma.eva')}/10</span>
                                                </div>
                                                <Slider max={10} step={1} value={form.watch('hma.eva')} onValueChange={(v) => form.setValue('hma.eva', v)} />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    {/* 3. HISTÓRICO CLÍNICO */}
                                    <AccordionItem value="history" data-value="history" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'history' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#59cbbb' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Stethoscope className="h-5 w-5 text-green-600" />
                                            Histórico Clínico
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="space-y-3">
                                                <FormLabel>Comorbilidades</FormLabel>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {['Cardiopatia', 'Diabetes', 'D. Metabólicas', 'D. Reumáticas', 'D. Tiroideanas', 'D. Vasculares', 'Dislipidemia', 'Etilismo', 'HAS', 'Obesidade', 'Osteoporose', 'Tabagismo'].map(c => (
                                                        <div key={c} className="flex items-center gap-2">
                                                            <Checkbox onCheckedChange={(checked) => {
                                                                const current = form.getValues("history.comorbidities") || [];
                                                                form.setValue("history.comorbidities", checked ? [...current, c] : current.filter((i: string) => i !== c));
                                                            }} />
                                                            <label className="text-sm">{c}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <FormLabel>Medicação em Uso</FormLabel>
                                                <div className="space-y-3">
                                                    {medFields.map((field, index) => {
                                                        const medName = form.watch(`history.meds.${index}.name` as any);
                                                        const description = MED_DESCRIPTIONS[medName];

                                                        return (
                                                            <div key={field.id} className="animate-in slide-in-from-left-2 duration-300 border-b border-dashed pb-3 last:border-0 last:pb-0">
                                                                <div className="flex gap-3 items-end">
                                                                    <div className="flex-1 space-y-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nome do Medicamento</span>
                                                                        <MedicationCombobox
                                                                            value={medName}
                                                                            onChange={(val) => form.setValue(`history.meds.${index}.name` as any, val)}
                                                                        />
                                                                    </div>
                                                                    <div className="w-24 space-y-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Dosagem</span>
                                                                        <Input {...form.register(`history.meds.${index}.dose` as any)} className="bg-white h-9" placeholder="miligramas" />
                                                                    </div>
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMed(index)} className="focusable-element h-9 w-9 text-slate-400 hover:text-red-500 mb-0.5">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>

                                                                {/* Bloco de Informação Farmacológica (Full Width abaixo) */}
                                                                {description && (
                                                                    <Alert className="bg-blue-50 border-blue-100 py-2 mt-2">
                                                                        <InfoIcon className="h-4 w-4 text-blue-600" />
                                                                        <AlertTitle className="text-xs font-bold text-blue-800 mb-0.5">Informação Farmacológica</AlertTitle>
                                                                        <AlertDescription className="text-[10px] text-blue-700 leading-tight">
                                                                            {description}
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <Button type="button" variant="outline" size="sm" onClick={() => appendMed({ name: "", dose: "" })} className="focusable-element w-full border-dashed h-10 hover:bg-slate-50 text-slate-500 font-bold text-xs">
                                                        <Plus className="w-3.5 h-3.5 mr-2" /> ADICIONAR MEDICAÇÃO
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 5. MAPA DA DOR */}
                                    <AccordionItem value="map" data-value="map" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'map' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#59cbbb' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Target className="h-5 w-5 text-red-500" />
                                            Localização da Dor
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">
                                            <div className="bg-slate-50/50 p-4 rounded-b-xl border-t">
                                                <BodyPainMap
                                                    points={painFields}
                                                    onAdd={appendPain}
                                                    onRemove={removePain}
                                                    onUpdate={updatePain}
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    {/* 6. FUNCIONALIDADE (EFEP/PSFS) */}
                                    <AccordionItem value="efep" data-value="efep" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'efep' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#59cbbb' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <PencilRuler className="h-5 w-5 text-orange-500" />
                                            Funcionalidade (EFEP)
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-4">
                                                <p className="text-[11px] text-blue-700 leading-tight">
                                                    <strong>Instrução:</strong> Selecione até 3 atividades cujo desempenho esteja comprometido.
                                                    (0 = Incapaz de realizar | 10 = Realiza sem dificuldades).
                                                </p>
                                            </div>

                                            {/* ENVIAR QUESTIONÁRIO - Feature Restaurada */}
                                            <div className="flex gap-2 items-end bg-green-50 p-3 rounded border border-green-100 mb-4">
                                                <div className="flex-1">
                                                    <FormLabel className="text-green-800 font-bold text-xs uppercase">Enviar Questionário (WhatsApp)</FormLabel>
                                                    <Select onValueChange={(v) => form.setValue("questionnaire.selected", v)}>
                                                        <SelectTrigger className="bg-white border-green-200 text-green-700 h-9">
                                                            <SelectValue placeholder="Selecione o questionário..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {QUESTIONNAIRES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <QuestionnaireSender
                                                    patientId={patientId}
                                                    questionnaireName={form.watch("questionnaire.selected")}
                                                />
                                            </div>

                                            {efepFields.map((f, i) => (
                                                <div key={f.id} className="flex gap-3 items-center mb-3 animate-in slide-in-from-left-2 duration-300">
                                                    <span className="text-xs font-black text-slate-400 w-5">{i + 1}º</span>
                                                    <Input {...form.register(`efep.${i}.activity`)} placeholder="Ex: Agachar, Correr 5km..." className="flex-1 bg-white h-10" />
                                                    <div className="w-24">
                                                        <Input type="number" {...form.register(`efep.${i}.score`)} placeholder="Nota" className="text-center font-black h-10 border-blue-200" min={0} max={10} />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEfep(i)} className="focusable-element text-slate-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}

                                            {efepFields.length < 3 && (
                                                <Button type="button" variant="outline" size="sm" onClick={() => appendEfep({ activity: "", score: "" })} className="focusable-element w-full border-dashed h-12 hover:bg-blue-50 text-blue-600 font-bold">
                                                    <Plus className="w-4 h-4 mr-2" /> ADICIONAR ATIVIDADE FUNCIONAL
                                                </Button>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 4. ROTINA DESPORTIVA (Lógica IPAQ) */}
                                    <AccordionItem value="sports" data-value="sports" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'sports' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#59cbbb' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Zap className="h-5 w-5 text-yellow-500" />
                                            Rotina Desportiva
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                                                <div className="space-y-1">
                                                    <FormLabel className="text-[10px] uppercase font-black text-green-600">Peso Corporal (kg)</FormLabel>
                                                    <Input type="number" {...form.register("anthropometry.weight")} className="bg-white w-24 font-bold h-10 text-lg" placeholder="70" />
                                                </div>
                                                <div className="flex-1 text-right">
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Estimativa Semanal</div>
                                                    <div className="text-2xl font-black text-orange-600">{calData.weekly} kcal</div>
                                                    <div className="flex justify-end gap-2 items-center mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400">{calData.minutes} min/semana</span>
                                                        <Badge className={cn("text-[9px] font-black uppercase", calData.color)}>{calData.level}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {sportFields.map((field, index) => (
                                                <div key={field.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4 animate-in fade-in duration-300">
                                                    <div className="col-span-5">
                                                        <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Modalidade</FormLabel>
                                                        <Input list="sports-list" {...form.register(`sports.${index}.type` as any)} className="h-9" />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Frequência</FormLabel>
                                                        <Input type="number" {...form.register(`sports.${index}.freq` as any)} placeholder="Dias/Sem" className="h-9" />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Duração</FormLabel>
                                                        <Input type="number" {...form.register(`sports.${index}.duration` as any)} placeholder="Min/Dia" className="h-9" />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <Button variant="ghost" size="icon" onClick={() => removeSport(index)} className="focusable-element h-9 w-9 text-red-500 hover:bg-red-50">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <datalist id="sports-list">
                                                {Object.keys(KCAL_TABLE).map(s => <option key={s} value={s} />)}
                                            </datalist>

                                            <Button type="button" variant="outline" size="sm" onClick={() => appendSport({ type: "", freq: "", duration: "" })} className="focusable-element w-full border-dashed py-5 hover:bg-slate-50 transition-all font-bold text-slate-600">
                                                <Plus className="w-4 h-4 mr-2" /> ADICIONAR MODALIDADE
                                            </Button>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 13. CALÇADOS & PRESCRIÇÃO (Ref: PDF p.1 e p.4) */}
                                    <AccordionItem value="shoe" data-value="shoe" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'shoe' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#59cbbb' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Footprints className="h-5 w-5 text-blue-500" />
                                            Tênis (Recomendação Técnica)
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">

                                            {/* 1. SELEÇÃO DA PATOLOGIA */}
                                            <div className="space-y-1">
                                                <FormLabel className="text-blue-900 text-xs font-bold uppercase tracking-wider">1. Localização / Tipo de Lesão</FormLabel>
                                                <Select onValueChange={v => form.setValue("shoe.injuryType", v)}>
                                                    <SelectTrigger className="bg-white border-blue-200 h-10 shadow-sm">
                                                        <SelectValue placeholder="Selecione a patologia para recomendação..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="achilles">Tendinopatia de Aquiles / Panturrilha</SelectItem>
                                                        <SelectItem value="pfps">Dor Patelofemoral (Joelho)</SelectItem>
                                                        <SelectItem value="stress_fracture">Fratura por Estresse / Metatarsalgia</SelectItem>
                                                        <SelectItem value="plantar_fasciitis">Fasciíte Plantar</SelectItem>
                                                        <SelectItem value="none">Prevenção / Outros</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>


                                            {/* 3. CRITÉRIOS DE ESTADO E OBJETIVO */}
                                            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Estado da Lesão</FormLabel>
                                                    <Select onValueChange={v => form.setValue("shoe.injuryStatus", v)}>
                                                        <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                        <SelectContent>
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
                                                        <SelectContent>
                                                            <SelectItem value="pain_reduction">Conforto / Menos Dor</SelectItem>
                                                            <SelectItem value="performance">Performance / Velocidade</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Nível</FormLabel>
                                                    <Select onValueChange={v => form.setValue("shoe.experience", v)}>
                                                        <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="beginner">Iniciante</SelectItem>
                                                            <SelectItem value="amateur">Amador</SelectItem>
                                                            <SelectItem value="elite">Elite</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* 2. BANNER DE DIRETRIZ (VISUAL CORRIGIDO: Texto amplo e Ícone lateral moderno) */}
                                            <div className={cn("p-5 rounded-2xl border-2 flex items-center gap-6 transition-all shadow-sm", shoeRecommendations.color)}>
                                                <div className="flex-shrink-0 w-16 h-16 bg-white/80 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-white">
                                                    {shoeRecommendations.image}
                                                </div>
                                                <div className="flex-1">
                                                    <Badge className="mb-2 text-[10px] uppercase font-black tracking-widest bg-white/20 hover:bg-white/30 text-current border-none">
                                                        {shoeRecommendations.feature}
                                                    </Badge>
                                                    <h4 className="font-bold text-lg leading-tight mb-1">{shoeRecommendations.text}</h4>
                                                    <p className="text-sm leading-relaxed font-medium opacity-90 italic">
                                                        {shoeRecommendations.details}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 4. DADOS TÉCNICOS DO CALÇADO (FOTO 3 RESTAURADA) */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">Peso (g)</span>
                                                        <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.weight")} />
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">Drop (mm)</span>
                                                        <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.drop")} />
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">Stack (mm)</span>
                                                        <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.stack")} />
                                                    </div>
                                                </div>

                                                {/* SLIDERS DE FLEXIBILIDADE E ESTABILIDADE (FOTO 3 VOLTOU!) */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <ShoeScale
                                                        label="Flex. Longitudinal"
                                                        value={form.watch("shoe.flex_long")}
                                                        onChange={(v) => form.setValue("shoe.flex_long", v)}
                                                        options={[{ val: "0", label: "" }, { val: "0.5", label: "" }, { val: "1", label: "" }, { val: "1.5", label: "" }, { val: "2", label: "" }, { val: "2.5", label: "" }]}
                                                    />
                                                    <ShoeScale
                                                        label="Flex. Torsional"
                                                        value={form.watch("shoe.flex_tors")}
                                                        onChange={(v) => form.setValue("shoe.flex_tors", v)}
                                                        options={[{ val: "0", label: "" }, { val: "0.5", label: "" }, { val: "1", label: "" }, { val: "1.5", label: "" }, { val: "2", label: "" }, { val: "2.5", label: "" }]}
                                                    />
                                                    <ShoeScale
                                                        label="Estabilidade"
                                                        value={form.watch("shoe.stability")}
                                                        onChange={(v) => form.setValue("shoe.stability", v)}
                                                        options={[{ val: "5", label: "" }, { val: "4", label: "" }, { val: "3", label: "" }, { val: "2", label: "" }, { val: "1", label: "" }, { val: "0", label: "" }]}
                                                    />
                                                </div>
                                            </div>

                                            {/* 5. ÍNDICE MINIMALISTA FINAL */}
                                            <div className="p-6 bg-slate-900 rounded-2xl flex items-center justify-between text-white shadow-xl">
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Índice Minimalista Estimado</h4>
                                                    <p className="text-[10px] text-slate-400">Metodologia: The Running Clinic.</p>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-5xl font-black text-white">{minIndexResult}%</div>
                                                    <Badge className={cn("px-4 py-1.5 font-bold text-[11px]",
                                                        minIndexResult > 70 ? "bg-green-500" :
                                                            minIndexResult < 30 ? "bg-red-500" :
                                                                "bg-blue-500")}>
                                                        {minIndexResult > 70 ? "MINIMALISTA" : minIndexResult < 30 ? "MAXIMALISTA" : "TRANSIÇÃO"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 2. ESTÁTICA */}
                                    <AccordionItem value="static" data-value="static" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'static' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#257a97ff' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Camera className="h-5 w-5 text-purple-600" />
                                            Avaliação Estática
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">


                                            {/* Grid de Inputs Principais */}
                                            <div className="grid grid-cols-3 gap-4">
                                                {/* 2. Teste do Catálogo */}
                                                <div className="space-y-1">
                                                    <FormLabel>Teste do Catálogo</FormLabel>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Esquerdo" type="number" {...form.register("postural.teste_catalogo.left")} />
                                                        <Input placeholder="Direito" type="number" {...form.register("postural.teste_catalogo.right")} />
                                                    </div>
                                                </div>

                                                {/* 1. Naviculômetro com Lógica de Referência (Brain) */}
                                                <div className="space-y-1">
                                                    <FormLabel>Naviculômetro (mm)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* Lado Esquerdo */}
                                                        <div>
                                                            <Input placeholder="Esquerdo" type="number" {...form.register("postural.navicular.left")} />
                                                            {(() => {
                                                                const status = checkNavicularStatus(Number(form.watch("postural.navicular.left")), Number(form.watch("postural.shoeSize"))) || { label: "Aguardando...", color: "bg-slate-100 text-slate-400" };
                                                                return (
                                                                    <Badge className={cn("w-full justify-center text-[10px] mt-1", status.color)}>
                                                                        {status.label}
                                                                    </Badge>
                                                                );
                                                            })()}
                                                        </div>
                                                        {/* Lado Direito */}
                                                        <div>
                                                            <Input placeholder="Direito" type="number" {...form.register("postural.navicular.right")} />
                                                            {(() => {
                                                                const status = checkNavicularStatus(Number(form.watch("postural.navicular.right")), Number(form.watch("postural.shoeSize"))) || { label: "Aguardando...", color: "bg-slate-100 text-slate-400" };
                                                                return (
                                                                    <Badge className={cn("w-full justify-center text-[10px] mt-1", status.color)}>
                                                                        {status.label}
                                                                    </Badge>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 3. Número do Calçado (Essencial para a lógica do Arco) */}
                                                <div className="space-y-1">
                                                    <FormLabel>Nº Calçado</FormLabel>
                                                    <Input
                                                        type="number"
                                                        placeholder="Ex: 40"
                                                        {...form.register("postural.shoeSize")}
                                                    />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 7. PONTUAÇÃO DETALHADA FPI-6 (Referência PDF p.2) */}
                                    <AccordionItem value="fpi_detail" data-value="fpi_detail" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'fpi_detail' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#257a97ff' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Ruler className="h-5 w-5 text-indigo-500" />
                                            Foot Posture Index (FPI-6)
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="grid grid-cols-2 gap-8">
                                                {/* PÉ ESQUERDO */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 border-b pb-2">
                                                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                                                        <h4 className="text-xs font-black uppercase text-slate-500">Lado Esquerdo</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {[
                                                            { id: "talus", label: "Palpação da Cabeça do Tálus" },
                                                            { id: "curves", label: "Curvaturas Supra/Infra Maleolares" },
                                                            { id: "calc", label: "Inversão/Eversão do Calcâneo" },
                                                            { id: "tnj", label: "Articulação Talo-Navicular" },
                                                            { id: "arch", label: "Arco Medial" },
                                                            { id: "abd", label: "Abdução/Adução do Antepé" }
                                                        ].map((item) => (
                                                            <div key={item.id} className="flex items-center justify-between gap-4">
                                                                <label className="text-[10px] font-bold text-slate-600 uppercase leading-tight flex-1">{item.label}</label>
                                                                <Input type="number" {...form.register(`postural.fpi_left.${item.id}` as any, {
                                                                    onChange: (e) => {
                                                                        const val = parseInt(e.target.value);
                                                                        if (val > 2) form.setValue(`postural.fpi_left.${item.id}`, 2);
                                                                        if (val < -2) form.setValue(`postural.fpi_left.${item.id}`, -2);
                                                                    }
                                                                })} className="w-16 h-8 text-center font-bold bg-white" placeholder="0" min={-2} max={2} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Badge className={cn("w-full h-10 justify-center text-xs font-black shadow-inner", fpiData.left.c)}>
                                                        TOTAL E: {fpiData.left.s} ({fpiData.left.l})
                                                    </Badge>
                                                </div>

                                                {/* PÉ DIREITO */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 border-b pb-2">
                                                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                                                        <h4 className="text-xs font-black uppercase text-slate-500">Lado Direito</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {[
                                                            { id: "talus", label: "Palpação da Cabeça do Tálus" },
                                                            { id: "curves", label: "Curvaturas Supra/Infra Maleolares" },
                                                            { id: "calc", label: "Inversão/Eversão do Calcâneo" },
                                                            { id: "tnj", label: "Articulação Talo-Navicular" },
                                                            { id: "arch", label: "Arco Medial" },
                                                            { id: "abd", label: "Abdução/Adução do Antepé" }
                                                        ].map((item) => (
                                                            <div key={item.id} className="flex items-center justify-between gap-4">
                                                                <label className="text-[10px] font-bold text-slate-600 uppercase leading-tight flex-1">{item.label}</label>
                                                                <Input type="number" {...form.register(`postural.fpi_right.${item.id}` as any, {
                                                                    onChange: (e) => {
                                                                        const val = parseInt(e.target.value);
                                                                        if (val > 2) form.setValue(`postural.fpi_right.${item.id}`, 2);
                                                                        if (val < -2) form.setValue(`postural.fpi_right.${item.id}`, -2);
                                                                    }
                                                                })} className="w-16 h-8 text-center font-bold bg-white" placeholder="0" min={-2} max={2} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Badge className={cn("w-full h-10 justify-center text-xs font-black shadow-inner", fpiData.right.c)}>
                                                        TOTAL D: {fpiData.right.s} ({fpiData.right.l})
                                                    </Badge>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    {/* 8. ORTOSTATISMO - TESTES FUNCIONAIS (Ref: PDF p.4) */}
                                    <AccordionItem value="orto" data-value="orto" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'orto' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#257a97ff' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Flame className="h-5 w-5 text-sky-600" />
                                            Testes Funcionais (Ortostatismo)
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-8">

                                            {/* Teste de Jack - Referência: Hall & Brody */}
                                            <div className="p-4 bg-slate-50 rounded border">
                                                <h4 className="font-bold text-sm mb-4">Teste de Jack</h4>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div>
                                                        <FormLabel>Esquerdo</FormLabel>
                                                        <BipolarSlider value={Number(form.watch("tests.jack.left"))} onChange={(v) => form.setValue("tests.jack.left", v)} />
                                                        <ReferenceStatus type="jack" value={form.watch("tests.jack.left")} />
                                                    </div>
                                                    <div>
                                                        <FormLabel>Direito</FormLabel>
                                                        <BipolarSlider value={Number(form.watch("tests.jack.right"))} onChange={(v) => form.setValue("tests.jack.right", v)} />
                                                        <ReferenceStatus type="jack" value={form.watch("tests.jack.right")} />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Lunge Teste e Comprimento de Perna */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <FormLabel>Lunge Teste (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* LADO ESQUERDO */}
                                                        <div>
                                                            <Input placeholder="Esquerdo" type="number" {...form.register("tests.lunge.left")} />
                                                            <ReferenceStatus type="lunge" value={form.watch("tests.lunge.left")} />
                                                        </div>

                                                        {/* LADO DIREITO */}
                                                        <div>
                                                            <Input placeholder="Direito" type="number" {...form.register("tests.lunge.right")} />
                                                            <ReferenceStatus type="lunge" value={form.watch("tests.lunge.right")} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <FormLabel>Comprimento Membro Inferior (cm)</FormLabel>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Esquerdo" type="number" {...form.register("tests.ybalance.legLength.left")} />
                                                        <Input placeholder="Direito" type="number" {...form.register("tests.ybalance.legLength.right")} />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Y-BALANCE TESTE COMPLETO */}
                                            <div className="border rounded p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-bold text-sm">Y-Balance Teste</h4>
                                                    <div className="flex items-center gap-4 text-xs bg-slate-100 px-3 py-1 rounded">
                                                        <span className="font-bold uppercase text-slate-500">Dominância:</span>
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox checked={form.watch("tests.ybalance.dominance") === "left"} onCheckedChange={() => form.setValue("tests.ybalance.dominance", "left")} /> Esquerda
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox checked={form.watch("tests.ybalance.dominance") === "right"} onCheckedChange={() => form.setValue("tests.ybalance.dominance", "right")} /> Direita
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* BLOCO DE LÓGICA E TABELA Y-BALANCE */}
                                                {(() => {
                                                    const directions = [
                                                        { label: "Anterior", key: "Anterior", limit: 4 },
                                                        { label: "Postero Medial", key: "Post-Med", limit: 6 },
                                                        { label: "Postero Lateral", key: "Post-Lat", limit: 6 }
                                                    ];

                                                    const getAvg = (side: string, key: string) => {
                                                        const t1 = Number(form.watch(`tests.ybalance.${key}.${side}.t1` as any)) || 0;
                                                        const t2 = Number(form.watch(`tests.ybalance.${key}.${side}.t2` as any)) || 0;
                                                        const t3 = Number(form.watch(`tests.ybalance.${key}.${side}.t3` as any)) || 0;
                                                        const vals = [t1, t2, t3].filter(v => v > 0);
                                                        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                                                    };

                                                    const getPct = (avg: number, side: string) => {
                                                        const legLength = Number(form.watch(`tests.ybalance.legLength.${side}` as any)) || 0;
                                                        return legLength > 0 && avg > 0 ? Math.round((avg / legLength) * 100) : 0;
                                                    };

                                                    // Variáveis para a caixinha condicional de assimetria anterior
                                                    const lAvgAnt = getAvg("left", "Anterior");
                                                    const rAvgAnt = getAvg("right", "Anterior");
                                                    const diffAnt = Math.abs(lAvgAnt - rAvgAnt);

                                                    // Variáveis para o Score Composto (Média das 3 direções / Comprimento da Perna)
                                                    const lComp = (getAvg("left", "Anterior") + getAvg("left", "Post-Med") + getAvg("left", "Post-Lat")) / 3;
                                                    const lScore = getPct(lComp, "left");

                                                    return (
                                                        <>
                                                            <table className="w-full text-sm text-center">
                                                                <thead className="bg-muted text-xs">
                                                                    <tr>
                                                                        <th className="p-2 text-left">Direção</th>
                                                                        <th colSpan={3}>Esquerda (cm)</th>
                                                                        <th>Média</th>
                                                                        <th>%</th>
                                                                        <th colSpan={3}>Direita (cm)</th>
                                                                        <th>Média</th>
                                                                        <th>%</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {directions.map(dir => {
                                                                        const lAvg = getAvg("left", dir.key);
                                                                        const rAvg = getAvg("right", dir.key);
                                                                        const lPct = getPct(lAvg, "left");
                                                                        const rPct = getPct(rAvg, "right");

                                                                        return (
                                                                            <tr key={dir.key} className="border-b">
                                                                                <td className="text-left p-2 font-medium">{dir.label}</td>
                                                                                {[1, 2, 3].map(t => (
                                                                                    <td key={`L${t}`} className="p-1">
                                                                                        <Input className="h-7 w-16 mx-auto px-1 text-center" type="number" {...form.register(`tests.ybalance.${dir.key}.left.t${t}` as any)} />
                                                                                    </td>
                                                                                ))}
                                                                                <td className="p-1 font-bold text-blue-600 bg-blue-50/50">{Math.round(lAvg) || "-"}</td>
                                                                                <td className="p-1 text-[10px] text-slate-500 bg-slate-50">{lPct ? lPct + "%" : "-"}</td>
                                                                                {[1, 2, 3].map(t => (
                                                                                    <td key={`R${t}`} className="p-1">
                                                                                        <Input className="h-7 w-16 mx-auto px-1 text-center" type="number" {...form.register(`tests.ybalance.${dir.key}.right.t${t}` as any)} />
                                                                                    </td>
                                                                                ))}
                                                                                <td className="p-1 font-bold text-green-600 bg-green-50/50">{Math.round(rAvg) || "-"}</td>
                                                                                <td className="p-1 text-[10px] text-slate-500 bg-slate-50">{rPct ? rPct + "%" : "-"}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>

                                                            {/* RESULTADO CONDICIONAL Y-BALANCE (CAIXINHAS COLORIDAS) */}
                                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                                {/* Verificação de Assimetria Anterior */}
                                                                {diffAnt > 4 ? (
                                                                    <div className="bg-red-100 text-red-700 p-2 rounded text-center text-xs font-bold border border-red-200">
                                                                        ASSIMETRIA ANTERIOR ({Math.round(diffAnt)}cm) - RISCO
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-green-100 text-green-700 p-2 rounded text-center text-xs font-bold border border-green-200">
                                                                        SIMETRIA ANTERIOR - NORMAL
                                                                    </div>
                                                                )}

                                                                {/* Verificação de Score Composto Perna Esquerda */}
                                                                {lScore < 94 ? (
                                                                    <div className="bg-yellow-100 text-yellow-700 p-2 rounded text-center text-xs font-bold border border-yellow-200">
                                                                        SCORE COMPOSTO E. ({lScore}%) - ATENÇÃO
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-green-100 text-green-700 p-2 rounded text-center text-xs font-bold border border-green-200">
                                                                        SCORE COMPOSTO E. - EXCELENTE
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 10. DECÚBITO DORSAL - FLEXIBILIDADE E FORÇA (Ref: PDF p.3) */}
                                    <AccordionItem value="dorsal" data-value="dorsal" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'dorsal' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#257a97ff' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <ArrowBigUp className="h-5 w-5 text-emerald-600" />
                                            Testes Funcionais (Decúbito Dorsal)
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Teste de Thomas - Ref PDF: 10º */}
                                                <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                    <FormLabel className="text-xs font-black uppercase text-blue-800">Teste de Thomas - Psoas (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Input placeholder="Esquerdo" type="number" {...form.register("tests.thomas.left")} className="h-10 font-bold text-center" />
                                                            <ReferenceStatus type="thomas" value={form.watch("tests.thomas.left")} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Input placeholder="Direito" type="number" {...form.register("tests.thomas.right")} className="h-10 font-bold text-center" />
                                                            <ReferenceStatus type="thomas" value={form.watch("tests.thomas.right")} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Isquiosurais - Ref PDF: 132º */}
                                                <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                    <FormLabel className="text-xs font-black uppercase text-blue-800">Flexibilidade de Isquiosurais (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Input placeholder="Esquerdo" type="number" {...form.register("tests.slr.left")} className="h-10 font-bold text-center" />
                                                            <ReferenceStatus type="slr" value={form.watch("tests.slr.left")} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Input placeholder="Direito" type="number" {...form.register("tests.slr.right")} className="h-10 font-bold text-center" />
                                                            <ReferenceStatus type="slr" value={form.watch("tests.slr.right")} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Força Muscular com Sliders Dinâmicos */}
                                            <div className="border-t pt-6 space-y-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Flame className="w-4 h-4 text-orange-500" />
                                                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-700">Força Muscular (MMT 0-10)</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    {/* Glúteo Médio */}
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">Glúteo Médio</span>
                                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Estabilidade</Badge>
                                                        </div>
                                                        <div className="space-y-5">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-black w-4 text-slate-400">E</span>
                                                                <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.med_left")]} onValueChange={([v]) => form.setValue("tests.glute_strength.med_left", v)} />
                                                                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.med_left")}</div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-black w-4 text-slate-400">D</span>
                                                                <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.med_right")]} onValueChange={([v]) => form.setValue("tests.glute_strength.med_right", v)} />
                                                                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.med_right")}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Glúteo Máximo */}
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">Glúteo Máximo</span>
                                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Propulsão</Badge>
                                                        </div>
                                                        <div className="space-y-5">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-black w-4 text-slate-400">E</span>
                                                                <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.max_left")]} onValueChange={([v]) => form.setValue("tests.glute_strength.max_left", v)} />
                                                                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.max_left")}</div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-black w-4 text-slate-400">D</span>
                                                                <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.max_right")]} onValueChange={([v]) => form.setValue("tests.glute_strength.max_right", v)} />
                                                                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.max_right")}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    {/* 11. DECÚBITO VENTRAL - TORÇÃO E RIGIDEZ (Ref: PDF p.3) */}
                                    <AccordionItem value="ventral" data-value="ventral" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'ventral' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#257a97ff' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <ArrowBigDown className="h-5 w-5 text-emerald-600" />
                                            Testes Funcionais (Decúbito Ventral)
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            {/* Tabela de Medidas de Torção */}
                                            <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
                                                <table className="w-full text-sm text-center border-collapse">
                                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500">
                                                        <tr>
                                                            <th className="p-3 border-b border-r">Lado</th>
                                                            <th className="border-b border-r">Retropé (º)</th>
                                                            <th className="border-b border-r">Antepé (º)</th>
                                                            <th className="border-b">APA (º)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {['left', 'right'].map((side) => (
                                                            <tr key={side} className="border-b last:border-0">
                                                                <td className="p-3 font-bold text-slate-700 bg-slate-50/30 border-r">{side === 'left' ? 'Esquerdo' : 'Direito'}</td>
                                                                <td className="p-1.5 border-r"><Input className="h-8 w-full text-center border-none focus:ring-0 font-bold" type="number" {...form.register(`tests.ventral.measures.${side}.retro` as any)} /></td>
                                                                <td className="p-1.5 border-r"><Input className="h-8 w-full text-center border-none focus:ring-0 font-bold" type="number" {...form.register(`tests.ventral.measures.${side}.ante` as any)} /></td>
                                                                <td className="p-1.5"><Input className="h-8 w-full text-center border-none focus:ring-0 font-bold" type="number" {...form.register(`tests.ventral.measures.${side}.apa` as any)} /></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Rigidez Rotadores Laterais - Ref PDF: 40-42º Normal */}
                                                <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                    <FormLabel className="text-xs font-black uppercase text-blue-800">Rigidez Rotadores Laterais (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {['left', 'right'].map((side) => (
                                                            <div key={side} className="space-y-1">
                                                                <Input placeholder={side === 'left' ? "Esquerdo" : "Direito"} type="number" {...form.register(`tests.ventral.rotation.${side}` as any)} className="h-10 text-center font-bold" />
                                                                <ReferenceStatus type="hip_rotation_stiffness" value={form.watch(`tests.ventral.rotation.${side}`)} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Teste de Craig - Anteversão Femoral */}
                                                <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                    <FormLabel className="text-xs font-black uppercase text-slate-600">Teste de Craig (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {['left', 'right'].map((side) => (
                                                            <div key={side} className="space-y-1">
                                                                <Input placeholder={side === 'left' ? "Esquerdo" : "Direito"} type="number" {...form.register(`tests.ventral.craig.${side}` as any)} className="h-10 text-center font-bold" />
                                                                <ReferenceStatus type="craig" value={form.watch(`tests.ventral.craig.${side}`)} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>


                                    {/* 11.5 BAROPODOMETRIA (Ref: PDF p.2) */}
                                    <AccordionItem value="baropo" data-value="baropo" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'baropo' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#257a97ff' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <Gauge className="h-5 w-5 text-rose-500" />
                                            Baropodometria
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Baropodometria 2D</span>
                                                    <PasteUploadZone
                                                        label="Imagem 2D"
                                                        value={form.watch("tests.baropo_2d")}
                                                        onChange={(v) => form.setValue("tests.baropo_2d", v)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Baropodometria 3D</span>
                                                    <PasteUploadZone
                                                        label="Imagem 3D"
                                                        value={form.watch("tests.baropo_3d")}
                                                        onChange={(v) => form.setValue("tests.baropo_3d", v)}
                                                    />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 12. AVALIAÇÃO DINÂMICA (Ref: PDF p.2 e p.3) */}
                                    <AccordionItem value="dynamic" data-value="dynamic" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'dynamic' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#257a97ff' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <TimerReset className="h-5 w-5 text-violet-600" />
                                            Avaliação Dinâmica
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-8">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div>
                                                    <FormLabel>Pontuação Dynamic Foot Index (-4 a +4)</FormLabel>
                                                    <table className="w-full text-sm mt-2">
                                                        <thead className="bg-muted">
                                                            <tr>
                                                                <th>Fase</th>
                                                                <th>Esquerdo</th>
                                                                <th>Direito</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {["Reposta à carga", "Apoio médio", "Impulsão"].map((f, i) => (
                                                                <tr key={i} className="border-b">
                                                                    <td className="p-2">{f}</td>
                                                                    <td className="p-1">
                                                                        <Input
                                                                            type="number"
                                                                            className="text-center"
                                                                            min={-4}
                                                                            max={4}
                                                                            // Use value or empty string to avoid "0" trap
                                                                            value={form.watch(`tests.dfi.${i}.left` as any) ?? ""}
                                                                            onChange={(e) => {
                                                                                // Allow typing "-" or empty
                                                                                const val = e.target.value;
                                                                                if (val === "" || val === "-") {
                                                                                    form.setValue(`tests.dfi.${i}.left` as any, val as any);
                                                                                    return;
                                                                                }
                                                                                const parsed = parseInt(val);
                                                                                if (!isNaN(parsed)) {
                                                                                    form.setValue(`tests.dfi.${i}.left` as any, parsed);
                                                                                }
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                let val = parseInt(e.target.value);
                                                                                if (isNaN(val)) val = 0;
                                                                                if (val > 4) val = 4;
                                                                                if (val < -4) val = -4;
                                                                                form.setValue(`tests.dfi.${i}.left` as any, val);
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="p-1">
                                                                        <Input
                                                                            type="number"
                                                                            className="text-center"
                                                                            min={-4}
                                                                            max={4}
                                                                            value={form.watch(`tests.dfi.${i}.right` as any) ?? ""}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                if (val === "" || val === "-") {
                                                                                    form.setValue(`tests.dfi.${i}.right` as any, val as any);
                                                                                    return;
                                                                                }
                                                                                const parsed = parseInt(val);
                                                                                if (!isNaN(parsed)) {
                                                                                    form.setValue(`tests.dfi.${i}.right` as any, parsed);
                                                                                }
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                let val = parseInt(e.target.value);
                                                                                if (isNaN(val)) val = 0;
                                                                                if (val > 4) val = 4;
                                                                                if (val < -4) val = -4;
                                                                                form.setValue(`tests.dfi.${i}.right` as any, val);
                                                                            }}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="h-40 bg-white border rounded">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart
                                                            data={[
                                                                { name: 'CI', e: form.watch("tests.dfi.0.left"), d: form.watch("tests.dfi.0.right"), ref: 1 },
                                                                { name: 'RC', e: form.watch("tests.dfi.1.left"), d: form.watch("tests.dfi.1.right"), ref: 0 },
                                                                { name: 'IMP', e: form.watch("tests.dfi.2.left"), d: form.watch("tests.dfi.2.right"), ref: 0 }
                                                            ]}
                                                            margin={{ top: 5, right: 15, bottom: 5, left: 15 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                                            <Line type="monotone" dataKey="e" stroke={COLOR_LEFT_FOOT} strokeWidth={2} name="Pé Esquerdo" />
                                                            <Line type="monotone" dataKey="d" stroke={COLOR_RIGHT_FOOT} strokeWidth={2} name="Pé Direito" />
                                                            <Line type="monotone" dataKey="ref" stroke={COLOR_REF_LINE} strokeDasharray="5 5" strokeWidth={2} dot={false} name="Referência" />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                                                <h4 className="font-bold text-sm">Agachamento Unipodal</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* Lado Esquerdo */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge style={{ backgroundColor: COLOR_LEFT_FOOT }}>Esquerda</Badge>
                                                        </div>

                                                        {/* Campos de Avaliação */}
                                                        <div className="grid grid-cols-1 gap-3 text-xs">
                                                            <div>
                                                                <label className="font-semibold block mb-1">Queda Pélvica</label>
                                                                <Select onValueChange={v => form.setValue("tests.single_squat.pelvic_drop_left", v)} value={form.watch("tests.single_squat.pelvic_drop_left")}>
                                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                                        <SelectItem value="Leve">Leve</SelectItem>
                                                                        <SelectItem value="Moderado">Moderado</SelectItem>
                                                                        <SelectItem value="Acentuado">Acentuado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <label className="font-semibold block mb-1">Valgo Dinâmico</label>
                                                                <Select onValueChange={v => form.setValue("tests.single_squat.valgus_left", v)} value={form.watch("tests.single_squat.valgus_left")}>
                                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                                        <SelectItem value="Leve">Leve</SelectItem>
                                                                        <SelectItem value="Moderado">Moderado</SelectItem>
                                                                        <SelectItem value="Acentuado">Acentuado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <label className="font-semibold block mb-1">Anteriorização do Tronco</label>
                                                                <Select onValueChange={v => form.setValue("tests.single_squat.trunk_left", v)} value={form.watch("tests.single_squat.trunk_left")}>
                                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                                        <SelectItem value="Leve">Leve</SelectItem>
                                                                        <SelectItem value="Moderado">Moderado</SelectItem>
                                                                        <SelectItem value="Acentuado">Acentuado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Foto */}
                                                        <div className="mt-2">
                                                            <label className="font-semibold text-xs mb-1 block">Foto Agachamento Unipodal (Esq)</label>
                                                            <PasteUploadZone
                                                                onImagePaste={(file) => handleImageUpload(file, "single_squat_left")}
                                                                currentImage={form.watch("tests.single_squat.photo_left")}
                                                                onClear={() => form.setValue("tests.single_squat.photo_left", "")}
                                                                height={200}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Lado Direito */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge style={{ backgroundColor: COLOR_RIGHT_FOOT }}>Direita</Badge>
                                                        </div>

                                                        {/* Campos de Avaliação */}
                                                        <div className="grid grid-cols-1 gap-3 text-xs">
                                                            <div>
                                                                <label className="font-semibold block mb-1">Queda Pélvica</label>
                                                                <Select onValueChange={v => form.setValue("tests.single_squat.pelvic_drop_right", v)} value={form.watch("tests.single_squat.pelvic_drop_right")}>
                                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                                        <SelectItem value="Leve">Leve</SelectItem>
                                                                        <SelectItem value="Moderado">Moderado</SelectItem>
                                                                        <SelectItem value="Acentuado">Acentuado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <label className="font-semibold block mb-1">Valgo Dinâmico</label>
                                                                <Select onValueChange={v => form.setValue("tests.single_squat.valgus_right", v)} value={form.watch("tests.single_squat.valgus_right")}>
                                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                                        <SelectItem value="Leve">Leve</SelectItem>
                                                                        <SelectItem value="Moderado">Moderado</SelectItem>
                                                                        <SelectItem value="Acentuado">Acentuado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <label className="font-semibold block mb-1">Anteriorização do Tronco</label>
                                                                <Select onValueChange={v => form.setValue("tests.single_squat.trunk_right", v)} value={form.watch("tests.single_squat.trunk_right")}>
                                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                                        <SelectItem value="Leve">Leve</SelectItem>
                                                                        <SelectItem value="Moderado">Moderado</SelectItem>
                                                                        <SelectItem value="Acentuado">Acentuado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Foto */}
                                                        <div className="mt-2">
                                                            <label className="font-semibold text-xs mb-1 block">Foto Agachamento Unipodal (Dir)</label>
                                                            <PasteUploadZone
                                                                onImagePaste={(file) => handleImageUpload(file, "single_squat_right")}
                                                                currentImage={form.watch("tests.single_squat.photo_right")}
                                                                onClear={() => form.setValue("tests.single_squat.photo_right", "")}
                                                                height={200}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* FOTOS DE MARCHA (SEPARADAS) */}
                                            <div className="space-y-6">
                                                <div className="space-y-2 border-b pb-4">
                                                    <span className="text-xs font-bold uppercase flex items-center gap-2" style={{ color: COLOR_LEFT_FOOT }}><Footprints className="w-4 h-4" /> Pé Esquerdo</span>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <PasteUploadZone
                                                            label="Resposta à Carga"
                                                            value={form.watch("tests.gait_photos.left.initial")}
                                                            onChange={(v) => form.setValue("tests.gait_photos.left.initial", v)}
                                                        />
                                                        <PasteUploadZone
                                                            label="Apoio Médio"
                                                            value={form.watch("tests.gait_photos.left.mid")}
                                                            onChange={(v) => form.setValue("tests.gait_photos.left.mid", v)}
                                                        />
                                                        <PasteUploadZone
                                                            label="Impulsão"
                                                            value={form.watch("tests.gait_photos.left.terminal")}
                                                            onChange={(v) => form.setValue("tests.gait_photos.left.terminal", v)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold uppercase flex items-center gap-2" style={{ color: COLOR_RIGHT_FOOT }}><Footprints className="w-4 h-4" /> Pé Direito</span>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <PasteUploadZone
                                                            label="Resposta à Carga"
                                                            value={form.watch("tests.gait_photos.right.initial")}
                                                            onChange={(v) => form.setValue("tests.gait_photos.right.initial", v)}
                                                        />
                                                        <PasteUploadZone
                                                            label="Apoio Médio"
                                                            value={form.watch("tests.gait_photos.right.mid")}
                                                            onChange={(v) => form.setValue("tests.gait_photos.right.mid", v)}
                                                        />
                                                        <PasteUploadZone
                                                            label="Impulsão"
                                                            value={form.watch("tests.gait_photos.right.terminal")}
                                                            onChange={(v) => form.setValue("tests.gait_photos.right.terminal", v)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>


                                    {/* 13. EXAMES E PLANO (COM MIC FUNCIONAL) */}
                                    <AccordionItem value="exams" data-value="exams" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'exams' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#ff9294' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <FileText className="h-5 w-5 text-slate-500" />
                                            Exames complementares
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-4">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Mic className="w-4 h-4 text-blue-600" />
                                                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-700">Resultados e Laudos</h4>
                                                </div>
                                                <AudioTextarea
                                                    value={form.watch("plan.exams")}
                                                    onChange={(e) => form.setValue("plan.exams", e.target.value)}
                                                    onTranscription={(text) => form.setValue("plan.exams", text)}
                                                    placeholder="Descreva os achados dos exames ou use o microfone..."
                                                    className="min-h-[100px] shadow-sm border-slate-200"
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 14. PLANO TERAPÊUTICO & EXERCÍCIOS (Ref: PDF p.4) */}
                                    <AccordionItem value="exercises" data-value="exercises" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'exercises' ? 'col-span-1 md:col-span-2' : 'col-span-1')} style={{ borderLeftColor: '#ff9294' }}>
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                            <PillBottle className="h-5 w-5 text-teal-600" />
                                            Plano Terapêutico & Orientações
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-8">

                                            {/* Lista de Exercícios Prescritos */}
                                            <div className="space-y-3">
                                                <FormLabel>Exercícios Prescritos</FormLabel>
                                                <div className="space-y-3">
                                                    {exerciseFields.map((field, index) => (
                                                        <div key={field.id} className="animate-in slide-in-from-left-2 duration-300 border border-slate-100 rounded-lg p-4 bg-slate-50/30">
                                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                                {/* Nome do Exercício */}
                                                                <div className="col-span-12 md:col-span-6 space-y-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nome do Exercício</span>
                                                                    <ExerciseCombobox
                                                                        value={form.watch(`plan.exercises.${index}.name` as any)}
                                                                        onChange={(val) => form.setValue(`plan.exercises.${index}.name` as any, val)}
                                                                    />
                                                                </div>

                                                                {/* Séries com Tooltip */}
                                                                <div className="col-span-6 md:col-span-2 space-y-1">
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
                                                                <div className="col-span-6 md:col-span-2 space-y-1">
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
                                                                <div className="col-span-12 md:col-span-2 flex md:justify-end">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeExercise(index)}
                                                                        className="focusable-element text-slate-400 hover:text-red-500 hover:bg-red-50 w-full md:w-auto"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                                                                        <span className="md:hidden">Remover</span>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Button type="button" variant="outline" size="sm" onClick={() => appendExercise({ name: "" })} className="focusable-element w-full border-dashed h-10 hover:bg-slate-50 text-slate-500 font-bold text-xs">
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
                                                    onChange={(e) => form.setValue("plan.orientations", e.target.value)}
                                                    onTranscription={(text) => form.setValue("plan.orientations", text)}
                                                    placeholder="Descreva as orientações específicas ou use o gravador para ditar o plano..."
                                                    className="min-h-[150px] shadow-sm border-slate-200"
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* PEDIDO PALMILHA PROPULSÃO */}
                                    <PropulsaoAccordionItem
                                        value="propulsao"
                                        data={form.getValues()}
                                        patientId={patientId}
                                        patientName={form.watch("patient.name") || "Paciente"}
                                        patientEmail={form.watch("patient.email")}
                                        patientPhone={form.watch("patient.phone")}
                                        openSection={openSection}
                                    />
                                </Accordion>
                            </form>
                        </Form>
                    </div>
                    {/* SIDEBAR BIOMECÂNICA (Lado Direito) */}
                    <div className="lg:col-span-4 xl:col-span-3 hidden lg:block relative">
                        <div className="sticky top-6 space-y-6">
                            <BiomechanicsSidebar
                                form={form}
                                calorieData={calData}
                                fpiData={fpiData}
                                shoeIndex={minIndexResult}
                                shoeRec={shoeRecommendations}
                                radarData={radarData}
                            />

                            {/* Card de Atalho para o Relatório */}
                            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-slate-800 overflow-hidden relative group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-600/30 transition-all" />
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4">Acesso Rápido</h4>
                                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                                    Finalizou a coleta de dados? Visualize o relatório científico estruturado para o paciente.
                                </p>
                                <Button
                                    onClick={() => setPreviewOpen(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-blue-900/20"
                                >
                                    <Eye className="w-4 h-4 mr-2" /> GERAR RELATÓRIO FINAL
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- OUTROS FORMULÁRIOS --- */}
            {activeForm === 'avancada' && (
                <div className="animate-in fade-in duration-500">
                    <PhysicalAssessmentForm patientId={patientId} />
                </div>
            )}

            {activeForm === 'clinica' && (
                <div className="animate-in fade-in duration-500">
                    <SmartAssessmentForm patientId={patientId} />
                </div>
            )}

            {activeForm === 'mulher' && (
                <div className="animate-in fade-in duration-500">
                    <WomensHealthForm patientId={patientId} />
                </div>
            )}
            {/* --- COMPONENTES AUXILIARES PARA O RELATÓRIO --- */}
            <BiomechanicsReport
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                form={form}
                shoeRec={shoeRecommendations}
                minIndex={minIndexResult}
                organizationName={orgSettings?.name}
                patient={patient}
            />
        </div >
    );
}