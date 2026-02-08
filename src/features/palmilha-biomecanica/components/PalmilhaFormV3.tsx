"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PalmilhaSchema, PalmilhaFormValues } from "../schemas/palmilha-schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AnamneseSection } from "./sections/AnamneseSection";
import { FPISection } from "./sections/FPISection";
import { FunctionalTestsSection } from "./sections/FunctionalTestsSection";
import { ShoeSection } from "./sections/ShoeSection";
import { PrescriptionSection } from "./sections/PrescriptionSection";
import { submitPalmilha } from "../actions/submit-palmilha";
import { useTransition, useState, useMemo, useEffect } from "react";
import { parseFeegowText } from "../utils/feegow-parser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useParams } from "next/navigation";
import { createFeegowBackupEvolution } from "@/app/dashboard/[slug]/integrations/feegow-actions";
import { Textarea } from "@/components/ui/textarea";
import { Database, Zap } from "lucide-react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
    Loader2,
    ClipboardList,
    Footprints,
    Activity,
    ShoppingBag,
    Pill,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Save,
    Flame,
    Gauge,
    Info,
    AlertCircle,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BiomechanicsReport } from "@/features/pbe/components/biomechanics-report";

import { useSidebar } from "@/hooks/use-sidebar";

interface PalmilhaFormProps {
    patientId: string;
    initialData?: any;
    readonly?: boolean;
    patient?: any;
    organization?: any;
    professional?: any;
    onSave?: (data: PalmilhaFormValues, isManual?: boolean) => void;
}

const STEPS = [
    { id: "anamnese", title: "Anamnese", icon: ClipboardList, description: "Queixas e Histórico" },
    { id: "fpi6", title: "FPI-6", icon: Footprints, description: "Alinhamento do Pé" },
    { id: "testes", title: "Testes Funcionais", icon: Activity, description: "Mobilidade e Força" },
    { id: "calcado", title: "Calçado", icon: ShoppingBag, description: "Interface e Uso" },
    { id: "prescricao", title: "Prescrição", icon: Pill, description: "Elementos e Design" },
];

export default function PalmilhaFormV3({ patientId, initialData, readonly, patient, organization, professional, onSave }: PalmilhaFormProps) {
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [feegowImportOpen, setFeegowImportOpen] = useState(false);
    const [feegowText, setFeegowText] = useState("");
    const params = useParams();
    const slug = params.slug as string;

    // Hooks customizados
    const { setIsCollapsed } = useSidebar();

    // Auto-colapsar sidebar ao montar para ganhar espaço
    useEffect(() => {
        setIsCollapsed(true);
    }, [setIsCollapsed]);

    // Mapper function to handle legacy data and defaults
    const processInitialData = (data: any): Partial<PalmilhaFormValues> => {
        if (!data) return {};

        // 1. Try to detect "Legacy Format" (from BiomechanicsInsoleForm)
        const isLegacy = data.hma && !data.anamnese;
        let mapped = { ...data };

        if (isLegacy) {
            console.log("Detectado formato antigo, convertendo para V3...");
            mapped = {
                anamnese: {
                    queixa_principal: data.hma.qp || "",
                    hma: data.hma.history || "",
                    eva: Array.isArray(data.hma.eva) ? (data.hma.eva[0] || 0) : (data.hma.eva || 0),
                    historico_esportivo: {
                        modalidades: data.sports?.map((s: any) => s.sport) || [],
                        modalidades_detalhado: data.sports?.map((s: any) => s.sport) || [],
                        nivel: "Iniciante"
                    },
                    efep: data.efep || [],
                    mapa_dor: data.mapa_dor || { pontos: data.painPoints || [], observacoes: "" },
                    historia_pregressa: {
                        medicacao_uso: data.anamnese?.historia_pregressa?.medicacao_uso || "",
                        tratamentos_previos: []
                    }
                },
                exame_fisico: {
                    fpi: {
                        talus: { left: data.postural?.fpi_left?.talus || "0", right: data.postural?.fpi_right?.talus || "0" },
                        curvatura_maleolar: { left: data.postural?.fpi_left?.curves || "0", right: data.postural?.fpi_right?.curves || "0" },
                        posicao_calcaneo: { left: data.postural?.fpi_left?.calcaneus || "0", right: data.postural?.fpi_right?.calcaneus || "0" },
                        proeminencia_tln: { left: data.postural?.fpi_left?.tln || "0", right: data.postural?.fpi_right?.tln || "0" },
                        congruencia_arco: { left: data.postural?.fpi_left?.arch || "0", right: data.postural?.fpi_right?.arch || "0" },
                        abducao_antepé: { left: data.postural?.fpi_left?.abduction || "0", right: data.postural?.fpi_right?.abduction || "0" }
                    },
                    jack_test: { left: data.tests?.jack?.left || 0, right: data.tests?.jack?.right || 0 },
                    lunge_test: { left: data.tests?.lunge?.left || 0, right: data.tests?.lunge?.right || 0 },
                    thomas_test: { left: data.tests?.thomas?.left || 0, right: data.tests?.thomas?.right || 0 },
                    isquiotibiais: { left: data.tests?.slr?.left || 0, right: data.tests?.slr?.right || 0 },
                    craig_anteversao: { left: 0, right: 0 },
                    navicular_drop: {
                        left: data.postural?.navicular?.left ? Number(data.postural.navicular.left) : 0,
                        right: data.postural?.navicular?.right ? Number(data.postural.navicular.right) : 0
                    },
                    mobilidade: { raios: { left: "Normal", right: "Normal" }, mediope: { left: "Normal", right: "Normal" } },
                    forca_gluteo: { medio: { left: "Normal", right: "Normal" }, maximo: { left: "Normal", right: "Normal" } },

                    // Initialize empty images arrays
                    gait_analysis: { left_image: [], right_image: [], left_obs: "", right_obs: "" },
                    baropodometria: { static_image: [], dynamic_image: [], observacoes: "" },
                    ybalance: { legLength: { left: 0, right: 0 }, composite: { left: 0, right: 0 } }
                },
                calcado: {
                    modelo: data.shoe?.model || "",
                    tamanho: data.postural?.shoeSize || "",
                    peso_gramas: data.shoe?.weight || 0,
                    drop_mm: data.shoe?.drop || 0,
                    indice_minimalista: {
                        peso_score: 0, drop_score: 0, flex_longitudinal: 0, flex_torsional: 0, estabilidade: 0
                    }
                },
                prescricao: {
                    palmilha: {
                        modelo: "Slim",
                        tipo: "Inteira",
                        tamanho: data.postural?.shoeSize || "",
                        left_foot: { pads: [], arco: "", absorcao: "", retrope: "", antepe: "", elevacao: "", borda: "", flexibilidade: "" },
                        right_foot: { pads: [], arco: "", absorcao: "", retrope: "", antepe: "", elevacao: "", borda: "", flexibilidade: "" }
                    },
                    preco_total: 0
                }
            };
        }

        return mapped;
    };

    const form = useForm<PalmilhaFormValues>({
        resolver: zodResolver(PalmilhaSchema) as any,
        defaultValues: {
            anamnese: {
                queixa_principal: "",
                eva: 0,
                efep: [{ atividade: "", nota: 0 }, { atividade: "", nota: 0 }, { atividade: "", nota: 0 }],
                historico_esportivo: { modalidades: [], nivel: "Iniciante" },
                historia_pregressa: { medicacao_uso: "", tratamentos_previos: [] },
                mapa_dor: { pontos: [] },
            },
            exame_fisico: {
                jack_test: { left: "Normal", right: "Normal" },
                lunge_test: { left: 0, right: 0 },
                fpi: {
                    talus: { left: "0", right: "0" },
                    curvatura_maleolar: { left: "0", right: "0" },
                    posicao_calcaneo: { left: "0", right: "0" },
                    proeminencia_tln: { left: "0", right: "0" },
                    congruencia_arco: { left: "0", right: "0" },
                    abducao_antepé: { left: "0", right: "0" }
                },
                thomas_test: { left: 0, right: 0 },
                isquiotibiais: { left: 0, right: 0 },
                craig_anteversao: { left: 0, right: 0 },
                navicular_drop: { left: 0, right: 0 },
                mobilidade: { raios: { left: "Normal", right: "Normal" }, mediope: { left: "Normal", right: "Normal" } },
                forca_gluteo: { medio: { left: "Normal", right: "Normal" }, maximo: { left: "Normal", right: "Normal" } },
                gait_analysis: { left_image: [], right_image: [] },
                baropodometria: { static_image: [], dynamic_image: [] },
                ybalance: { legLength: { left: 0, right: 0 }, composite: { left: 0, right: 0 } }
            },
            calcado: {
                indice_minimalista: {
                    peso_score: 0, drop_score: 0, flex_longitudinal: 0, flex_torsional: 0, estabilidade: 0
                }
            },
            prescricao: {
                palmilha: {
                    modelo: "Slim",
                    tipo: "Inteira",
                    left_foot: { pads: [] },
                    right_foot: { pads: [] }
                },
                preco_total: 0
            },
            ...processInitialData(initialData)
        }
    });

    const formValues = useWatch({ control: form.control });

    // REAL-TIME ANALYTICS ENGINE
    const analytics = useMemo(() => {
        // FPI Calculation
        const fpi = formValues.exame_fisico?.fpi;
        let esq = 0, dir = 0;
        if (fpi) {
            Object.values(fpi).forEach((val: any) => {
                if (val && typeof val === 'object') {
                    if (val.left) esq += parseInt(val.left || 0);
                    if (val.right) dir += parseInt(val.right || 0);
                }
            });
        }

        // Minimalist Index
        const minIndex = formValues.calcado?.indice_minimalista;
        const totalMin = minIndex ? (
            (Number(minIndex.peso_score) || 0) +
            (Number(minIndex.drop_score) || 0) +
            (Number(minIndex.flex_longitudinal) || 0) +
            (Number(minIndex.flex_torsional) || 0) +
            (Number(minIndex.estabilidade) || 0)
        ) * 4 : 0;

        // Pain Level (EVA)
        const eva = formValues.anamnese?.eva || 0;

        return {
            fpiTotal: { esq, dir },
            minimalistIndex: totalMin,
            evaScore: eva,
            isCriticalPain: eva >= 7
        };
    }, [formValues]);

    async function handleFeegowImport() {
        if (!feegowText.trim()) return;

        try {
            const parsedData = parseFeegowText(feegowText);

            // 1. Create Backup Evolution Card (Background)
            startTransition(async () => {
                const res = await createFeegowBackupEvolution(patientId, feegowText, slug);
                if (res.success) {
                    console.log("Backup evolution created:", res.id);
                } else {
                    console.error("Failed to create backup evolution:", res.error);
                }
            });

            // 2. Re-apply values to form
            // Use reset with keepDefaultValues: true or deep merge to avoid clearing everything
            const currentValues = form.getValues();

            // ... (rest of the mapping)
            if (parsedData.anamnese?.queixa_principal) {
                form.setValue("anamnese.queixa_principal", parsedData.anamnese.queixa_principal);
            }
            if (parsedData.anamnese?.hma) {
                form.setValue("anamnese.hma", parsedData.anamnese.hma);
            }
            if (parsedData.anamnese?.eva !== undefined) {
                form.setValue("anamnese.eva", parsedData.anamnese.eva);
            }

            // 2. EXAME FISICO
            if (parsedData.exame_fisico) {
                if (parsedData.exame_fisico.fpi) {
                    form.setValue("exame_fisico.fpi", { ...currentValues.exame_fisico.fpi, ...parsedData.exame_fisico.fpi });
                }
                if (parsedData.exame_fisico.lunge_test) {
                    form.setValue("exame_fisico.lunge_test", parsedData.exame_fisico.lunge_test);
                }
                if (parsedData.exame_fisico.navicular_drop) {
                    form.setValue("exame_fisico.navicular_drop", parsedData.exame_fisico.navicular_drop);
                }
                if (parsedData.exame_fisico.unipodal) {
                    form.setValue("exame_fisico.unipodal", parsedData.exame_fisico.unipodal);
                }
                if (parsedData.exame_fisico.apa) {
                    form.setValue("exame_fisico.apa", parsedData.exame_fisico.apa);
                }
                if (parsedData.exame_fisico.retrope) {
                    form.setValue("exame_fisico.retrope", parsedData.exame_fisico.retrope);
                }
                if (parsedData.exame_fisico.antepe_livre) {
                    form.setValue("exame_fisico.antepe_livre", parsedData.exame_fisico.antepe_livre);
                }
            }

            // 3. CALCADO
            if (parsedData.calcado) {
                if (parsedData.calcado.modelo) form.setValue("calcado.modelo", parsedData.calcado.modelo);
                if (parsedData.calcado.tamanho) form.setValue("calcado.tamanho", parsedData.calcado.tamanho);
            }

            toast.success("Dados do Feegow importados e backup criado na evolução!");
            setFeegowImportOpen(false);
            setFeegowText("");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar o texto do Feegow.");
        }
    }

    function onSubmit(data: PalmilhaFormValues) {
        if (readonly) return;

        // If onSave is provided (Sandbox mode), use it and skip direct server action
        if (onSave) {
            onSave(data, true); // Treat submit as manual save
            return;
        }

        startTransition(async () => {
            const result = await submitPalmilha(data, patientId);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    }

    const nextStep = () => setActiveTab((prev) => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setActiveTab((prev) => Math.max(prev - 1, 0));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-[1400px] mx-auto min-h-[90vh] flex flex-col lg:flex-row gap-6 p-4 md:p-6 text-slate-800">

                {/* NASA SIDEBAR NAVIGATION - FIXED POSITION ON DESKTOP */}
                <aside className="lg:w-80 shrink-0 flex flex-col gap-4">
                    <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                            <Gauge className="w-20 h-20" />
                        </div>
                        <h1 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Insole Engine</h1>
                        <p className="text-[10px] text-slate-400 font-mono">BIOMECHANICAL LAB v3.0</p>

                        {patient && (
                            <div className="mt-4 flex items-center gap-2 p-2 bg-slate-800 rounded-xl">
                                <div className="p-1.5 bg-slate-700 rounded-full">
                                    <User className="w-4 h-4 text-slate-300" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Paciente</p>
                                    <p className="text-xs font-bold text-white truncate">{patient.name}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">EVA</p>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2",
                                    analytics.isCriticalPain ? "border-red-500 text-red-500 bg-red-500/10" : "border-slate-700 text-white"
                                )}>
                                    {analytics.evaScore}
                                </div>
                            </div>
                            <div className="h-8 w-px bg-slate-800" />
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Min. Index</p>
                                <p className="text-xl font-black text-indigo-400">{analytics.minimalistIndex}%</p>
                            </div>
                            <div className="h-8 w-px bg-slate-800" />
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-1 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = activeTab === index;
                            const isCompleted = activeTab > index;

                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => setActiveTab(index)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-500 group relative",
                                        isActive
                                            ? "bg-white shadow-lg border border-slate-100 text-slate-900 scale-[1.02]"
                                            : "text-slate-500 hover:bg-white/80 hover:text-slate-700"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute left-1 w-1.5 h-8 bg-slate-900 rounded-full"
                                        />
                                    )}

                                    <div className={cn(
                                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
                                        isActive ? "bg-slate-900 text-white rotate-0" : "bg-slate-100 group-hover:bg-slate-200 -rotate-3"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Icon className="w-5 h-5" />}
                                    </div>

                                    <div className="text-left flex-1 truncate">
                                        <p className={cn("text-xs font-black uppercase tracking-wider mb-0.5 transition-colors", isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800")}>
                                            {step.title}
                                        </p>
                                        <p className="text-[10px] opacity-60 truncate font-bold text-slate-400">{step.description}</p>
                                    </div>

                                    {isActive && <ChevronRight className="w-4 h-4 text-slate-400 animate-pulse" />}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -bottom-4 -right-4 opacity-10">
                            <Activity className="w-24 h-24" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                            Real-time Stats
                        </p>
                        <div className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                    <p className="text-[8px] font-bold text-indigo-200 uppercase mb-1">FPI ESQ</p>
                                    <p className="text-xl font-black">{analytics.fpiTotal.esq > 0 ? `+${analytics.fpiTotal.esq}` : analytics.fpiTotal.esq}</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                    <p className="text-[8px] font-bold text-indigo-200 uppercase mb-1">FPI DIR</p>
                                    <p className="text-xl font-black">{analytics.fpiTotal.dir > 0 ? `+${analytics.fpiTotal.dir}` : analytics.fpiTotal.dir}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                    <span>Progress</span>
                                    <span>{Math.round(((activeTab + 1) / STEPS.length) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((activeTab + 1) / STEPS.length) * 100}%` }}
                                        transition={{ duration: 1, ease: "circOut" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.12)] border border-slate-100 flex-1 flex flex-col overflow-hidden">

                        {/* SECTION HEADER - PREMIUM APPLE STYLE */}
                        <header className="px-8 py-7 border-b border-slate-50 flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50/30 backdrop-blur-2xl sticky top-0 z-30">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest leading-none">
                                        Step 0{activeTab + 1}
                                    </span>
                                    {analytics.isCriticalPain && activeTab === 0 && (
                                        <span className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-black uppercase tracking-widest leading-none flex items-center gap-1">
                                            <AlertCircle className="w-2 h-2" /> Critical Pain
                                        </span>
                                    )}
                                    {readonly && (
                                        <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded-full font-black uppercase tracking-widest leading-none flex items-center gap-1">
                                            READ ONLY
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{STEPS[activeTab].title}</h2>
                                <p className="text-sm text-slate-500 font-bold">{STEPS[activeTab].description}</p>
                            </div>

                            <div className="flex items-center gap-3 mt-4 sm:mt-0">
                                <Button
                                    type="button"
                                    onClick={() => setFeegowImportOpen(true)}
                                    variant="outline"
                                    className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 h-11 font-black text-xs px-6 rounded-2xl transition-all flex items-center gap-2"
                                >
                                    <Database className="w-4 h-4" />
                                    SINCRONIZAR FEEGOW
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() => setPreviewOpen(true)}
                                    variant="ghost"
                                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 h-11 font-black text-xs px-6 rounded-2xl transition-all"
                                >
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    RELATÓRIO PDF
                                </Button>

                                {!readonly && (
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        variant="outline"
                                        className="bg-white text-slate-900 border-slate-200 hover:bg-slate-50 h-11 font-black text-xs px-6 rounded-2xl shadow-sm transition-all active:scale-95"
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        <span className="ml-2 uppercase tracking-widest">Draft Save</span>
                                    </Button>
                                )}
                            </div>
                        </header>

                        {/* CONTENT AREA WITH SMOOTH OVERFLOW */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <fieldset disabled={readonly} className="contents group-disabled">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                        className={cn("p-8 md:p-12", readonly && "opacity-90 pointer-events-none")}
                                    >
                                        <div className="max-w-4xl mx-auto">
                                            {activeTab === 0 && <AnamneseSection />}
                                            {activeTab === 1 && <FPISection />}
                                            {activeTab === 2 && <FunctionalTestsSection />}
                                            {activeTab === 3 && <ShoeSection />}
                                            {activeTab === 4 && <PrescriptionSection />}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </fieldset>
                        </div>

                        {/* FOOTER NAVIGATION - FLOATING STYLE */}
                        <footer className="px-8 py-6 border-t border-slate-50 bg-white flex justify-between items-center sticky bottom-0 z-30">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                disabled={activeTab === 0}
                                className="text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 rounded-2xl h-12 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>

                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex flex-col items-end mr-4">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Next Up</p>
                                    <p className="text-xs font-bold text-slate-500 truncate max-w-[120px]">
                                        {activeTab < STEPS.length - 1 ? STEPS[activeTab + 1].title : "Finalize"}
                                    </p>
                                </div>
                                {activeTab < STEPS.length - 1 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-widest px-10 rounded-2xl h-12 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.3)] group transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        Next Component
                                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isPending || readonly}
                                        className={cn(
                                            "bg-gradient-to-br from-emerald-600 to-teal-700 text-white hover:shadow-emerald-200/50 font-black text-xs uppercase tracking-widest px-12 rounded-2xl h-12 shadow-[0_20px_40px_-12px_rgba(5,150,105,0.4)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2",
                                            readonly && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Compile & Save
                                    </Button>
                                )}
                            </div>
                        </footer>
                    </div>
                </main>
            </form>

            {/* FEEGOW IMPORT DIALOG */}
            <Dialog open={feegowImportOpen} onOpenChange={setFeegowImportOpen}>
                <DialogContent className="max-w-2xl rounded-[40px] p-8 border-none shadow-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                            </div>
                            Sincronizar Feegow
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold">
                            Cole o texto completo do prontuário ou relatório do Feegow abaixo. Nosso motor de IA irá identificar e preencher as variáveis do exame físico automaticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <Textarea
                            placeholder="Cole aqui o texto (Ex: QP: Dor nos joelhos... Naviculômetro E: 11...)"
                            className="min-h-[300px] bg-slate-50 border-slate-100 rounded-3xl p-6 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
                            value={feegowText}
                            onChange={(e) => setFeegowText(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setFeegowImportOpen(false)}
                            className="rounded-2xl font-bold text-slate-500 hover:bg-slate-50"
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                /* Hide sections from printing individually if needed */
                @media print {
                    .no-print { display: none; }
                }
            `}</style>

            {/* REPORT MODAL */}
            {previewOpen && (
                <BiomechanicsReport
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    form={form}
                    patient={patient}
                    organization={organization}
                    professional={professional}
                    data={{
                        ...form.getValues(),
                        // Flatten for compatibility with legacy report
                        ...form.getValues("exame_fisico"),
                        tests: {
                            ...form.getValues("exame_fisico"),
                            // Map specific fields if the report expects them in 'tests'
                            thomas: form.getValues("exame_fisico.thomas_test"),
                            slr: form.getValues("exame_fisico.isquiotibiais"),
                            lunge: form.getValues("exame_fisico.lunge_test"),
                            jack: form.getValues("exame_fisico.jack_test"),
                        },
                    }}
                    minIndex={analytics.minimalistIndex}
                />
            )}
        </Form>
    );
}
