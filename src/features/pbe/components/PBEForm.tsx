"use client";

import { useForm, UseFormReturn, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SmartAssessmentSchema, SmartAssessmentValues } from "../schemas/smart-assessment-schema"; // Updated import
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    Plus, Trash2, ClipboardList, CalendarClock, Info, PencilRuler,
    ChevronsUpDown, Check, Stethoscope, Info as InfoIcon,
    Loader2, Save, FileText, Activity, Microscope, ArrowLeft, ArrowRight,
    ShieldAlert, Sparkles, Bot, AlertTriangle, Target, CheckCircle
} from "lucide-react";
import { useTransition, useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RapidAssessmentModal } from "@/features/pbe/components/RapidAssessmentModal";
import { MEDICATIONS_DB, MED_DESCRIPTIONS } from "@/utils/medication-db";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { submitPBE } from "../actions/submit-pbe";
import { generateSmartAssessmentReport } from "@/actions/attendance";
import { cn } from "@/lib/utils";

// Region Imports - Assumes these were copied to the new location
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

const REGION_OPTIONS = [
    { id: "spine_lumbar", label: "Coluna Lombar" },
    { id: "spine_cervical", label: "Coluna Cervical" },
    { id: "shoulder", label: "Ombro" },
    { id: "knee", label: "Joelho" },
    { id: "ankle_foot", label: "Tornozelo e Pé" },
    { id: "hip", label: "Quadril" },
    { id: "elbow_hand", label: "Cotovelo/Punho/Mão" },
];

const ComboboxSelector = ({ value, onChange, database, placeholder = "Buscar...", autoFocus, onCommit }: { value: string, onChange: (v: string) => void, database: string[], placeholder?: string, autoFocus?: boolean, onCommit?: () => void }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (autoFocus) {
            setOpen(true);
        }
    }, [autoFocus]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full h-9 justify-between bg-white text-left font-normal text-slate-700 px-3 focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 z-[160]" align="start">
                <Command>
                    <CommandInput
                        placeholder="Digite para buscar..."
                        className="h-9 border-none focus:ring-0 focus:outline-none"
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-xs text-slate-500 text-center">Para adicionar novo, digite abaixo 👇</div>
                        </CommandEmpty>
                        <CommandGroup heading="Sugestões" className="max-h-[200px] overflow-auto">
                            {database.map((item) => (
                                <CommandItem
                                    key={item}
                                    value={item}
                                    onSelect={() => {
                                        onChange(item)
                                        setOpen(false)
                                        if (onCommit) onCommit()
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
                                if (onCommit) onCommit()
                            }
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
};

const MedicationCombobox = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={MEDICATIONS_DB} placeholder="Buscar medicamento..." autoFocus={autoFocus} onCommit={onCommit} />;
};

const RegionSelector = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    const selectedLabel = REGION_OPTIONS.find(r => r.id === value)?.label || "";
    return (
        <ComboboxSelector
            value={selectedLabel}
            onChange={(label) => {
                const id = REGION_OPTIONS.find(r => r.label === label)?.id;
                if (id) onChange(id);
            }}
            database={REGION_OPTIONS.map(r => r.label)}
            placeholder="Escolha a região..."
            autoFocus={autoFocus}
            onCommit={onCommit}
        />
    );
};

const ExtraQuestionnaireSelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-9 text-xs border-indigo-200 font-bold bg-white text-indigo-900 shadow-sm hover:bg-indigo-50 focus:ring-0">
                    <span className="truncate">{value && value !== 'none'
                        ? QUESTIONNAIRES.find((q) => q.id === value)?.label
                        : "Selecionar Questionário Clínico..."}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 z-[150]" align="start">
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

interface PBEFormProps {
    patientId: string;
    initialData?: Partial<SmartAssessmentValues>;
}

export default function PBEForm({ patientId, initialData }: PBEFormProps) {
    const [isPending, startTransition] = useTransition();
    const [openSection, setOpenSection] = useState("anamnese");

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

    // --- LEGACY ADAPTER ---
    const updateFieldLegacy = useCallback((path: string, val: any) => {
        setValue(path as any, val, { shouldDirty: true, shouldTouch: true });
    }, [setValue]);

    // --- ACTIONS ---
    function onSubmit(data: SmartAssessmentValues) {
        startTransition(async () => {
            const result = await submitPBE(data as any, patientId);
            if (result.success) {
                toast.success("Avaliação salva com sucesso!");
            } else {
                toast.error(result.message);
            }
        });
    }

    const handleGenerateReport = async () => {
        setIsReportGenerating(true)
        setIsReportOpen(true)
        try {
            const result = await generateSmartAssessmentReport(formData)
            if (result.success && result.report) {
                setReport(result.report)
            } else {
                toast.error("Erro ao gerar relatório IA.")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsReportGenerating(false)
        }
    }

    // --- CALCULATIONS ---
    const calculateEfepScore = () => {
        const items = formData.efep?.items || [];
        if (items.length === 0) return 0;
        const sum = items.reduce((acc: number, item: any) => acc + (Number(item?.score) || 0), 0);
        return ((sum / items.length) * 10).toFixed(0);
    }

    const hasRedFlags = Object.values(formData.redFlags || {}).some(Boolean);

    // Accordion Helpers
    const isSectionFilled = (section: string) => {
        if (section === 'anamnese') return !!(formData.qp || formData.hma || (formData.anamnesis?.mainRegions || []).length > 0);
        if (section === 'efep') return (formData.efep?.items || []).some((i: any) => i.activity);
        if (section === 'history') return !!(formData.history?.hp || (formData.history?.meds || []).length > 0 || (formData.history?.goals || []).length > 0);
        if (section === 'physical') return (formData.anamnesis?.mainRegions || []).length > 0;
        if (section === 'functional') return !!(formData.functional?.strength?.bridgeTest || formData.functional?.strength?.plankTest);
        return false;
    };

    const SECTION_STYLES: Record<string, { border: string, iconColor: string }> = {
        anamnese: { border: "border-l-indigo-600", iconColor: "text-indigo-600" },
        efep: { border: "border-l-blue-600", iconColor: "text-blue-600" },
        history: { border: "border-l-green-600", iconColor: "text-green-600" },
        physical: { border: "border-l-orange-500", iconColor: "text-orange-500" },
        functional: { border: "border-l-purple-600", iconColor: "text-purple-600" }
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-[1200px] mx-auto pb-20 px-4">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 pt-6">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Avaliação Clínica Inteligente</h2>
                        <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                            <ShieldAlert className="w-4 h-4 text-indigo-500" />
                            Prática Baseada em Evidência (PBE)
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleGenerateReport} variant="outline" className="gap-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 h-11 px-6 font-bold shadow-sm">
                                    <Sparkles className="w-4 h-4" /> Análise IA (PBE)
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-indigo-800 text-xl">
                                        <Bot className="w-6 h-6" /> Raciocínio Clínico Inteligente
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                    {isReportGenerating ? (
                                        <div className="flex flex-col items-center py-16 gap-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                            <p className="text-slate-500 font-medium anim-pulse">Analisando evidências e hipóteses...</p>
                                        </div>
                                    ) : report ? (
                                        <div className="space-y-6 text-sm">
                                            <pre className="whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed shadow-inner">
                                                {JSON.stringify(report, null, 2)}
                                            </pre>
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

                <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 1. ANAMNESE */}
                    <AccordionItem
                        value="anamnese"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'anamnese' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-indigo-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('anamnese') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['anamnese'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <FileText className={cn("h-5 w-5 transition-colors", openSection === 'anamnese' ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'anamnese' ? "text-indigo-950" : "text-slate-600")}>1. Anamnese & Triagem</span>
                            </div>
                            {isSectionFilled('anamnese') && (
                                <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-none text-[10px] h-5 mr-4 font-black">PREENCHIDO</Badge>
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-6 border-t border-slate-50">
                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <FormField control={control} name="qp" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queixa Principal (QP)</FormLabel>
                                            <FormControl><Input {...field} placeholder="Descreva a queixa principal..." className="font-bold text-xl h-14 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-indigo-500" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={control} name="painDuration" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo de Evolução</FormLabel>
                                                <FormControl><Input {...field} placeholder="Ex: 3 semanas..." className="h-11 rounded-lg border-slate-200" /></FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={control} name="anamnesis.onset" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Início dos Sintomas</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="traumatic">Traumático</SelectItem>
                                                        <SelectItem value="insidious">Insidioso (Gradual)</SelectItem>
                                                        <SelectItem value="post_op">Pós-Operatório</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={control} name="hma" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">História da Moléstia Atual (HMA)</FormLabel>
                                            <FormControl><Textarea {...field} placeholder="Descreva o contexto da lesão..." className="min-h-[160px] rounded-xl border-slate-200 p-4 leading-relaxed text-base shadow-sm focus:ring-indigo-500" /></FormControl>
                                        </FormItem>
                                    )} />

                                    {/* SELEÇÃO DE REGIÕES (NOVO) */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Articulações para Avaliação</Label>
                                            <Badge variant="outline" className="text-[10px] font-bold border-indigo-200 text-indigo-600 bg-indigo-50/50">PBE PROTOCOLS</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {regionFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-300">
                                                    <div className="flex-1">
                                                        <RegionSelector
                                                            value={form.watch(`anamnesis.mainRegions.${index}` as any)}
                                                            onChange={(v) => form.setValue(`anamnesis.mainRegions.${index}` as any, v)}
                                                            autoFocus={index === regionFields.length - 1 && index > 0}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={() => removeRegion(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}

                                            {regionFields.length < 3 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-10 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 font-bold text-xs"
                                                    onClick={() => appendRegion("")}
                                                >
                                                    <Plus className="h-3 w-3 mr-2" /> ADICIONAR ARTICULAÇÃO
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic">Cada articulação selecionada abrirá um protocolo clínico específico no Exame Físico.</p>
                                    </div>
                                </div>
                                <div className="space-y-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Escala de Dor (EVA)</span>
                                            <span className="text-3xl font-black text-blue-400">{formData.eva}/10</span>
                                        </div>
                                        <FormField control={control} name="eva" render={({ field }) => (
                                            <Slider
                                                value={[field.value || 0]}
                                                onValueChange={v => field.onChange(v[0])}
                                                max={10} step={1} className="py-2"
                                            />
                                        )} />
                                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500">
                                            <span>SEM DOR</span>
                                            <span>MÁXIMA</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo de Triagem</span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            "Paciente refere dor há {formData.painDuration || '...'} com início {formData.anamnesis?.onset === 'traumatic' ? 'traumático' : 'gradual'}. Intensidade de {formData.eva}/10."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 2. FUNCIONALIDADE */}
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
                                    <Input {...form.register(`efep.items.${i}.activity` as any)} placeholder={["Ex: Dormir / Repouso", "Ex: Caminhar plano", "Ex: Caminhar terreno irregular", "Ex: Subir escadas"][i] || "Ex: Atividade física..."} className="flex-1 bg-white h-10" />
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            {...form.register(`efep.items.${i}.score` as any)}
                                            placeholder="0-10"
                                            className="text-center font-black h-10 border-blue-200"
                                            min={0}
                                            max={10}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "") {
                                                    form.setValue(`efep.items.${i}.score` as any, 0);
                                                    return;
                                                }
                                                const parsed = parseInt(val);
                                                if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                                    form.setValue(`efep.items.${i}.score` as any, parsed);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                let val = parseInt(e.target.value);
                                                if (isNaN(val) || val < 0) val = 0;
                                                if (val > 10) val = 10;
                                                form.setValue(`efep.items.${i}.score` as any, val);
                                            }}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEfep(i)} className="focusable-element text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            {efepFields.length < 3 && (
                                <Button type="button" variant="outline" size="sm" onClick={() => appendEfep({ activity: "", score: 0 })} className="focusable-element w-full border-dashed h-12 hover:bg-blue-50 text-blue-600 font-bold">
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
                                    {(form.watch('plan.questionnaires' as any) || []).length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {(form.watch('plan.questionnaires' as any)).map((q: any, idx: number) => (
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
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                                        onClick={() => {
                                                            const current = form.getValues('plan.questionnaires' as any) || [];
                                                            current.splice(idx, 1);
                                                            form.setValue('plan.questionnaires' as any, [...current]);
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
                                            value={form.watch("plan.extraQuestionnaire" as any)}
                                            onChange={(v) => form.setValue("plan.extraQuestionnaire" as any, v)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        disabled={!form.watch("plan.extraQuestionnaire" as any) || form.watch("plan.extraQuestionnaire" as any) === 'none'}
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
                                                const current = form.watch('plan.followUpDays' as any) || [];
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
                                                                form.setValue('plan.followUpDays' as any, novo);
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
                                                        onCheckedChange={(c) => form.setValue('plan.monitorPain' as any, c)}
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

                    {/* 3. HISTÓRICO CLÍNICO */}
                    <AccordionItem
                        value="history"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'history' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-green-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('history') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['history'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <Stethoscope className={cn("h-5 w-5 transition-colors", openSection === 'history' ? "text-green-600" : "text-slate-400 group-hover:text-green-500")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'history' ? "text-green-950" : "text-slate-600")}>3. Histórico Clínico</span>
                            </div>
                            {isSectionFilled('history') && (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-none text-[10px] h-5 mr-4 font-black">PREENCHIDO</Badge>
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-8 border-t border-slate-50">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {/* Comorbidades */}
                                    <div>
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Comorbidades / Condições</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Câncer', 'Cardiopatia', 'Diabetes', 'Dislipidemia', 'Doença Autoimune', 'Doença Neurológica', 'Doença Psiquiátrica', 'Doença Renal Crônica', 'Doença Respiratória Crônica', 'Etilismo', 'Fibromialgia', 'Hipertensão', 'Hipotireoidismo', 'Obesidade', 'Osteoporose', 'Tabagismo'].map(c => (
                                                <FormField key={c} control={control} name="history.comorbidities" render={({ field }) => (
                                                    <div className={cn(
                                                        "flex items-center space-x-3 border rounded-xl p-3 px-4 transition-all cursor-pointer",
                                                        field.value?.includes(c) ? "bg-green-50 border-green-200 shadow-sm" : "bg-white border-slate-100"
                                                    )} onClick={() => {
                                                        const curr = field.value || [];
                                                        const newValue = field.value?.includes(c) ? curr.filter(v => v !== c) : [...curr, c];
                                                        field.onChange(newValue);
                                                    }}>
                                                        <Checkbox checked={field.value?.includes(c)} className="rounded border-slate-300" />
                                                        <Label className="cursor-pointer font-bold text-slate-700 text-xs">{c}</Label>
                                                    </div>
                                                )} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Medicamentos Dinâmicos */}
                                    <div className="space-y-4 pt-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Medicamentos em Uso</Label>
                                        <div className="space-y-3">
                                            {medFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2 items-center animate-in slide-in-from-top-2 duration-200">
                                                    <div className="flex-[3]">
                                                        <MedicationCombobox
                                                            value={form.watch(`history.meds.${index}.name` as any)}
                                                            onChange={(v) => form.setValue(`history.meds.${index}.name` as any, v)}
                                                            autoFocus={index === medFields.length - 1 && index > 0}
                                                        />
                                                    </div>
                                                    <div className="flex-[2] flex gap-1 items-center">
                                                        <Input
                                                            {...form.register(`history.meds.${index}.dose` as any)}
                                                            placeholder="Dosagem/Posologia"
                                                            className="h-9 text-xs bg-white border-slate-200 shadow-sm"
                                                        />
                                                        {MED_DESCRIPTIONS[form.watch(`history.meds.${index}.name` as any)] && (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 shrink-0"><InfoIcon className="h-3.5 w-3.5" /></Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-64 p-3 text-[10px] leading-relaxed z-[170]">
                                                                    <div className="font-bold mb-1 text-indigo-600">Bula Resumida:</div>
                                                                    {MED_DESCRIPTIONS[form.watch(`history.meds.${index}.name` as any)]}
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0"
                                                        onClick={() => removeMed(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full h-10 border-dashed border-green-200 text-green-600 hover:bg-green-50 font-bold text-xs"
                                                onClick={() => appendMed({ name: "", dose: "" })}
                                            >
                                                <Plus className="h-3 w-3 mr-2" /> ADICIONAR MEDICAMENTO
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <FormField control={control} name="history.hp" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">História Pregressa / Cirurgias</FormLabel>
                                            <FormControl><Textarea {...field} placeholder="Cirurgias, fraturas, internações..." className="h-24 rounded-xl border-slate-200" /></FormControl>
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="history.activityFrequency" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Nível de Atividade Física</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { v: 'sedentary', l: 'Sedentário' },
                                                        { v: '1x', l: '1-2x/Sem' },
                                                        { v: '3x', l: '3-4x/Sem' },
                                                        { v: '5x', l: 'Atleta / 5x+' }
                                                    ].map((opt) => (
                                                        <div key={opt.v} className={cn(
                                                            "flex items-center space-x-2 border rounded-xl p-3 px-4 transition-all cursor-pointer",
                                                            field.value === opt.v ? "bg-green-50 border-green-200 ring-1 ring-green-100" : "bg-white border-slate-100 hover:border-slate-200"
                                                        )} onClick={() => field.onChange(opt.v)}>
                                                            <RadioGroupItem value={opt.v} id={opt.v} className="text-green-600" />
                                                            <Label htmlFor={opt.v} className="cursor-pointer font-bold text-slate-700 text-xs">{opt.l}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    <Separator className="opacity-50" />
                                    <div>
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Objetivos Terapêuticos</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Reduzir Dor', 'Performance', 'Mobilidade', 'Força', 'Prevenção', 'Estabilidade'].map(g => (
                                                <FormField key={g} control={control} name="history.goals" render={({ field }) => (
                                                    <div className={cn(
                                                        "flex items-center space-x-3 border rounded-xl p-3 px-4 transition-all cursor-pointer",
                                                        field.value?.includes(g) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100"
                                                    )} onClick={() => {
                                                        const curr = field.value || [];
                                                        const newValue = field.value?.includes(g) ? curr.filter(v => v !== g) : [...curr, g];
                                                        field.onChange(newValue);
                                                    }}>
                                                        <Checkbox checked={field.value?.includes(g)} className="rounded border-slate-300" />
                                                        <Label className="cursor-pointer font-bold text-slate-700 text-xs">{g}</Label>
                                                    </div>
                                                )} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 4. EXAME FÍSICO */}
                    <AccordionItem
                        value="physical"
                        className={cn(
                            "border rounded-2xl border-l-4 transition-all duration-300 shadow-sm",
                            openSection === 'physical' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-orange-50' : 'col-span-1 bg-white/50',
                            isSectionFilled('physical') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                            SECTION_STYLES['physical'].border
                        )}
                    >
                        <AccordionTrigger className="px-6 py-5 hover:no-underline flex gap-2 items-center text-left group">
                            <div className="flex items-center gap-3 flex-1">
                                <Microscope className={cn("h-5 w-5 transition-colors", openSection === 'physical' ? "text-orange-500" : "text-slate-400 group-hover:text-orange-400")} />
                                <span className={cn("font-bold text-base tracking-tight", openSection === 'physical' ? "text-orange-950" : "text-slate-600")}>4. Exame Físico Específico</span>
                            </div>
                            {isSectionFilled('physical') && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-none text-[10px] h-5 mr-4 font-black">REGIÃO DEFINIDA</Badge>
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="p-6 space-y-8 border-t border-slate-50">
                            <div className="flex flex-col md:flex-row justify-between items-center bg-orange-50/30 p-4 rounded-2xl border border-orange-100 gap-4">
                                <div className="text-center md:text-left">
                                    <h4 className="font-black text-orange-900 uppercase text-xs tracking-widest">Protocolo PBE</h4>
                                    <p className="text-xs text-orange-700 font-medium">Os protocolos abaixo foram habilitados com base nas regiões selecionadas na Anamnese.</p>
                                </div>
                            </div>

                            <div className="animate-in fade-in zoom-in-95 duration-500">
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

                <RapidAssessmentModal
                    isOpen={isAssessmentModalOpen}
                    onClose={() => setIsAssessmentModalOpen(false)}
                    assessmentType={form.watch('plan.extraQuestionnaire' as any)}
                    onSave={(assessment) => {
                        const current = form.getValues('plan.questionnaires' as any) || [];
                        form.setValue('plan.questionnaires' as any, [...current, assessment]);
                        form.setValue('plan.extraQuestionnaire' as any, 'none');
                    }}
                />

                {/* Save Reminder Footer */}
                <div className="flex justify-center mt-12 opacity-50 hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="gap-2 px-4 py-1.5 border-slate-200 bg-white">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-medium text-slate-600">Campos salvos serão enviados ao clicar em "Salvar Agora"</span>
                    </Badge>
                </div>
            </form>
        </Form>
    );
}
