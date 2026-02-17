// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";

import { useDebouncedCallback } from "use-debounce";
import { useParams } from "next/navigation";
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
    CheckCircle2, Flame, Footprints, ChevronDown, ChevronUp, Menu, AlertTriangle,
    ChevronsUpDown, Check, MessageCircle, Stethoscope, Target, Activity,
    Zap, Ruler, User, Bed, Scan, Video, FileText, ClipboardList, TrendingDown,
    Database,
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
    Volume2,
    Ear,
    CalendarClock,
    ArrowLeft,
    Save,
    BookOpen,
    Youtube,
} from "lucide-react";
import { RapidAssessmentModal } from "@/features/pbe/components/RapidAssessmentModal";
import Swal from 'sweetalert2';
import { Badge } from "@/components/ui/badge";
import { parseFeegowToLegacyForm } from "../utils/feegow-legacy-parser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip as RechartsTooltip, Legend, CartesianGrid
} from 'recharts';

import { COLOR_LEFT_FOOT, COLOR_RIGHT_FOOT, COLOR_REF_LINE } from "@/utils/report-constants";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

// COMPONENTES FILHOS
import { BiomechanicsSidebar } from "./biomechanics-sidebar";
import { AdvancedPhysicalForm } from "@/features/pbe/components/AdvancedPhysicalForm";
import { ConceptPBEForm } from "@/features/pbe/components/ConceptPBEForm";
import WomensHealthForm from "@/features/womens-health/components/WomensHealthForm";
import { BodyPainMap } from "./body-pain-map";
import { PasteUploadZone } from "@/components/ui/paste-upload-zone";
import { BipolarSlider } from "@/components/ui/bipolar-slider";
import { AudioTextarea } from "./audio-textarea";
import { VoiceRecorder } from "@/components/ui/voice-recorder";
import { PropulsaoAccordionItem } from "./PropulsaoAccordionItem";
import { BiomechanicsReport } from "./biomechanics-report";
import { CLINICAL_REFS, checkStatus, checkNavicularStatus, calculateMinimalistIndex, calculateFlexibilityScore, calculateRadarData } from "@/utils/clinical-references";
import { calculateActivityLevel, calculateFpiScore } from "@/utils/pbe-calculations";
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
import { SHOE_DATABASE, ShoeModel } from "@/app/dashboard/[slug]/assessments/shoe-database";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info as InfoIcon } from "lucide-react";
import { getOrganizationSettings } from "@/app/dashboard/[slug]/settings/organization/actions";
import { saveShoeModel, fetchCustomShoes } from "@/app/dashboard/[slug]/assessments/shoe-actions";
import { QuestionnaireSender } from "./QuestionnaireSender";

const QUESTIONNAIRES_BY_CATEGORY = [
    {
        category: "Coluna Cervical",
        items: [
            { id: "ndi", label: "NDI (Cervical)" }
        ]
    },
    {
        category: "Coluna Lombar",
        items: [
            { id: "oswestry", label: "Oswestry (Lombar)" },
            { id: "roland_morris", label: "Roland-Morris (Lombar)" },
            { id: "quebec", label: "Quebec (Lombar)" },
            { id: "start_back", label: "STarT Back (Triagem)" }
        ]
    },
    {
        category: "Ombro",
        items: [
            { id: "spadi", label: "SPADI (Ombro)" }
        ]
    },
    {
        category: "Cotovelo, Punho e Mão",
        items: [
            { id: "quickdash", label: "QuickDASH (Mm. Superior)" },
            { id: "prwe", label: "PRWE (Punho)" }
        ]
    },
    {
        category: "Quadril",
        items: [
            { id: "hoos", label: "HOOS (Quadril)" },
            { id: "ihot33", label: "iHOT-33 (Quadril)" }
        ]
    },
    {
        category: "Joelho",
        items: [
            { id: "koos", label: "KOOS (Joelho)" },
            { id: "ikdc", label: "IKDC Subjetivo (Joelho)" },
            { id: "lysholm", label: "Lysholm (Joelho)" }
        ]
    },
    {
        category: "Pé e Tornozelo",
        items: [
            { id: "lefs", label: "LEFS (Membro Inferior)" },
            { id: "faam", label: "FAAM (Tornozelo e Pé)" },
            { id: "faos", label: "FAOS (Tornozelo e Pé)" },
            { id: "aofas", label: "AOFAS (Tornozelo/Retropé)" }
        ]
    },
    {
        category: "Saúde Pélvica",
        items: [
            { id: "iciq_sf", label: "ICIQ-SF (Incontinência)" },
            { id: "udi_6", label: "UDI-6 (Urogenital)" },
            { id: "fsfi", label: "FSFI (Função Sexual)" }
        ]
    },
    {
        category: "Geral & Dor",
        items: [
            { id: "tampa_kinesiophobia", label: "Tampa (Cinesiofobia)" },
            { id: "mcgill_short", label: "McGill (Dor)" }
        ]
    }
];

const QUESTIONNAIRES = QUESTIONNAIRES_BY_CATEGORY.flatMap(c => c.items);

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
// Mapeamento de Estilos por Seção (Ícone e Borda)
const SECTION_STYLES: Record<string, { border: string, iconColor: string }> = {
    hma: { border: "border-l-blue-600", iconColor: "text-blue-600" },
    history: { border: "border-l-green-600", iconColor: "text-green-600" },
    map: { border: "border-l-red-500", iconColor: "text-red-500" },
    efep: { border: "border-l-orange-500", iconColor: "text-orange-500" },
    sports: { border: "border-l-yellow-500", iconColor: "text-yellow-500" },
    shoe: { border: "border-l-blue-500", iconColor: "text-blue-500" },
    static: { border: "border-l-violet-600", iconColor: "text-violet-600" },
    fpi_detail: { border: "border-l-indigo-500", iconColor: "text-indigo-500" },
    orto: { border: "border-l-sky-600", iconColor: "text-sky-600" },
    dorsal: { border: "border-l-emerald-600", iconColor: "text-emerald-600" },
    ventral: { border: "border-l-emerald-600", iconColor: "text-emerald-600" },
    baropo: { border: "border-l-rose-500", iconColor: "text-rose-500" },
    dynamic: { border: "border-l-violet-600", iconColor: "text-violet-600" },
    exams: { border: "border-l-slate-500", iconColor: "text-slate-500" },
    exercises: { border: "border-l-teal-600", iconColor: "text-teal-600" },
    propulsao: { border: "border-l-blue-700", iconColor: "text-blue-700" }
};

const KCAL_TABLE: Record<string, number> = { "Arremesso de Peso/Disco": 300, "Balé": 450, "Basquete": 650, "Beach Tênis": 550, "Bicicleta Ergométrica (Intensa)": 600, "Bike (Ciclismo de Estrada)": 500, "Boxe (Treino)": 800, "Caminhada (5 km/h)": 300, "Caminhada em Trilha (Hiking)": 450, "Capoeira": 650, "Corrida (10 km/h)": 900, "Crossfit": 700, "Dança de Salão": 350, "Danças Urbanas/Hip Hop": 500, "Escalada": 600, "Esgrima": 450, "Frescobol": 400, "Futebol": 800, "Futsal": 750, "Futevôlei": 600, "Ginástica Artística": 400, "Ginástica Laboral": 150, "Ginástica Olímpica": 500, "Golfe": 250, "Handebol": 700, "Hidroginástica": 400, "Jiu-Jitsu": 750, "Judô": 700, "Karatê": 650, "Kickboxing": 850, "Krav Maga": 700, "Musculação": 350, "Muay Thai": 800, "Natação (Crawl moderado)": 600, "Natação (Borboleta/Intenso)": 850, "Padel": 550, "Patinação": 500, "Pilates": 300, "Pular Corda (Rápido)": 950, "Remo": 600, "Rugby": 800, "Skate": 400, "Spinning": 700, "Squash": 900, "Surf": 350, "Tênis": 500, "Tênis de Mesa": 300, "Treino Funcional": 550, "Triatlo": 900, "Vôlei de Praia": 600, "Vôlei de Quadra": 400, "Yoga": 250, "Zumba": 550 };
const ReferenceStatus = ({ value, type }: { value: any, type: string }) => {
    const v = Number(value);
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">Sem Dados</div>;

    // Lógica Centralizada (Brain)
    const status = checkStatus(type as any, v);

    // Fallback se não encontrar
    if (!status) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">-</div>;

    return <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase transition-all duration-300", status.color)}>{status.label}</div>;
};

// Componente de Escala de Calçados (Dropdown)
// Componente de Escala de Calçados (Bolinhas)
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

const defaultFocusStyle = "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const ComboboxSelector = ({ value, onChange, database, placeholder = "Buscar...", autoFocus, onCommit }: { value: string, onChange: (v: string) => void, database: string[], placeholder?: string, autoFocus?: boolean, onCommit?: () => void }) => {
    const [open, setOpen] = useState(false);

    // Auto-open on mount if requested (e.g., new item added)
    useEffect(() => {
        if (autoFocus) {
            setOpen(true);
        }
    }, [autoFocus]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full h-9 justify-between bg-white text-left font-normal text-slate-700 px-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Digite para buscar..."
                        // Remove default ring/border to fix "cut circle" UI issue
                        className="h-9 border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
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
                                        if (onCommit) onCommit() // Focus next field
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
                                if (onCommit) onCommit() // Focus next field
                            }
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>

    )
};

const ExtraQuestionnaireSelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-9 text-xs border-blue-200 font-bold bg-white text-blue-900 shadow-sm hover:bg-blue-50 focus:ring-0">
                    <span className="truncate">{value && value !== 'none'
                        ? QUESTIONNAIRES.find((q) => q.id === value)?.label
                        : "Selecionar Questionário Clínico..."}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar questionário..." className="h-9 border-none focus:ring-0 focus:outline-none" />
                    <CommandList className="max-h-[400px]">
                        <CommandEmpty>Não encontrado.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem value="none" onSelect={() => { onChange('none'); setOpen(false); }}>
                                <span className="font-bold text-slate-400">Nenhum (Apenas Funcional)</span>
                            </CommandItem>
                            {QUESTIONNAIRES_BY_CATEGORY.map((cat) => (
                                <div key={cat.category} className="px-2 py-1.5 border-b last:border-0 border-slate-50">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-2">{cat.category}</div>
                                    {cat.items.map((q) => (
                                        <CommandItem
                                            key={q.id}
                                            value={q.label}
                                            onSelect={() => {
                                                onChange(q.id);
                                                setOpen(false);
                                            }}
                                            className="pl-4 h-8"
                                        >
                                            <Check className={cn("mr-2 h-3.5 w-3.5", value === q.id ? "opacity-100" : "opacity-0")} />
                                            <span className="text-xs">{q.label}</span>
                                        </CommandItem>
                                    ))}
                                </div>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const MedicationCombobox = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={MEDICATIONS_DB} placeholder="Buscar medicamento..." autoFocus={autoFocus} onCommit={onCommit} />;
};

const ExerciseCombobox = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={EXERCISES_DB} placeholder="Buscar exercício..." autoFocus={autoFocus} onCommit={onCommit} />;
};

// Ordem das Seções para Navegação via Tab
const SECTION_ORDER = [
    'hma', 'history', 'map', 'efep', 'sports', 'shoe',
    'static', 'fpi_detail', 'orto', 'dorsal', 'ventral', 'dynamic', 'exams', 'exercises', 'propulsao'
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

            const currentItem = activeEl.closest('[data-value]');
            if (!currentItem) return;

            const currentSectionValue = currentItem.getAttribute('data-value');
            if (!currentSectionValue) return;

            const currentIndex = SECTION_ORDER.indexOf(currentSectionValue);
            if (currentIndex === -1) return;

            const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), div[contenteditable="true"]';
            const focusable = Array.from(currentItem.querySelectorAll(focusableSelector))
                .filter(el => (el as HTMLElement).offsetParent !== null && !((el as HTMLElement).tagName === 'INPUT' && (el as HTMLElement).classList.contains('opacity-0')));

            if (focusable.length === 0) return;

            const firstEl = focusable[0] as HTMLElement;
            const lastEl = focusable[focusable.length - 1] as HTMLElement;

            // --- SHIFT + TAB: VOLTAR SEÇÃO ---
            if (e.shiftKey && activeEl === firstEl && currentIndex > 0) {
                e.preventDefault();
                const prevSection = SECTION_ORDER[currentIndex - 1];
                setOpenSection(prevSection);
                setTimeout(() => {
                    const prevContainer = document.querySelector(`[data-value="${prevSection}"]`);
                    const prevFocusable = prevContainer?.querySelectorAll(focusableSelector);
                    if (prevFocusable && prevFocusable.length > 0) {
                        (prevFocusable[prevFocusable.length - 1] as HTMLElement).focus();
                    }
                }, 150);
            }
            // --- TAB: AVANÇAR SEÇÃO ---
            else if (!e.shiftKey && activeEl === lastEl && currentIndex < SECTION_ORDER.length - 1) {
                e.preventDefault();
                const nextSection = SECTION_ORDER[currentIndex + 1];
                setOpenSection(nextSection);
                setTimeout(() => {
                    const nextContainer = document.querySelector(`[data-value="${nextSection}"]`);
                    const nextFocusable = nextContainer?.querySelectorAll(focusableSelector);
                    if (nextFocusable && nextFocusable.length > 0) {
                        (nextFocusable[0] as HTMLElement).focus();
                    }
                }, 150);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openSection, setOpenSection, formId]);
};

const deepMerge = (target: any, source: any) => {
    if (!source) return target;
    const output = { ...target };
    Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            output[key] = source[key];
        }
    });
    return output;
};

export default function BiomechanicsInsoleForm({ patientId, initialData, onSave, patient, professional, organization, readonly = false, hideHeader = false, hideButtons = false }: { patientId: string, initialData?: any, onSave?: (data: any, isManual?: boolean) => void, patient?: any, professional?: any, organization?: any, readonly?: boolean, hideHeader?: boolean, hideButtons?: boolean }) {
    const isImported = !!initialData?._imported_from_feegow;
    const [activeForm, setActiveForm] = useState("palmilha");
    const [isMounted, setIsMounted] = useState(false);
    const [localProfessional, setLocalProfessional] = useState(professional);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fallback professional info if missing
    useEffect(() => {
        if (!professional) {
            import('@/lib/supabase/client').then(({ createClient }) => {
                const supabase = createClient();
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
                            if (data) setLocalProfessional(data);
                        });
                    }
                });
            });
        } else {
            setLocalProfessional(professional);
        }
    }, [professional]);

    const [isSaving, setIsSaving] = useState(false);
    // Auto-Save
    const debouncedSave = useDebouncedCallback((data) => {
        if (onSave) {
            onSave(data);
        }
    }, 1500);

    // Sync form with initialData when it changes (after saves)
    useEffect(() => {
        if (initialData && isMounted) {
            const currentValues = form.getValues();
            const newValues = deepMerge(defaults, initialData);

            // Only reset if significantly different to avoid flickering while typing
            if (JSON.stringify(currentValues) !== JSON.stringify(newValues)) {
                form.reset(newValues);
            }
        }
    }, [initialData, isMounted]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [openSection, setOpenSection] = useState("hma");
    const [orgSettings, setOrgSettings] = useState<any>(organization);
    const params = useParams();
    const slug = params?.slug as string;
    const [feegowImportOpen, setFeegowImportOpen] = useState(false);
    const [feegowText, setFeegowText] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [customShoes, setCustomShoes] = useState<ShoeModel[]>([]);
    const [isSavingShoe, setIsSavingShoe] = useState(false);

    // Fetch custom shoes on mount
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

    async function handleSaveNewShoe() {
        if (!orgSettings?.id) {
            toast.error("Configurações da organização não carregadas.");
            return;
        }

        const modelName = form.getValues("shoe.model");
        if (!modelName || modelName.trim() === "" || modelName.includes("Selecione")) {
            toast.error("Por favor, digite o nome do modelo de tênis primeiro.");
            return;
        }

        // Split brand and model if possible
        const parts = modelName.split(' ');
        const brand = parts[0];
        const model = parts.slice(1).join(' ') || 'Modelo Desconhecido';

        setIsSavingShoe(true);
        const res = await saveShoeModel({
            brand,
            model,
            weight: Number(form.getValues("shoe.weight") || 0),
            drop: Number(form.getValues("shoe.drop") || 0),
            stackHeight: Number(form.getValues("shoe.stack") || 0),
            minimalismIndex: minIndexResult,
            organization_id: orgSettings.id,
            is_global: true // Master users can make it global
        });
        setIsSavingShoe(false);

        if (res.success) {
            toast.success("Modelo salvo no banco de dados global!");
            // Refresh list
            const updated = await fetchCustomShoes();
            setCustomShoes(updated);
        } else {
            toast.error("Erro ao salvar: " + res.error);
        }
    }

    const ORIENTATIONS = {
        peso: "O peso impacta diretamente no custo metabólico da corrida. Cada 100g extra aumenta em ~1% o oxigênio consumido.",
        drop: "Diferença de altura entre calcanhar e antepé. Drops baixos (0-4mm) favorecem a pisada de meio-pé/antepé.",
        stack: "Espessura total da sola. Espessuras menores que 20mm aumentam o feedback sensorial do pé.",
        estabilidade: "Presença de tecnologias de controle (postes, placas). Quanto mais tecnologias, menor a naturalidade.",
        flex_long: "Avalia a rigidez na região das metatarso-falângicas. Tênis mais flexíveis exigem mais do sistema elástico/muscular.",
        flex_tor: "Capacidade de torção do chassi. Crucial para adaptação do pé a irregularidades do terreno.",
    };

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

    useEffect(() => {
        if (!organization && slug) {
            getOrganizationSettings(slug).then(data => {
                if (data?.org) setOrgSettings(data.org)
            })
        } else if (organization) {
            setOrgSettings(organization);
        }
    }, [slug, organization]);

    // Ativa a Navegação Inteligente
    useAccordionNavigation(openSection, setOpenSection, "palmilha-form-container");

    const defaults = {
        hma: { qp: "", history: "", eva: [0] },
        history: { comorbidities: [], meds: [], treatments: [] },
        anthropometry: { weight: "" },
        sports: [],
        efep: [
            { activity: "", score: "" },
            { activity: "", score: "" },
            { activity: "", score: "" }
        ],
        postural: { navicular: { left: "", right: "" }, shoeSize: "", fpi_left: {}, fpi_right: {} },
        tests: {
            jack: { left: 0, right: 0 }, lunge: { left: "", right: "" },
            thomas: { left: 0, right: 0 }, slr: { left: 0, right: 0 },
            glute_strength: { med_left: 5, med_right: 5, max_left: 5, max_right: 5 },
            ventral: { rotation: { left: "", right: "" }, craig: { left: "", right: "" } },
            ybalance: { legLength: { left: "", right: "" } },
            dfi: [
                { left: 0, right: 0 },
                { left: 0, right: 0 },
                { left: 0, right: 0 }
            ],
            gait_photos: {
                left: { initial: "", mid: "", terminal: "" },
                right: { initial: "", mid: "", terminal: "" }
            },
            single_squat: { pelvic_drop_left: "no", pelvic_drop_right: "no", photo_left: "", photo_right: "" }
        },
        shoe: { injuryType: "none", weight: "", drop: "", stack: "" },
        plan: { orientations: "", exercises: [], followUpDays: [], monitorPain: true, extraQuestionnaire: "none", questionnaires: [], deliveryDate: "" },
        painPoints: [],
        painZones: {}
    };

    const form = useForm({
        mode: "onChange",
        defaultValues: useMemo(() => {
            const base = deepMerge(defaults, initialData);
            // Ensure EFEP has defaults if empty
            if (!base.efep || base.efep.length === 0 || (base.efep.length === 1 && !base.efep[0].activity)) {
                base.efep = defaults.efep;
            }
            return base;
        }, [initialData])
    });

    // Helper to check if a section has data (for gray background)
    const isSectionFilled = (section: string) => {
        const data = form.watch(section as any);
        if (!data) return false;

        if (section === 'hma') return !!(data.qp || data.history || (data.eva && data.eva[0] > 0));
        if (section === 'history') return !!(data.comorbidities?.length > 0 || data.meds?.length > 0);
        if (section === 'map') {
            const points = form.watch('painPoints') || [];
            const zones = form.watch('painZones') || {};
            const hasZones = Object.values(zones).some((z: any) => z.left || z.right);
            return points.length > 0 || hasZones;
        }
        if (section === 'efep') return (data || []).some((f: any) => f.activity);
        if (section === 'sports') return (data || []).length > 0;
        if (section === 'shoe') return !!(data.injuryType !== 'none' || data.weight || data.drop);
        if (section === 'static') return !!(data.navicular?.left || data.navicular?.right);
        if (section === 'fpi_detail') {
            const fpi = form.watch('postural.fpi_left');
            return !!(fpi && Object.keys(fpi).length > 0);
        }
        if (section === 'orto') return !!(data.tests?.jack?.left || data.tests?.lunge?.left);
        if (section === 'dorsal') return !!(data.tests?.slr?.left || data.tests?.thomas?.left);
        return false;
    };

    // Auto-Save Watcher
    useEffect(() => {
        const subscription = form.watch((value) => {
            debouncedSave(value);
        });
        return () => subscription.unsubscribe();
    }, [form.watch, debouncedSave]);

    const handleFeegowImport = () => {
        if (!feegowText.trim()) return;
        try {
            const parsedData = parseFeegowToLegacyForm(feegowText);

            // Re-apply to form using deepMerge or field by field
            const currentValues = form.getValues();
            const merged = deepMerge(currentValues, parsedData);

            form.reset(merged);

            toast.success("Dados do Feegow importados para o formulário atual!");
            setFeegowImportOpen(false);
            setFeegowText("");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar texto do Feegow.");
        }
    };

    const { fields: efepFields, append: appendEfep, remove: removeEfep } = useFieldArray({ control: form.control, name: "efep" });

    // Assessment Modal State
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = React.useState(false);

    // Watch for dynamic rendering
    const selectedLeg = form.watch("functional_tests.ybalance.leg");
    const { fields: painFields, append: appendPain, remove: removePain, update: updatePain } = useFieldArray({ control: form.control, name: "painPoints" });
    const { fields: sportFields, append: appendSport, remove: removeSport } = useFieldArray({ control: form.control, name: "sports" });
    const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({ control: form.control, name: "history.meds" });
    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({ control: form.control, name: "plan.exercises" });

    const weightVal = useWatch({ control: form.control, name: "anthropometry.weight" });
    const sportsVal = useWatch({ control: form.control, name: "sports" });
    // 1. Gasto Calórico (Cálculo Externo)
    const calData = useMemo(() => {
        const res = calculateActivityLevel(Number(weightVal), sportsVal);
        // Adaptador para manter compatibilidade com nomes usados no render (se necessário)
        return { weekly: res.weeklyBurn, minutes: res.totalMinutes, level: res.level, color: res.color, riskText: res.riskText };
    }, [weightVal, JSON.stringify(sportsVal)]);

    // 2. Lógica FPI-6 (Cálculo Externo)
    const fpiLeftVals = useWatch({ control: form.control, name: "postural.fpi_left" });
    const fpiRightVals = useWatch({ control: form.control, name: "postural.fpi_right" });

    const fpiData = useMemo(() => {
        const l = calculateFpiScore(fpiLeftVals);
        const r = calculateFpiScore(fpiRightVals);

        return {
            left: { s: l.score, l: l.status, c: r.color, desc: l.description },
            right: { s: r.score, l: r.status, c: r.color, desc: r.description }
        };
    }, [JSON.stringify(fpiLeftVals), JSON.stringify(fpiRightVals)]);

    // 3. Matemática do Radar - OTIMIZADA COM DEBOUNCE
    const allWatchedValues = useWatch({ control: form.control });
    // Usamos um valor debounced para o cálculo do radar para evitar lags na digitação
    const [debouncedRadarValues, setDebouncedRadarValues] = useState(allWatchedValues);

    // Atualiza o valor do radar apenas a cada 1000ms de inatividade
    const handleRadarDebounce = useDebouncedCallback((vals) => {
        setDebouncedRadarValues(vals);
    }, 1000);

    useEffect(() => {
        handleRadarDebounce(allWatchedValues);
    }, [allWatchedValues, handleRadarDebounce]);

    const radarData = useMemo(() => {
        return calculateRadarData(debouncedRadarValues);
    }, [JSON.stringify(debouncedRadarValues)]);

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

    const minIndexResult = useMemo(() => {
        if (!shoeVals) return 0;
        return calculateMinimalistIndex(shoeVals);
    }, [shoeVals]);

    // Lógica "Invisível" para abrir acordeões automaticamente ao receber foco
    useEffect(() => {
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            // Se o elemento focado está dentro de um AccordionItem
            const accordionItem = target.closest('[data-value]');
            if (accordionItem) {
                const sectionValue = accordionItem.getAttribute('data-value');
                if (sectionValue && sectionValue !== openSection) {
                    setOpenSection(sectionValue);
                    // Scroll suave para garantir que o campo não fique sob o teclado
                    setTimeout(() => {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        return () => document.removeEventListener('focusin', handleFocusIn);
    }, [openSection]);

    if (!isMounted) return null;

    return (
        <div className={cn("flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-32", readonly && "readonly-pbe-form")}>
            {readonly && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                .readonly-pbe-form input, 
                .readonly-pbe-form textarea, 
                .readonly-pbe-form [role="combobox"],
                .readonly-pbe-form button[type="button"]:not(.allow-readonly-btn),
                .readonly-pbe-form .lucide-trash2,
                .readonly-pbe-form .lucide-plus,
                .readonly-pbe-form .lucide-mic {
                    pointer-events: none !important;
                    opacity: 0.6 !important;
                }
                .readonly-pbe-form .AccordionTrigger, 
                .readonly-pbe-form .AccordionTrigger *,
                .readonly-pbe-form .allow-readonly-btn {
                    pointer-events: auto !important;
                    opacity: 1 !important;
                }
            `}} />
            )}

            {readonly && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                        <p className="font-bold text-sm">Prontuário em Modo de Leitura (LGPD)</p>
                        <p className="text-xs opacity-90">Este documento foi finalizado há mais de 24 horas. Edições estão desativadas, mas você pode visualizar e gerar relatórios.</p>
                    </div>
                </div>
            )}

            {/* --- CABEÇALHO --- */}
            {!hideHeader && (
                <div className="w-full space-y-2">
                    <div className="bg-white p-3 border rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                onClick={() => window.location.href = `/dashboard/${slug}/patients/${patientId}`}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Menu className="w-5 h-5" /></div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Formulário Atual</span>
                                <Select value={activeForm} onValueChange={setActiveForm}>
                                    <SelectTrigger className="border-none shadow-none p-0 h-auto font-bold text-lg text-slate-800 focus:ring-0">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom" className="z-[110]">
                                        <SelectItem value="palmilha">Palmilha Biomecânica 2.0</SelectItem>
                                        <SelectItem value="avancada">Avaliação Física Avançada</SelectItem>
                                        <SelectItem value="clinica">Avaliação Clínica Inteligente</SelectItem>
                                        <SelectItem value="mulher">Saúde da Mulher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">


                            <Badge variant="outline" className="hidden sm:flex h-9 justify-center gap-2 px-3 py-1 border-slate-200">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="text-xs font-medium text-slate-600">Salvamento Automático</span>
                            </Badge>

                            <Button
                                type="button"
                                onClick={() => setFeegowImportOpen(true)}
                                variant="outline"
                                className="h-9 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold px-4 rounded-xl flex items-center gap-2"
                            >
                                <Database className="w-4 h-4" />
                                <span className="hidden sm:inline">Sincronizar Feegow</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {
                activeForm === 'palmilha' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
                        <div className="lg:col-span-8 xl:col-span-9 space-y-6" id="palmilha-form-container">
                            <Form {...form}>
                                <form className="space-y-6">
                                    <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* 1. ANAMNESE */}
                                        <AccordionItem
                                            value="hma"
                                            data-value="hma"
                                            className={cn(
                                                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                                                openSection === 'hma' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                                                isSectionFilled('hma') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                                                SECTION_STYLES['hma'].border
                                            )}
                                        >
                                            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left AccordionTrigger">
                                                <div className="flex items-center gap-2 flex-1 text-base">
                                                    <Ear className="h-5 w-5 text-blue-600" />
                                                    <span>Anamnese & Queixa Principal</span>
                                                </div>
                                                {isSectionFilled('hma') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-6">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="space-y-2 flex-1">
                                                        <FormLabel>Queixa Principal (QP)</FormLabel>
                                                        <Input {...form.register('hma.qp')} className="bg-white" placeholder="Motivo principal do comparecimento a clínica..." />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={() => setFeegowImportOpen(true)}
                                                        variant="outline"
                                                        className="mt-6 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold px-4 rounded-xl flex items-center gap-2 h-10 shadow-sm transition-all active:scale-95"
                                                    >
                                                        <Database className="w-4 h-4" />
                                                        Sincronizar Feegow
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    <FormLabel>História da Moléstia Atual (HMA)</FormLabel>
                                                    <AudioTextarea
                                                        value={form.watch('hma.history')}
                                                        onChange={(e) => form.setValue('hma.history', e.target.value)}
                                                        onTranscription={(text) => form.setValue('hma.history', text)}
                                                        placeholder="Registre o histórico completo dos sintomas e mecanismos de lesão do paciente..."
                                                        hideAI={isImported}
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
                                        <AccordionItem
                                            value="history"
                                            data-value="history"
                                            className={cn(
                                                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                                                openSection === 'history' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                                                isSectionFilled('history') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                                                SECTION_STYLES['history'].border
                                            )}
                                        >
                                            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                                                <div className="flex items-center gap-2 flex-1 text-base">
                                                    <Stethoscope className="h-5 w-5 text-green-600" />
                                                    <span>Histórico Clínico</span>
                                                </div>
                                                {isSectionFilled('history') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
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
                                                                                autoFocus={index === medFields.length - 1 && !medName}
                                                                                onCommit={() => document.getElementById(`history.meds.${index}.dose`)?.focus()}
                                                                            />
                                                                        </div>
                                                                        <div className="w-24 space-y-1">
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Dosagem</span>
                                                                            <Input
                                                                                id={`history.meds.${index}.dose`}
                                                                                {...form.register(`history.meds.${index}.dose` as any)}
                                                                                className="bg-white h-9"
                                                                                placeholder="miligramas"
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Tab' && !e.shiftKey) {
                                                                                        e.preventDefault();
                                                                                        document.getElementById('add-med-btn')?.focus();
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                removeMed(index);
                                                                            }}
                                                                            className="focusable-element h-9 w-9 text-slate-400 hover:text-red-500 mb-0.5"
                                                                            tabIndex={-1} // Skip delete on tab
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>

                                                                    {/* Bloco de Informação Farmacológica (Full Width abaixo) */}
                                                                    {description && (
                                                                        <Alert className="bg-blue-50 border-blue-100 py-2 mt-2">
                                                                            <InfoIcon className="h-4 w-4 text-blue-600" />
                                                                            <div className="flex flex-col items-start text-left">
                                                                                <AlertTitle className="text-xs font-bold text-blue-800 mb-0.5">Informação Farmacológica</AlertTitle>
                                                                                <AlertDescription className="text-[10px] text-blue-700 leading-tight">
                                                                                    {description}
                                                                                </AlertDescription>
                                                                            </div>
                                                                        </Alert>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <Button
                                                            id="add-med-btn"
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => appendMed({ name: "", dose: "" })}
                                                            className="focusable-element w-full border-dashed h-10 hover:bg-slate-50 text-slate-500 font-bold text-xs"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 mr-2" /> ADICIONAR MEDICAÇÃO
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* 5. MAPA DA DOR */}
                                        <AccordionItem
                                            value="map"
                                            data-value="map"
                                            className={cn(
                                                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                                                openSection === 'map' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                                                isSectionFilled('map') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                                                SECTION_STYLES['map'].border
                                            )}
                                        >
                                            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                                                <div className="flex items-center gap-2 flex-1 text-base">
                                                    <Target className="h-5 w-5 text-red-500" />
                                                    <span>Mapa de Dor & Sintomas</span>
                                                </div>
                                                {isSectionFilled('map') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
                                            </AccordionTrigger>
                                            <AccordionContent className="p-0">
                                                <div className="bg-slate-50/50 p-4 rounded-b-xl border-t">
                                                    <BodyPainMap
                                                        painPoints={form.watch('painZones') || {}}
                                                        onChange={(val) => form.setValue('painZones', val)}
                                                        customPoints={painFields}
                                                        onCustomPointsChange={(val) => form.setValue('painPoints', val)}
                                                    />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                        {/* 6. FUNCIONALIDADE (EFEP/PSFS) */}
                                        <AccordionItem
                                            value="efep"
                                            data-value="efep"
                                            className={cn(
                                                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                                                openSection === 'efep' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                                                isSectionFilled('efep') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                                                SECTION_STYLES['efep'].border
                                            )}
                                        >
                                            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                                                <div className="flex items-center gap-2 flex-1 text-base">
                                                    <PencilRuler className="h-5 w-5 text-orange-500" />
                                                    <span>Funcionalidade (EFEP) & Questionários</span>
                                                </div>
                                                {isSectionFilled('efep') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-6">
                                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-4">
                                                    <p className="text-[11px] text-blue-700 leading-tight">
                                                        <strong>Instrução:</strong> Selecione até 3 atividades cujo desempenho esteja comprometido.
                                                        (0 = Incapaz de realizar | 10 = Realiza sem dificuldades).
                                                    </p>
                                                </div>

                                                {/* ENVIAR QUESTIONÁRIO - Feature Restaurada */}


                                                {efepFields.map((f, i) => (
                                                    <div key={f.id} className="flex gap-3 items-center mb-3 animate-in slide-in-from-left-2 duration-300">
                                                        <span className="text-xs font-black text-slate-400 w-5">{i + 1}º</span>
                                                        <Input {...form.register(`efep.${i}.activity`)} placeholder={["Ex: Dormir / Repouso", "Ex: Caminhar plano", "Ex: Caminhar terreno irregular", "Ex: Subir escadas"][i] || "Ex: Atividade física..."} className="flex-1 bg-white h-10" />
                                                        <div className="w-24">
                                                            <Input
                                                                type="number"
                                                                {...form.register(`efep.${i}.score`)}
                                                                placeholder="0-10"
                                                                className="text-center font-black h-10 border-blue-200"
                                                                min={0}
                                                                max={10}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === "") {
                                                                        form.setValue(`efep.${i}.score`, "");
                                                                        return;
                                                                    }
                                                                    const parsed = parseInt(val);
                                                                    if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                                                        form.setValue(`efep.${i}.score`, parsed);
                                                                    }
                                                                }}
                                                                onBlur={(e) => {
                                                                    let val = parseInt(e.target.value);
                                                                    if (isNaN(val) || val < 0) val = 0;
                                                                    if (val > 10) val = 10;
                                                                    form.setValue(`efep.${i}.score`, val);
                                                                }}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const result = await Swal.fire({
                                                                    title: 'Tem certeza?',
                                                                    text: "Deseja remover esta atividade funcional?",
                                                                    icon: 'warning',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#3085d6',
                                                                    cancelButtonColor: '#d33',
                                                                    confirmButtonText: 'Sim, remover',
                                                                    cancelButtonText: 'Cancelar'
                                                                });

                                                                if (result.isConfirmed) {
                                                                    removeEfep(i);
                                                                }
                                                            }}
                                                            className="focusable-element text-slate-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                {efepFields.length < 3 && (
                                                    <Button type="button" variant="outline" size="sm" onClick={() => appendEfep({ activity: "", score: "" })} className="focusable-element w-full border-dashed h-12 hover:bg-blue-50 text-blue-600 font-bold">
                                                        <Plus className="w-4 h-4 mr-2" /> ADICIONAR ATIVIDADE FUNCIONAL
                                                    </Button>
                                                )}

                                                {/* [UPDATED] SEÇÃO DE QUESTIONÁRIOS MÚLTIPLOS */}
                                                <div className="pt-4 border-t mt-4 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ClipboardList className="w-4 h-4 text-blue-600" />
                                                            <h4 className="font-bold text-slate-700 text-sm">Questionários Clínicos de Base</h4>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-600 bg-blue-50/50">
                                                            PBE COMPLIANT
                                                        </Badge>
                                                    </div>

                                                    {/* Lista de Questionários já preenchidos */}
                                                    <div className="space-y-2">
                                                        {(form.watch('plan.questionnaires') || []).length > 0 ? (
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {form.watch('plan.questionnaires').map((q: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-xl group transition-all hover:bg-blue-50">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                                                                                <FileText className="h-4 w-4" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-blue-900 leading-none">
                                                                                    {QUESTIONNAIRES.find(item => item.id === q.type)?.label || q.type}
                                                                                </p>
                                                                                <p className="text-[10px] text-blue-500 mt-1 font-bold">Score: {q.score || 'Ver histórico'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                                                            onClick={async (e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                const result = await Swal.fire({
                                                                                    title: 'Remover questionário?',
                                                                                    text: "O questionário será removido deste registro, mas continuará no histórico do paciente.",
                                                                                    icon: 'question',
                                                                                    showCancelButton: true,
                                                                                    confirmButtonColor: '#2563eb',
                                                                                    cancelButtonColor: '#64748b',
                                                                                    confirmButtonText: 'Sim, remover',
                                                                                    cancelButtonText: 'Manter'
                                                                                });

                                                                                if (result.isConfirmed) {
                                                                                    const current = form.getValues('plan.questionnaires') || [];
                                                                                    current.splice(idx, 1);
                                                                                    form.setValue('plan.questionnaires', [...current]);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum questionário adicionado</p>
                                                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Selecione uma opção abaixo para iniciar</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <div className="flex-1">
                                                            <ExtraQuestionnaireSelector
                                                                value={form.watch("plan.extraQuestionnaire")}
                                                                onChange={(v) => form.setValue("plan.extraQuestionnaire", v)}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            disabled={!form.watch("plan.extraQuestionnaire") || form.watch("plan.extraQuestionnaire") === 'none'}
                                                            onClick={() => setIsAssessmentModalOpen(true)}
                                                            size="sm"
                                                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-9 font-bold text-[10px] tracking-wider rounded-lg shadow-md shadow-blue-900/10 transition-all active:scale-95"
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" /> ADICIONAR
                                                        </Button>
                                                    </div>

                                                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3">
                                                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                                                            <strong>Recomendação:</strong> Utilize o questionário PSFS para monitorar funções específicas e pelo menos um questionário regional (ex: LEFS para membros inferiores).
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mx-4 mb-4 p-4 bg-purple-50 border border-purple-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CalendarClock className="w-5 h-5 text-purple-600" />
                                                        <h4 className="font-bold text-purple-900 text-sm">Automação de Follow-up & Monitoramento</h4>
                                                    </div>
                                                    <p className="text-xs text-purple-700 mb-4 leading-relaxed">
                                                        O paciente receberá um <strong>Link Único Inteligente</strong> combinando todos os itens selecionados abaixo (Funcionalidade, Dor e Questionários Extras), garantindo maior taxa de resposta.
                                                    </p>

                                                    <div className="space-y-4">
                                                        {/* 1. Régua de Tempo */}
                                                        <div className="space-y-2">
                                                            <FormLabel className="text-[10px] font-bold text-purple-800 uppercase block">Régua de Envio (Múltipla Escolha)</FormLabel>
                                                            <div className="flex flex-wrap gap-2">
                                                                {[
                                                                    { l: "15 Dias", v: "15" },
                                                                    { l: "30 Dias", v: "30" },
                                                                    { l: "45 Dias", v: "45" },
                                                                    { l: "60 Dias", v: "60" },
                                                                    { l: "90 Dias", v: "90" }
                                                                ].map((opt) => {
                                                                    const current = form.watch('plan.followUpDays') || [];
                                                                    const isChecked = current.includes(opt.v);
                                                                    return (
                                                                        <label key={opt.v} className={cn(
                                                                            "flex items-center gap-2 border px-3 py-2 rounded-lg cursor-pointer transition-all",
                                                                            isChecked ? "bg-purple-600 border-purple-600 text-white shadow-md" : "bg-white border-purple-200 text-purple-900 hover:bg-purple-50"
                                                                        )}>
                                                                            <Checkbox
                                                                                className={cn("data-[state=checked]:bg-white data-[state=checked]:text-purple-600 border-purple-300", isChecked && "border-white")}
                                                                                checked={isChecked}
                                                                                onCheckedChange={(checked) => {
                                                                                    const novo = checked
                                                                                        ? [...current, opt.v]
                                                                                        : current.filter((i: string) => i !== opt.v);
                                                                                    form.setValue('plan.followUpDays', novo);
                                                                                }}
                                                                            />
                                                                            <span className="text-xs font-bold">{opt.l}</span>
                                                                        </label>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* 2. Conteúdo do Monitoramento */}
                                                            <div className="space-y-2 bg-white p-3 rounded border border-purple-100 h-full">
                                                                <FormLabel className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-2 mb-2">
                                                                    <Activity className="w-3 h-3" /> O que Avaliar?
                                                                </FormLabel>

                                                                <div className="flex flex-col gap-2">
                                                                    {/* Funcionalidade (Sempre ON) */}
                                                                    <div className="flex items-center gap-2 opacity-75">
                                                                        <Checkbox checked disabled className="border-purple-300" />
                                                                        <span className="text-xs text-purple-900 font-medium">Funcionalidade (As 3 atividades acima)</span>
                                                                    </div>

                                                                    {/* Dor (EVA) */}
                                                                    <div className="flex items-center gap-2">
                                                                        <Checkbox
                                                                            defaultChecked
                                                                            onCheckedChange={(c) => form.setValue('plan.monitorPain', c)}
                                                                            className="data-[state=checked]:bg-purple-600 border-purple-300"
                                                                        />
                                                                        <span className="text-xs text-purple-900 font-medium">Nível de Dor (Escala EVA)</span>
                                                                    </div>
                                                                </div>
                                                            </div>


                                                        </div>

                                                        {/* 4. Canal */}
                                                        <div className="flex justify-end items-center gap-2 pt-2 border-t border-purple-100">
                                                            <span className="text-[10px] font-bold text-purple-800 uppercase">Enviar por:</span>
                                                            <Select defaultValue="whatsapp">
                                                                <SelectTrigger className="bg-white border-purple-200 text-purple-900 h-8 font-medium w-[180px] text-xs">
                                                                    <SelectValue placeholder="WhatsApp" />
                                                                </SelectTrigger>
                                                                <SelectContent position="popper" side="bottom" className="z-[110]">
                                                                    <SelectItem value="whatsapp">WhatsApp (Automático)</SelectItem>
                                                                    <SelectItem value="email">E-mail</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* 4. ROTINA DESPORTIVA (Lógica IPAQ) */}
                                        <AccordionItem
                                            value="sports"
                                            data-value="sports"
                                            className={cn(
                                                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                                                openSection === 'sports' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                                                isSectionFilled('sports') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                                                SECTION_STYLES['sports'].border
                                            )}
                                        >
                                            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                                                <div className="flex items-center gap-2 flex-1 text-base">
                                                    <Zap className="h-5 w-5 text-yellow-500" />
                                                    <span>Rotina Desportiva</span>
                                                </div>
                                                {isSectionFilled('sports') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
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
                                                    <div key={field.id} className="flex flex-col md:flex-row gap-3 md:items-end border-b pb-4 animate-in fade-in duration-300">
                                                        <div className="flex-1">
                                                            <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Modalidade</FormLabel>
                                                            <SportCombobox
                                                                value={form.watch(`sports.${index}.type`)}
                                                                onChange={(val) => form.setValue(`sports.${index}.type` as any, val)}
                                                                options={Object.keys(KCAL_TABLE)}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 md:flex gap-3">
                                                            <div className="flex-1 md:w-[90px]">
                                                                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Frequência</FormLabel>
                                                                <Input type="number" {...form.register(`sports.${index}.freq` as any)} placeholder="Dias/Sem" className="h-9" />
                                                            </div>
                                                            <div className="flex-1 md:w-[90px]">
                                                                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Duração</FormLabel>
                                                                <Input type="number" {...form.register(`sports.${index}.duration` as any)} placeholder="Min/Dia" className="h-9" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end md:shrink-0 md:pb-0.5">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    removeSport(index);
                                                                }}
                                                                className="focusable-element h-9 w-9 text-red-500 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <Button type="button" variant="outline" size="sm" onClick={() => appendSport({ type: "", freq: "", duration: "" })} className="focusable-element w-full border-dashed py-5 hover:bg-slate-50 transition-all font-bold text-slate-600">
                                                    <Plus className="w-4 h-4 mr-2" /> ADICIONAR MODALIDADE
                                                </Button>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* 13. CALÇADOS & PRESCRIÇÃO (Ref: PDF p.1 e p.4) */}
                                        <AccordionItem
                                            value="shoe"
                                            data-value="shoe"
                                            className={cn(
                                                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                                                openSection === 'shoe' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                                                isSectionFilled('shoe') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                                                SECTION_STYLES['shoe'].border
                                            )}
                                        >
                                            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                                                <div className="flex items-center gap-2 flex-1 text-base">
                                                    <Footprints className="h-5 w-5 text-blue-500 group-hover:animate-bounce" />
                                                    <span>Tênis (Recomendação Técnica)</span>
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
                                                    {isSectionFilled('shoe') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5">PREENCHIDO</Badge>}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-6">
                                                {/* BUSCA DE CALÇADOS DATABSE */}
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

                                                {/* 1. SELEÇÃO DA PATOLOGIA */}
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


                                                {/* 3. CRITÉRIOS DE ESTADO E OBJETIVO */}
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

                                                {/* 2. BANNER DE DIRETRIZ (VISUAL CORRIGIDO: Texto amplo e Ícone lateral moderno) */}
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

                                                {/* 4. DADOS TÉCNICOS DO CALÇADO (FOTO 3 RESTAURADA) */}
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

                                                    {/* SLIDERS DE FLEXIBILIDADE E ESTABILIDADE (FOTO 3 VOLTOU!) */}
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

                                                {/* 5. ÍNDICE MINIMALISTA FINAL */}
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
                                                                className="h-7 text-[9px] font-black uppercase tracking-tighter bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all gap-1.5"
                                                                onClick={handleSaveNewShoe}
                                                                disabled={isSavingShoe}
                                                            >
                                                                {isSavingShoe ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                                                                Salvar no Banco Global
                                                            </Button>
                                                        </div>
                                                        <Badge className={cn("px-4 py-1.5 font-bold text-[11px] w-full sm:w-auto justify-center shadow-lg",
                                                            minIndexResult > 70 ? "bg-green-500 shadow-green-500/20" :
                                                                minIndexResult < 30 ? "bg-red-500 shadow-red-500/20" :
                                                                    "bg-blue-500 shadow-blue-500/20")}>
                                                            {minIndexResult > 70 ? "MINIMALISTA" : minIndexResult < 30 ? "MAXIMALISTA" : "TRANSIÇÃO"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* 2. ESTÁTICA */}
                                        <AccordionItem value="static" data-value="static" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'static' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['static'].border)}>
                                            <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                                <Camera className="h-5 w-5 text-purple-600" />
                                                Avaliação Estática
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-6">


                                                {/* Grid de Inputs Principais */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* 2. Teste do Catálogo */}
                                                    <div className="space-y-1">
                                                        <FormLabel>Teste do Catálogo</FormLabel>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="E" type="number" {...form.register("postural.teste_catalogo.left")} />
                                                            <Input placeholder="D" type="number" {...form.register("postural.teste_catalogo.right")} />
                                                        </div>
                                                    </div>

                                                    {/* 1. Naviculômetro com Lógica de Referência (Brain) */}
                                                    <div className="space-y-1">
                                                        <FormLabel>Naviculômetro (mm)</FormLabel>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {/* Lado Esquerdo */}
                                                            <div>
                                                                <Input placeholder="E" type="number" {...form.register("postural.navicular.left")} />
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
                                                                <Input placeholder="D" type="number" {...form.register("postural.navicular.right")} />
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
                                        <AccordionItem value="fpi_detail" data-value="fpi_detail" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'fpi_detail' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['fpi_detail'].border)}>
                                            <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                                <Ruler className="h-5 w-5 text-indigo-500" />
                                                Foot Posture Index (FPI-6)
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* PÉ ESQUERDO */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 border-b pb-2">
                                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                            <h4 className="text-xs font-black uppercase text-slate-500">Lado Esquerdo</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {[
                                                                { id: "talus", label: "Cabeça do Tálus", full: "Palpação da Cabeça do Tálus" },
                                                                { id: "curves", label: "Maléolos", full: "Curvaturas Supra/Infra Maleolares" },
                                                                { id: "calc", label: "Calcâneo", full: "Inversão/Eversão do Calcâneo" },
                                                                { id: "tnj", label: "Navicular", full: "Articulação Talo-Navicular" },
                                                                { id: "arch", label: "Arco", full: "Arco Medial" },
                                                                { id: "abd", label: "Dedos", full: "Abdução/Adução do Antepé" }
                                                            ].map((item) => (
                                                                <div key={item.id} className="flex items-center justify-between gap-4">
                                                                    <label className="text-[10px] font-bold text-slate-600 uppercase leading-tight flex-1">
                                                                        <span className="md:hidden">{item.label}</span>
                                                                        <span className="hidden md:inline">{item.full}</span>
                                                                    </label>
                                                                    <Input
                                                                        type="number"
                                                                        {...form.register(`postural.fpi_left.${item.id}` as any)}
                                                                        className="w-16 h-8 text-center font-bold bg-white"
                                                                        placeholder="0"
                                                                        min={-2}
                                                                        max={2}
                                                                        onBlur={(e) => {
                                                                            let val = parseInt(e.target.value);
                                                                            if (isNaN(val)) val = 0;
                                                                            if (val > 2) val = 2;
                                                                            if (val < -2) val = -2;
                                                                            form.setValue(`postural.fpi_left.${item.id}`, val, { shouldValidate: true, shouldDirty: true });
                                                                            e.target.value = val.toString();
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <Badge className={cn("w-full h-10 justify-center text-xs font-black shadow-inner", fpiData.left.c)}>
                                                            <span className="md:inline hidden mr-1">TOTAL E:</span> {fpiData.left.s} ({fpiData.left.l})
                                                        </Badge>
                                                    </div>

                                                    {/* PÉ DIREITO */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 border-b pb-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-600" />
                                                            <h4 className="text-xs font-black uppercase text-slate-500">Lado Direito</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {[
                                                                { id: "talus", label: "Cabeça do Tálus", full: "Palpação da Cabeça do Tálus" },
                                                                { id: "curves", label: "Maléolos", full: "Curvaturas Supra/Infra Maleolares" },
                                                                { id: "calc", label: "Calcâneo", full: "Inversão/Eversão do Calcâneo" },
                                                                { id: "tnj", label: "Navicular", full: "Articulação Talo-Navicular" },
                                                                { id: "arch", label: "Arco", full: "Arco Medial" },
                                                                { id: "abd", label: "Dedos", full: "Abdução/Adução do Antepé" }
                                                            ].map((item) => (
                                                                <div key={item.id} className="flex items-center justify-between gap-4">
                                                                    <label className="text-[10px] font-bold text-slate-600 uppercase leading-tight flex-1">
                                                                        <span className="md:hidden">{item.label}</span>
                                                                        <span className="hidden md:inline">{item.full}</span>
                                                                    </label>
                                                                    <Input
                                                                        type="number"
                                                                        {...form.register(`postural.fpi_right.${item.id}` as any)}
                                                                        className="w-16 h-8 text-center font-bold bg-white"
                                                                        placeholder="0"
                                                                        min={-2}
                                                                        max={2}
                                                                        onBlur={(e) => {
                                                                            let val = parseInt(e.target.value);
                                                                            if (isNaN(val)) val = 0;
                                                                            if (val > 2) val = 2;
                                                                            if (val < -2) val = -2;
                                                                            form.setValue(`postural.fpi_right.${item.id}`, val, { shouldValidate: true, shouldDirty: true });
                                                                            e.target.value = val.toString();
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <Badge className={cn("w-full h-10 justify-center text-xs font-black shadow-inner", fpiData.right.c)}>
                                                            <span className="md:inline hidden mr-1">TOTAL D:</span> {fpiData.right.s} ({fpiData.right.l})
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                        {/* 8. ORTOSTATISMO - TESTES FUNCIONAIS (Ref: PDF p.4) */}
                                        <AccordionItem value="orto" data-value="orto" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'orto' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['orto'].border)}>
                                            <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline flex gap-2 items-center">
                                                <Flame className="h-5 w-5 text-sky-600" />
                                                Testes Funcionais (Ortostatismo)
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 space-y-8">

                                                {/* Teste de Jack - Referência: Hall & Brody */}
                                                <div className="p-4 bg-slate-50 rounded border">
                                                    <h4 className="font-bold text-sm mb-4">Teste de Jack</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div>
                                                            <FormLabel className="text-blue-600 font-bold">Esquerdo</FormLabel>
                                                            <BipolarSlider value={Number(form.watch("tests.jack.left"))} onChange={(v) => form.setValue("tests.jack.left", v)} />
                                                            <ReferenceStatus type="jack" value={form.watch("tests.jack.left")} />
                                                        </div>
                                                        <div>
                                                            <FormLabel className="text-green-600 font-bold">Direito</FormLabel>
                                                            <BipolarSlider value={Number(form.watch("tests.jack.right"))} onChange={(v) => form.setValue("tests.jack.right", v)} />
                                                            <ReferenceStatus type="jack" value={form.watch("tests.jack.right")} />
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Lunge Teste e Comprimento de Perna */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <FormLabel>Lunge Teste (º)</FormLabel>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {/* LADO ESQUERDO */}
                                                            <div>
                                                                <Input placeholder="E" type="number" {...form.register("tests.lunge.left")} />
                                                                <ReferenceStatus type="lunge" value={form.watch("tests.lunge.left")} />
                                                            </div>

                                                            {/* LADO DIREITO */}
                                                            <div>
                                                                <Input placeholder="D" type="number" {...form.register("tests.lunge.right")} />
                                                                <ReferenceStatus type="lunge" value={form.watch("tests.lunge.right")} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <FormLabel>Comprimento Membro Inferior (cm)</FormLabel>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="E" type="number" {...form.register("tests.ybalance.legLength.left")} />
                                                            <Input placeholder="D" type="number" {...form.register("tests.ybalance.legLength.right")} />
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
                                                                {/* Desktop Table */}
                                                                <div className="hidden md:block overflow-x-auto">
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
                                                                </div>

                                                                {/* Mobile View: Left then Right */}
                                                                <div className="md:hidden space-y-6">
                                                                    {['left', 'right'].map(side => (
                                                                        <div key={side} className={cn("p-4 rounded-lg border", side === 'left' ? "border-blue-100 bg-blue-50/30" : "border-green-100 bg-green-50/30")}>
                                                                            <h5 className={cn("font-bold text-xs uppercase mb-3 flex items-center gap-2", side === 'left' ? "text-blue-700" : "text-green-700")}>
                                                                                <div className={cn("w-2 h-2 rounded-full", side === 'left' ? "bg-blue-600" : "bg-green-600")} />
                                                                                {side === 'left' ? "Pé Esquerdo" : "Pé Direito"}
                                                                            </h5>
                                                                            <div className="space-y-4">
                                                                                {directions.map(dir => {
                                                                                    const avg = getAvg(side, dir.key);
                                                                                    const pct = getPct(avg, side);

                                                                                    return (
                                                                                        <div key={dir.key} className="space-y-2">
                                                                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                                                                                                <span>{dir.label}</span>
                                                                                                <span className="text-slate-400">Média: <span className="text-slate-900">{Math.round(avg) || "-"} cm</span></span>
                                                                                            </div>
                                                                                            <div className="flex gap-2 items-center">
                                                                                                {[1, 2, 3].map(t => (
                                                                                                    <Input
                                                                                                        key={t}
                                                                                                        className="h-8 flex-1 text-center font-bold px-1"
                                                                                                        type="number"
                                                                                                        placeholder={`T${t}`}
                                                                                                        {...form.register(`tests.ybalance.${dir.key}.${side}.t${t}` as any)}
                                                                                                    />
                                                                                                ))}
                                                                                                <div className="w-10 text-center font-black text-blue-600 text-[10px]">{pct ? pct + "%" : "-"}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

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
                                        <AccordionItem value="dorsal" data-value="dorsal" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'dorsal' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['dorsal'].border)}>
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
                                                                <Input placeholder="Esquerdo" type="number" {...form.register("tests.thomas.left", { valueAsNumber: true })} className="h-10 font-bold text-center" />
                                                                <ReferenceStatus type="thomas" value={form.watch("tests.thomas.left")} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Input placeholder="Direito" type="number" {...form.register("tests.thomas.right", { valueAsNumber: true })} className="h-10 font-bold text-center" />
                                                                <ReferenceStatus type="thomas" value={form.watch("tests.thomas.right")} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Isquiosurais - Ref PDF: 132º */}
                                                    <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                        <FormLabel className="text-xs font-black uppercase text-blue-800">Flexibilidade de Isquiosurais (º)</FormLabel>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Input placeholder="Esquerdo" type="number" {...form.register("tests.slr.left", { valueAsNumber: true })} className="h-10 font-bold text-center" />
                                                                <ReferenceStatus type="slr" value={form.watch("tests.slr.left")} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Input placeholder="Direito" type="number" {...form.register("tests.slr.right", { valueAsNumber: true })} className="h-10 font-bold text-center" />
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
                                        <AccordionItem value="ventral" data-value="ventral" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'ventral' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['ventral'].border)}>
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
                                        <AccordionItem value="baropo" data-value="baropo" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'baropo' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['baropo'].border)}>
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
                                        <AccordionItem value="dynamic" data-value="dynamic" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'dynamic' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['dynamic'].border)}>
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
                                                                {["RC", "AM", "FI"].map((f, i) => (
                                                                    <tr key={i} className="border-b">
                                                                        <td className="p-2 font-bold text-slate-600">{f}</td>
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
                                                        {isMounted && (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart
                                                                    data={[
                                                                        { name: 'RC', e: Number(form.watch("tests.dfi.0.left")) || 0, d: Number(form.watch("tests.dfi.0.right")) || 0, ref: 1 },
                                                                        { name: 'AM', e: Number(form.watch("tests.dfi.1.left")) || 0, d: Number(form.watch("tests.dfi.1.right")) || 0, ref: -2 },
                                                                        { name: 'FI', e: Number(form.watch("tests.dfi.2.left")) || 0, d: Number(form.watch("tests.dfi.2.right")) || 0, ref: 2 }
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
                                                        )}
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
                                                                        <SelectContent position="popper" side="bottom" className="z-[110]">
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
                                                                        <SelectContent position="popper" side="bottom" className="z-[110]">
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
                                                                        <SelectContent position="popper" side="bottom" className="z-[110]">
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
                                                                <label className="font-semibold text-xs mb-1 block">Agachamento Unipodal lado Esquerdo</label>
                                                                <PasteUploadZone
                                                                    value={form.watch("tests.single_squat.photo_left")}
                                                                    onChange={(v) => form.setValue("tests.single_squat.photo_left", v)}
                                                                    className="aspect-[3/4] w-48 object-cover mx-auto"

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
                                                                        <SelectContent position="popper" side="bottom" className="z-[110]">
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
                                                                        <SelectContent position="popper" side="bottom" className="z-[110]">
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
                                                                        <SelectContent position="popper" side="bottom" className="z-[110]">
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
                                                                <label className="font-semibold text-xs mb-1 block">Agachamento Unipodal lado Direito</label>
                                                                <PasteUploadZone
                                                                    value={form.watch("tests.single_squat.photo_right")}
                                                                    onChange={(v) => form.setValue("tests.single_squat.photo_right", v)}
                                                                    className="aspect-[3/4] w-48 object-cover mx-auto"

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
                                                                className="aspect-[3/4] w-full object-cover"

                                                            />
                                                            <PasteUploadZone
                                                                label="Apoio Médio"
                                                                value={form.watch("tests.gait_photos.left.mid")}
                                                                onChange={(v) => form.setValue("tests.gait_photos.left.mid", v)}
                                                                className="aspect-[3/4] w-full object-cover"

                                                            />
                                                            <PasteUploadZone
                                                                label="Fase de Impulsão"
                                                                value={form.watch("tests.gait_photos.left.terminal")}
                                                                onChange={(v) => form.setValue("tests.gait_photos.left.terminal", v)}
                                                                className="aspect-[3/4] w-full object-cover"

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
                                                                className="aspect-[3/4] w-full object-cover"

                                                            />
                                                            <PasteUploadZone
                                                                label="Apoio Médio"
                                                                value={form.watch("tests.gait_photos.right.mid")}
                                                                onChange={(v) => form.setValue("tests.gait_photos.right.mid", v)}
                                                                className="aspect-[3/4] w-full object-cover"

                                                            />
                                                            <PasteUploadZone
                                                                label="Fase de Impulsão"
                                                                value={form.watch("tests.gait_photos.right.terminal")}
                                                                onChange={(v) => form.setValue("tests.gait_photos.right.terminal", v)}
                                                                className="aspect-[3/4] w-full object-cover"

                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>


                                        {/* 13. EXAMES E PLANO (COM MIC FUNCIONAL) */}
                                        <AccordionItem value="exams" data-value="exams" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'exams' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['exams'].border)}>
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
                                                        hideAI={isImported}
                                                    />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* 14. PLANO TERAPÊUTICO & EXERCÍCIOS (Ref: PDF p.4) */}
                                        <AccordionItem value="exercises" data-value="exercises" className={cn("border rounded-xl bg-card border-l-4 transition-all duration-300", openSection === 'exercises' ? 'col-span-1 md:col-span-2' : 'col-span-1', SECTION_STYLES['exercises'].border)}>
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
                                                                    <div className="col-span-12 md:col-span-5 space-y-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nome do Exercício</span>
                                                                        <ExerciseCombobox
                                                                            value={form.watch(`plan.exercises.${index}.name` as any)}
                                                                            onChange={(val) => form.setValue(`plan.exercises.${index}.name` as any, val)}
                                                                            autoFocus={index === exerciseFields.length - 1 && !form.getValues(`plan.exercises.${index}.name` as any)}
                                                                            onCommit={() => document.getElementById(`plan.exercises.${index}.sets`)?.focus()}
                                                                        />
                                                                    </div>

                                                                    {/* Séries com Tooltip */}
                                                                    <div className="col-span-3 md:col-span-2 space-y-1">
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
                                                                            id={`plan.exercises.${index}.sets`}
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
                                                                    <div className="col-span-3 md:col-span-2 space-y-1">
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
                                                                    <div className="col-span-12 md:col-span-1 flex md:justify-end">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                removeExercise(index);
                                                                            }}
                                                                            className="focusable-element text-slate-400 hover:text-red-500 hover:bg-red-50 w-full md:w-auto"
                                                                            tabIndex={-1}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                                                                            <span className="md:hidden">Remover</span>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            id="add-exercise-btn"
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => appendExercise({ name: "" })}
                                                            className="focusable-element w-full border-dashed h-10 hover:bg-slate-50 text-slate-500 font-bold text-xs"
                                                        >
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
                                                        hideAI={isImported}
                                                    />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* PEDIDO PALMILHA PROPULSÃO */}
                                        <PropulsaoAccordionItem
                                            value="propulsao"
                                            form={form}
                                            data={form.getValues()}
                                            patientId={patientId}
                                            patientName={form.watch("patient.name") || "Paciente"}
                                            patientEmail={form.watch("patient.email")}
                                            patientPhone={form.watch("patient.phone")}
                                            openSection={openSection}
                                        />
                                    </Accordion>
                                </form>

                                <RapidAssessmentModal
                                    isOpen={isAssessmentModalOpen}
                                    onClose={() => setIsAssessmentModalOpen(false)}
                                    assessmentType={form.watch("plan.extraQuestionnaire")}
                                    onSave={async (modalData: any) => {
                                        const type = modalData.type || form.getValues("plan.extraQuestionnaire");
                                        const current = form.getValues("plan.questionnaires") || [];

                                        // Extract data correctly from RapidAssessmentModal response
                                        // modalData is { type, answers, score }
                                        const answers = modalData.answers || modalData;
                                        const score = modalData.score || 0;

                                        const newEntry = {
                                            type,
                                            data: answers,
                                            score: typeof score === 'object' ? (score.total || score.score) : score,
                                            savedAt: new Date().toISOString()
                                        };

                                        form.setValue("plan.questionnaires", [...current, newEntry]);

                                        // PERSIST TO DATABASE (patient_assessments)
                                        try {
                                            if (!patientId || patientId === 'sandbox') {
                                                console.log("[BiomechanicsInsoleForm] Sandbox mode or invalid ID, skipping history sync.");
                                                return;
                                            }
                                            const { createAssessment } = await import('@/app/dashboard/[slug]/patients/actions/assessments');
                                            const res: any = await createAssessment(
                                                patientId as string,
                                                type,
                                                answers,
                                                typeof score === 'object' ? score : { total: score },
                                                QUESTIONNAIRES.find(q => q.id === type)?.label,
                                                slug
                                            );

                                            if (res?.success) {
                                                toast.success("Avaliação sincronizada com o prontuário!");
                                            } else {
                                                throw new Error(res?.msg || "Erro na resposta do servidor");
                                            }
                                        } catch (e: any) {
                                            console.error("Failed to sync questionnaire:", e);
                                            toast.error(
                                                `Salvo localmente, erro ao sincronizar histórico: ${e.message}`,
                                                { duration: 6000 }
                                            );
                                        }

                                        form.setValue("plan.extraQuestionnaire", "none");
                                    }}
                                />
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


                            </div>
                        </div>
                    </div>
                )
            }

            {
                activeForm === 'avancada' && (
                    <div className="animate-in fade-in duration-500">
                        <PhysicalAssessmentForm
                            patientId={patientId}
                            readOnly={readonly}
                            initialData={form.getValues()}
                            onSave={onSave}
                        />
                    </div>
                )
            }

            {
                activeForm === 'clinica' && (
                    <div className="animate-in fade-in duration-500">
                        <SmartAssessmentForm
                            patientId={patientId}
                            readOnly={readonly}
                            initialData={form.getValues()}
                            onSave={onSave}
                        />
                    </div>
                )
            }

            {
                activeForm === 'mulher' && (
                    <div className="animate-in fade-in duration-500">
                        <WomensHealthForm
                            patientId={patientId}
                            readOnly={readonly}
                            initialData={form.getValues()}
                            onSave={onSave}
                        />
                    </div>
                )
            }
            {/* --- COMPONENTES AUXILIARES PARA O RELATÓRIO --- */}
            {previewOpen && (
                <BiomechanicsReport
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    form={form}
                    shoeRec={shoeRecommendations}
                    minIndex={minIndexResult}
                    organizationName={orgSettings?.name}
                    organization={orgSettings}
                    patient={patient}
                    professional={localProfessional ? {
                        ...localProfessional,
                        name: localProfessional.full_name || localProfessional.name,
                        council_number: localProfessional.council_number || localProfessional.crefito
                    } : null}
                    data={{
                        ...form.getValues(),
                        ...form.getValues("tests"), // Prioritize/Flatten tests to root for report compatibility
                        gait_photos: form.getValues("tests.gait_photos") || form.getValues().gait_photos,
                        single_squat: form.getValues("tests.single_squat") || form.getValues().single_squat
                    }}
                />
            )}

            {/* BOTÕES DE AÇÃO FLUTUANTES */}
            {!hideButtons && (
                <div className="fixed bottom-8 right-8 flex gap-3 z-50 print:hidden">
                    {!readonly && (
                        <Button
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    const result = onSave?.(form.getValues(), true);
                                    // Handle both sync and async onSave
                                    if (result instanceof Promise) {
                                        await result;
                                    }
                                    if (patientId !== 'sandbox') {
                                        toast.success("Dados salvos com sucesso!");
                                    }
                                } catch (e) {
                                    console.error("Save error:", e);
                                    toast.error("Erro ao salvar dados.");
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            variant="outline"
                            disabled={isSaving}
                            className="bg-white hover:bg-slate-50 border-slate-200 shadow-xl font-bold gap-2 text-slate-700 h-11 px-6 rounded-full"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-blue-600" />}
                            {isSaving ? "Salvando..." : "Salvar"}
                        </Button>
                    )}

                    <Button
                        onClick={() => setPreviewOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-xl h-11 px-8 rounded-full allow-readonly-btn"
                    >
                        <Eye className="w-4 h-4 text-blue-400" />
                        Gerar Relatório PDF
                    </Button>

                    {!readonly && (
                        <Button
                            type="button"
                            onClick={() => setFeegowImportOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-xl h-11 px-6 rounded-full transition-all active:scale-95"
                        >
                            <Zap className="w-4 h-4 fill-current" />
                            Importar Feegow
                        </Button>
                    )}
                </div>
            )}
            {/* FEEGOW IMPORT DIALOG */}
            <Dialog open={feegowImportOpen} onOpenChange={setFeegowImportOpen}>
                <DialogContent className="max-w-2xl rounded-[40px] p-8 border-none shadow-2xl bg-white z-[200]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                            </div>
                            Sincronizar Feegow (Legado)
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold">
                            Cole o texto completo do prontuário do Feegow. Nosso motor irá identificar e preencher as variáveis do exame físico automaticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <Textarea
                            placeholder="Cole aqui o texto do Feegow..."
                            className="min-h-[300px] bg-slate-50 border-slate-100 rounded-3xl p-6 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all resize-none shadow-inner"
                            value={feegowText}
                            onChange={(e) => setFeegowText(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setFeegowImportOpen(false)}
                            className="rounded-2xl font-bold text-slate-500 hover:bg-slate-50 h-14 px-8"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleFeegowImport}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl px-10 h-14 shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            PROCESSAR AGORA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SportCombobox({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-9 font-normal text-left px-3 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <span className="truncate">{value || "Selecione..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 z-[120]" align="start" position="popper" side="bottom" sideOffset={8}>
                <Command>
                    <CommandInput placeholder="Buscar modalidade..." />
                    <CommandList>
                        <CommandEmpty>Nenhuma modalidade encontrada.</CommandEmpty>
                        <CommandGroup>
                            {options.map((sport) => (
                                <CommandItem
                                    key={sport}
                                    value={sport}
                                    onSelect={(currentValue) => {
                                        onChange(sport)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === sport ? "opacity-100" : "opacity-0")} />
                                    {sport}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}