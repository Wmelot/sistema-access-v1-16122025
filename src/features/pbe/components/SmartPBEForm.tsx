"use client";

import { useForm, UseFormReturn, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useCallback, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    Plus, Trash2, ClipboardList, CalendarClock, Info, PencilRuler,
    ChevronsUpDown, Check, Stethoscope, Info as InfoIcon,
    Loader2, Save, FileText, Activity, Microscope, ArrowLeft, ArrowRight,
    Search, Bot, Target, AlertTriangle, ShieldCheck, Thermometer, ChevronDown
} from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Schema imports
import { SmartAssessmentSchema, SmartAssessmentValues } from "../schemas/smart-assessment-schema";

// Region-specific components
import { LumbarSpineForm } from "./regions/spine-lumbar-form";
import { KneeForm } from "./regions/knee-form";
import { ShoulderForm } from "./regions/shoulder-form";
import { AnkleForm } from "./regions/ankle-form";
import { HipForm } from "./regions/hip-form";
import { CervicalSpineForm } from "./regions/spine-cervical-form";
import { ElbowHandForm } from "./regions/elbow-hand-form";

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
            { id: "fpi6", label: "FPI-6 (Postura do Pé)" }
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

const REGION_OPTIONS = [
    { id: "spine_lumbar", label: "Coluna Lombar" },
    { id: "spine_cervical", label: "Coluna Cervical" },
    { id: "shoulder", label: "Ombro" },
    { id: "knee", label: "Joelho" },
    { id: "ankle_foot", label: "Tornozelo e Pé" },
    { id: "hip", label: "Quadril" },
    { id: "elbow_hand", label: "Cotovelo/Punho/Mão" },
];

function ComboboxSelector({ value, onChange, database, placeholder = "Buscar...", autoFocus, onCommit }: { value: string, onChange: (v: string) => void, database: string[], placeholder?: string, autoFocus?: boolean, onCommit?: () => void }) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const filtered = database.filter(item =>
        item.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-11 bg-slate-50 border-slate-200 rounded-xl"
                >
                    {value || placeholder}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={placeholder}
                        value={searchValue}
                        onValueChange={setSearchValue}
                        autoFocus={autoFocus}
                    />
                    <CommandList>
                        <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                            {filtered.map((item) => (
                                <CommandItem
                                    key={item}
                                    value={item}
                                    onSelect={() => {
                                        onChange(item);
                                        setOpen(false);
                                        onCommit?.();
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item ? "opacity-100" : "opacity-0")} />
                                    {item}
                                </CommandItem>
                            ))}
                            {searchValue && !database.includes(searchValue) && (
                                <CommandItem
                                    value={searchValue}
                                    onSelect={() => {
                                        onChange(searchValue);
                                        setOpen(false);
                                        onCommit?.();
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar "{searchValue}"
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function MedicationCombobox({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) {
    return <ComboboxSelector database={[]} value={value} onChange={onChange} placeholder="Nome do medicamento..." autoFocus={autoFocus} onCommit={onCommit} />;
}

function RegionSelector({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-11 bg-white border-slate-200 rounded-xl">
                    {REGION_OPTIONS.find(r => r.id === value)?.label || "Selecione a região..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar região..." />
                    <CommandList>
                        {REGION_OPTIONS.map(opt => (
                            <CommandItem key={opt.id} onSelect={() => { onChange(opt.id); setOpen(false); onCommit?.(); }}>
                                {opt.label}
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function ExtraQuestionnaireSelector({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-11 bg-white border-slate-200 rounded-xl">
                    {QUESTIONNAIRES.find(q => q.id === value)?.label || "Selecione o questionário..."}
                    <Plus className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar questionário..." />
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty>Nenhum questionário encontrado.</CommandEmpty>
                        {QUESTIONNAIRES_BY_CATEGORY.map(cat => (
                            <CommandGroup key={cat.category} heading={cat.category}>
                                {cat.items.map(item => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.label}
                                        onSelect={() => {
                                            onChange(item.id);
                                            setOpen(false);
                                        }}
                                    >
                                        {item.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface PBEFormProps {
    patientId: string;
    initialData?: Partial<SmartAssessmentValues>;
    readOnly?: boolean;
    onSave?: (data: any) => void;
    hideHeader?: boolean;
    hideButtons?: boolean;
}

export default function SmartPBEForm({ patientId, initialData, readOnly, onSave, hideHeader = false, hideButtons = false }: PBEFormProps) {
    const [isPending, startTransition] = useTransition();
    const [openSection, setOpenSection] = useState("anamnese");

    // Auto-Save Logic
    const { useDebouncedCallback } = require("use-debounce")
    const debouncedSave = useDebouncedCallback((data) => {
        if (onSave) {
            onSave(data);
        }
    }, 1500);

    // AI Report State
    const [report, setReport] = useState<any>(null)
    const [isReportGenerating, setIsReportGenerating] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)

    // Form Initialization
    const form = useForm<SmartAssessmentValues>({
        resolver: zodResolver(SmartAssessmentSchema) as any,
        defaultValues: initialData || {
            qp: '', hma: '', painDuration: '', eva: 0,
            efep: { items: [{ activity: '', score: 0 }, { activity: '', score: 0 }, { activity: '', score: 0 }] },
            history: { goals: [], activityFrequency: 'sedentary' },
            redFlags: {},
            anamnesis: { mainRegions: [] },
            physicalExam: { movementQuality: {}, rom: {}, strength: {}, specialTests: {} },
            neurological: { reflexes: {}, myotomes: {}, dermatomes: [], neuralTension: {} },
            functional: { flexibility: {}, strength: {} },
            plan: { followUpDays: [], monitorPain: true, extraQuestionnaire: "none", questionnaires: [] }
        }
    });

    const { fields: efepFields, append: appendEfep, remove: removeEfep } = useFieldArray({ control: form.control, name: "efep.items" as any });
    const { fields: regionFields, append: appendRegion, remove: removeRegion } = useFieldArray({ control: form.control, name: "anamnesis.mainRegions" as any });
    const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({ control: form.control, name: "history.meds" as any });

    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

    const { watch, setValue, control, handleSubmit } = form;
    const formData = watch();

    // Auto-Save Watcher
    useEffect(() => {
        const subscription = watch((value) => {
            debouncedSave(value);
        });
        return () => subscription.unsubscribe();
    }, [watch, debouncedSave]);

    // --- LEGACY ADAPTER ---
    const updateFieldLegacy = useCallback((path: string, val: any) => {
        setValue(path as any, val);
    }, [setValue]);

    // --- ACTIONS ---
    const onSubmit = async (data: SmartAssessmentValues) => {
        startTransition(async () => {
            try {
                if (onSave) onSave(data);
                toast.success("Avaliação salva com sucesso!");
            } catch (error: any) {
                toast.error(error?.message || "Erro ao salvar avaliação");
            }
        });
    };

    const handleGenerateReport = async () => {
        setIsReportGenerating(true)
        setIsReportOpen(true)
        try {
            // Simulate AI call
            await new Promise(r => setTimeout(r, 2000))
            const generatedReport = {
                diagnosis: "Considerando a queixa de dor lombar com irradiação (EVA 7), os testes de Slump e Laségue positivos sugerem uma Radiculopatia L5-S1. O baixo score no EFEP indica limitação funcional importante.",
                prognosis: "Favorável. Espera-se redução de 50% da dor em 4 semanas com protocolo de centralização e controle motor.",
                plan: "1. Exercícios de preferência direcional (Extensão)\n2. Mobilização neural leve\n3. Educação em dor / Retorno gradual às atividades"
            }
            setReport(generatedReport)
        } catch (e) {
            toast.error("Erro ao gerar relatório com IA")
        } finally {
            setIsReportGenerating(false)
        }
    }

    // --- CALCULATIONS ---
    const calculateEfepScore = () => {
        const items = formData.efep?.items || [];
        const total = items.reduce((acc: number, item: any) => acc + (Number(item.score) || 0), 0);
        return Math.round((total / 30) * 100);
    };

    // Accordion Helpers
    const isSectionFilled = (section: string) => {
        switch (section) {
            case 'anamnese': return !!formData.qp;
            case 'efep': return (formData.efep?.items || []).some((i: any) => i.activity);
            case 'history': return !!formData.history?.goals?.length;
            case 'protocol': return (formData.anamnesis?.mainRegions || []).length > 0;
            case 'functional': return !!formData.functional?.strength?.bridgeTest;
            default: return false;
        }
    };

    const SECTION_STYLES: Record<string, any> = {
        anamnese: { border: "border-l-blue-500", icon: "bg-blue-100 text-blue-600" },
        efep: { border: "border-l-emerald-500", icon: "bg-emerald-100 text-emerald-600" },
        history: { border: "border-l-indigo-500", icon: "bg-indigo-100 text-indigo-600" },
        protocol: { border: "border-l-orange-500", icon: "bg-orange-100 text-orange-600" },
        functional: { border: "border-l-purple-500", icon: "bg-purple-100 text-purple-600" },
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-7xl mx-auto pb-32">

                {/* Header (Visual Axiom) */}
                {!hideHeader && (
                    <div className="bg-white border rounded-xl p-3 mb-6 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                    Avaliação Biomecânica
                                </span>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight text-left">
                                    Protocolo Inteligente PBE
                                </h1>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Salvamento Automático</span>
                        </div>
                    </div>
                )}

                {/* Main Action Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white font-bold text-slate-600 gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            Status: Coleta de Dados
                        </Badge>
                        <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Progresso Total</span>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: '45%' }} />
                                </div>
                                <span className="text-xs font-black text-blue-700">45%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    onClick={handleGenerateReport}
                                    className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-6 rounded-xl font-bold gap-2 ring-offset-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
                                >
                                    {isReportGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-5 h-5 text-blue-400" />}
                                    Raciocínio Clínico (IA)
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-md border-slate-200">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-900">
                                        <Bot className="w-6 h-6 text-indigo-600" />
                                        Insight Clínico IA
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="mt-6 space-y-6">
                                    {isReportGenerating ? (
                                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                                            <div className="relative">
                                                <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                                <Bot className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Cruzando dados epidemiológicos e clínicos...</p>
                                        </div>
                                    ) : report ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                                    <h4 className="font-black text-xs text-indigo-900 uppercase tracking-widest">Hipótese Principal</h4>
                                                </div>
                                                <p className="text-slate-700 leading-relaxed font-medium">{report.diagnosis}</p>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                                    <h4 className="font-black text-[10px] text-emerald-800 uppercase tracking-widest mb-2">Prognóstico</h4>
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{report.prognosis}</p>
                                                </div>
                                                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                                    <h4 className="font-black text-[10px] text-orange-800 uppercase tracking-widest mb-2">Prioridade</h4>
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">Centralização de sintomas e redução de edema.</p>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-white">
                                                <h4 className="font-black text-xs text-indigo-400 uppercase tracking-widest mb-3">Diretrizes Sugeridas</h4>
                                                <pre className="text-xs text-slate-300 font-sans whitespace-pre-line leading-relaxed">{report.plan}</pre>
                                            </div>
                                        </div>
                                    ) : <p className="text-center text-slate-400 py-12 font-medium">Nenhuma análise gerada até o momento.</p>}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 font-bold shadow-md shadow-indigo-100 transition-all active:scale-[0.98]">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Agora
                        </Button>
                    </div>
                </div>

                {!readOnly && !hideButtons && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isPending}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-2xl h-12 px-8 rounded-full"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Salvar Avaliação
                        </Button>
                    </div>
                )}

                <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 1. ANAMNESE */}
                    <AccordionItem
                        value="anamnese"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'anamnese' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-blue-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('anamnese') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['anamnese'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <Activity className={cn("h-5 w-5 transition-colors", openSection === 'anamnese' ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'anamnese' ? "text-blue-950" : "text-slate-600")}>1. Anamnese & Queixa Principal</span>
                            </div>
                            {isSectionFilled('anamnese') && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-none text-[10px] h-5 mr-4 font-black">PREENCHIDO</Badge>
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-8 border-t border-slate-50">
                            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-4 bg-blue-500 rounded-full" />
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Identificação do Problema</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <FormField control={control} name="qp" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase">Queixa Principal (QP)</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="O que trouxe você aqui hoje?" className="min-h-[100px] rounded-xl border-slate-200 focus:ring-blue-500" /></FormControl>
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={control} name="painDuration" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase">Tempo de Evolução</FormLabel>
                                                    <FormControl><Input {...field} placeholder="Ex: 3 meses" className="h-11 rounded-xl" /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={control} name="eva" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase">Dor Atual (EVA)</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-3 px-3 h-11 bg-slate-50 border rounded-xl overflow-hidden">
                                                            <Thermometer className="h-4 w-4 text-orange-500" />
                                                            <input type="range" min="0" max="10" className="flex-1 accent-blue-600" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                                            <span className="text-lg font-black text-blue-700 w-6 text-center">{field.value}</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6 bg-blue-50/30 p-6 rounded-2xl border border-blue-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-4 bg-blue-500 rounded-full" />
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest text-blue-800">Mapeamento de Regiões</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <FormField control={control} name="anamnesis.mainRegions" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase">Regiões de Sintoma</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {(field.value || []).map((region: string) => (
                                                                <Badge key={region} className="bg-blue-600 text-white pl-3 pr-1 py-1 rounded-lg flex items-center gap-2 shadow-sm">
                                                                    {REGION_OPTIONS.find(r => r.id === region)?.label || region}
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5 hover:bg-blue-700 text-white/70"
                                                                        onClick={() => field.onChange((field.value || []).filter((r: string) => r !== region))}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <RegionSelector
                                                            value=""
                                                            onChange={(val) => {
                                                                if (!(field.value || []).includes(val)) {
                                                                    field.onChange([...(field.value || []), val]);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormDescription className="text-[10px] leading-tight">Escolha todas as regiões que o paciente queixa dor para habilitar protocolos específicos.</FormDescription>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 2. FUNCIONALIDADE (EFEP) */}
                    <AccordionItem
                        value="efep"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'efep' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-emerald-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('efep') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['efep'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <ClipboardList className={cn("h-5 w-5 transition-colors", openSection === 'efep' ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'efep' ? "text-emerald-950" : "text-slate-600")}>2. Funcionalidade (Score EFEP)</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-24 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-tighter">Score Final</span>
                                    <span className="text-sm font-black text-emerald-600">{calculateEfepScore()}%</span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-6 border-t border-slate-50">
                            <div className="max-w-4xl mx-auto">
                                <div className="grid gap-4">
                                    {efepFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                            <div className="h-10 w-10 flex items-center justify-center font-black text-slate-300 text-lg">{index + 1}</div>
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Atividade Limitada</Label>
                                                <FormField control={control} name={`efep.items.${index}.activity` as any} render={({ field }) => (
                                                    <FormControl><Input {...field} placeholder="Ex: Agachar para pegar peso" className="h-11 border-slate-200 rounded-xl" /></FormControl>
                                                )} />
                                            </div>
                                            <div className="w-32 space-y-2 text-center">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Dificuldade (0-10)</Label>
                                                <FormField control={control} name={`efep.items.${index}.score` as any} render={({ field }) => (
                                                    <FormControl><Input {...field} value={field.value ?? ''} type="number" min="0" max="10" className="h-11 font-black text-lg text-emerald-600 border-emerald-100 bg-white rounded-xl text-center" onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                                                )} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-6 text-center italic">Escala Funcional Específica do Paciente (EFEP): 0 = Incapaz de realizar, 10 = Nenhuma dificuldade.</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 3. HISTÓRICO & ESTILO DE VIDA */}
                    <AccordionItem
                        value="history"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'history' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-indigo-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('history') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['history'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <CalendarClock className={cn("h-5 w-5 transition-colors", openSection === 'history' ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'history' ? "text-indigo-950" : "text-slate-600")}>3. Histórico & Objetivos</span>
                            </div>
                            {isSectionFilled('history') && (
                                <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-none text-[10px] h-5 mr-4 font-black">PROGRESSO OK</Badge>
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-8 border-t border-slate-50">
                            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Estilo de Vida</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={control} name="history.activityFrequency" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase">Nível de Atividade</FormLabel>
                                                <FormControl>
                                                    <select {...field} className="h-11 w-full bg-slate-50 border rounded-xl px-3 font-medium text-slate-700 border-slate-200 focus:ring-2 focus:ring-indigo-500">
                                                        <option value="sedentary">Sedentário</option>
                                                        <option value="active">Ativo (1-2x/sem)</option>
                                                        <option value="very_active">Atleta (3x+/sem)</option>
                                                    </select>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={control} name="history.sleepQuality" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase">Qualidade do Sono</FormLabel>
                                                <FormControl>
                                                    <select {...field} className="h-11 w-full bg-slate-50 border rounded-xl px-3 font-medium text-slate-700 border-slate-200 focus:ring-2 focus:ring-indigo-500">
                                                        <option value="good">Bom</option>
                                                        <option value="regular">Regular</option>
                                                        <option value="bad">Ruim (Insônia/Dor)</option>
                                                    </select>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Expectativas do Paciente</h4>
                                    </div>
                                    <FormField control={control} name="history.goals" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500 uppercase">O que o paciente quer alcançar?</FormLabel>
                                            <FormControl><Textarea {...field} value={field.value.join('\n')} onChange={e => field.onChange(e.target.value.split('\n'))} placeholder="Ex: Voltar a correr 5km sem dor" className="min-h-[100px] rounded-xl border-slate-200" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 4. PROTOCOLOS ESPECÍFICOS (DYNAMIC CASE) */}
                    <AccordionItem
                        value="protocol"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'protocol' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-orange-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('protocol') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['protocol'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <Stethoscope className={cn("h-5 w-5 transition-colors", openSection === 'protocol' ? "text-orange-600" : "text-slate-400 group-hover:text-orange-500")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'protocol' ? "text-orange-950" : "text-slate-600")}>4. Protocolos PBE Selecionados</span>
                            </div>
                            <div className="flex gap-2">
                                {(formData.anamnesis?.mainRegions || []).map((r: string) => (
                                    <div key={r} className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200 overflow-hidden shadow-sm">
                                        {r === 'spine_lumbar' ? 'L' : r === 'knee' ? 'J' : r === 'shoulder' ? 'O' : r[0].toUpperCase()}
                                    </div>
                                ))}
                                <ChevronDown className="ml-2 h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-8 border-t border-slate-50">
                            <div className="max-w-6xl mx-auto">
                                {(formData.anamnesis?.mainRegions || []).length > 0 ? (
                                    <div className="space-y-12">
                                        {(formData.anamnesis?.mainRegions || []).map((region: string, idx: number) => (
                                            <div key={`${region}-${idx}`} className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                        {idx + 1}
                                                    </div>
                                                    <h3 className="text-lg font-black text-orange-950 uppercase tracking-tight">
                                                        Protocolo: {REGION_OPTIONS.find(r => r.id === region)?.label || region}
                                                    </h3>
                                                </div>

                                                <Card className="border-orange-100 shadow-sm overflow-hidden">
                                                    <CardContent className="p-0">
                                                        {region === 'spine_lumbar' && <LumbarSpineForm data={formData} updateField={updateFieldLegacy} />}
                                                        {region === 'knee' && <KneeForm data={formData} updateField={updateFieldLegacy} />}
                                                        {region === 'shoulder' && <ShoulderForm data={formData} updateField={updateFieldLegacy} />}
                                                        {region === 'ankle_foot' && <AnkleForm data={formData} updateField={updateFieldLegacy} />}
                                                        {region === 'hip' && <HipForm data={formData} updateField={updateFieldLegacy} />}
                                                        {region === 'spine_cervical' && <CervicalSpineForm data={formData} updateField={updateFieldLegacy} />}
                                                        {region === 'elbow_hand' && <ElbowHandForm data={formData} updateField={updateFieldLegacy} />}
                                                    </CardContent>
                                                </Card>
                                                {idx < (formData.anamnesis?.mainRegions || []).length - 1 && <Separator className="my-8" />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <Bot className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-balance">
                                            Selecione as articulações no passo 1 (Anamnese) <br /> para habilitar os protocolos PBE.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 5. RADAR FUNCIONAL */}
                    <AccordionItem
                        value="functional"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'functional' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-purple-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('functional') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['functional'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <Activity className={cn("h-5 w-5 transition-colors", openSection === 'functional' ? "text-purple-600" : "text-slate-400 group-hover:text-purple-500")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'functional' ? "text-purple-950" : "text-slate-600")}>5. Métricas & Radar Funcional</span>
                            </div>
                            {isSectionFilled('functional') && (
                                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-none text-[10px] h-5 mr-4 font-black">DADOS PRESENTES</Badge>
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-8 border-t border-slate-50">
                            <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-4 bg-purple-500 rounded-full" />
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Parâmetros de Saúde</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-sm">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Dor (EVA x 10)</Label>
                                            <span className="text-2xl font-black text-slate-900">{(formData.eva || 0) * 10}<span className="text-xs text-slate-400 font-bold ml-1">%</span></span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-sm">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Função (EFEP)</Label>
                                            <span className="text-2xl font-black text-slate-900">{calculateEfepScore()}<span className="text-xs text-slate-400 font-bold ml-1">%</span></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-4 bg-purple-500 rounded-full" />
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Testes de Capacidade</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center gap-3">
                                            <FormField control={control} name="functional.strength.bridgeTest" render={({ field }) => (
                                                <FormItem className="flex-1"><FormLabel className="text-xs font-bold text-slate-600">Ponte Isométrica (s)</FormLabel><FormControl><Input {...field} type="number" className="h-11 rounded-xl font-bold text-center" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={control} name="functional.strength.plankTest" render={({ field }) => (
                                                <FormItem className="flex-1"><FormLabel className="text-xs font-bold text-slate-600">Prancha (s)</FormLabel><FormControl><Input {...field} type="number" className="h-11 rounded-xl font-bold text-center" /></FormControl></FormItem>
                                            )} />
                                        </div>
                                        <FormField control={control} name="functional.strength.dynamometry" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs font-bold text-slate-600">Dinamometria Global (kg)</FormLabel><FormControl><Input {...field} type="number" className="h-11 rounded-xl font-bold text-center" /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </form>
        </Form>
    );
}
