"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Save, Loader2, Eye, Bot, CheckCircle2, ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/hooks/use-sidebar";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { AxiomCopilot } from "@/components/copilot/AxiomCopilot";
import { BiomechanicsReport } from "@/features/forms/pbe/components/biomechanics-report";
import { RapidAssessmentModal } from "@/features/forms/pbe/components/RapidAssessmentModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PBE5UnifiedReport } from "./components/reports/PBE5UnifiedReport";
import { PBE5ReportSelectorModal } from "./components/reports/PBE5ReportSelectorModal";
import { Textarea } from "@/components/ui/textarea";
import { CompactPBE5Card } from "./components/CompactPBE5Card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Modular Accordions
import { AnamnesisAccordion } from "./accordions/AnamnesisAccordion";
import { ClinicalHistoryAccordion } from "./accordions/ClinicalHistoryAccordion";
import { MetricsVitalsAccordion } from "./accordions/MetricsVitalsAccordion";
import { FunctionalAccordion } from "./accordions/FunctionalAccordion";
import { MovementAssessmentAccordion } from "./accordions/MovementAssessmentAccordion";
import { MuscleStrengthAccordion } from "./accordions/MuscleStrengthAccordion";
import { PalpationAccordion } from "./accordions/PalpationAccordion";
import { JointProtocolsAccordion } from "./accordions/JointProtocolsAccordion";
import { NeuropediaAccordion } from "./accordions/neuropedia-accordion";
import { NeuroAdultAccordion } from "./accordions/NeuroAdultAccordion";
import { CardioRespiratorioAccordion } from "./accordions/CardioRespiratorioAccordion";
import { OccupationalHealthAccordion } from "./accordions/OccupationalHealthAccordion";
import { GerontologyAccordion } from "./accordions/GerontologyAccordion";
import { ClinicalConductAccordion } from "./accordions/ClinicalConductAccordion";
import { WomensHealthAccordion } from "./accordions/WomensHealthAccordion";

// Advanced Physical Assessment Modular Components
import { PhysicalAntroAccordion } from "./accordions/PhysicalAntroAccordion";
import { PhysicalCardioAccordion } from "./accordions/PhysicalCardioAccordion";
import { PhysicalStrengthAccordion } from "./accordions/PhysicalStrengthAccordion";
import { PhysicalMobilityAccordion } from "./accordions/PhysicalMobilityAccordion";
import { PhysicalPostureAccordion } from "./accordions/PhysicalPostureAccordion";
import { PhysicalSportsAccordion } from "./accordions/PhysicalSportsAccordion";
import { ExamsAccordion } from "./accordions/ExamsAccordion";

export const PBE5_ID = 'pbe-5';

const SECTION_STYLES: Record<string, { border: string, iconColor: string, bg: string }> = {
    anamnesis: { border: "border-l-blue-600", iconColor: "text-blue-600", bg: "bg-blue-50/30" },
    clinical: { border: "border-l-indigo-600", iconColor: "text-indigo-600", bg: "bg-indigo-50/30" },
    metrics: { border: "border-l-emerald-600", iconColor: "text-emerald-600", bg: "bg-emerald-50/30" },
    functionality: { border: "border-l-blue-500", iconColor: "text-blue-500", bg: "bg-blue-50/30" },
    neuro_adult: { border: "border-l-indigo-700", iconColor: "text-indigo-700", bg: "bg-indigo-50/30" },
    cardio_respiratory: { border: "border-l-emerald-600", iconColor: "text-emerald-600", bg: "bg-emerald-50/30" },
    occupational_health: { border: "border-l-amber-600", iconColor: "text-amber-600", bg: "bg-amber-50/30" },
    gerontology: { border: "border-l-purple-600", iconColor: "text-purple-600", bg: "bg-purple-50/30" },
    movement: { border: "border-l-sky-500", iconColor: "text-sky-500", bg: "bg-sky-50/30" },
    strength: { border: "border-l-orange-500", iconColor: "text-orange-500", bg: "bg-orange-50/30" },
    womens_health: { border: "border-l-pink-600", iconColor: "text-pink-600", bg: "bg-pink-50/30" },
    protocols: { border: "border-l-purple-600", iconColor: "text-purple-600", bg: "bg-purple-50/30" },
    neuropedia: { border: "border-l-pink-500", iconColor: "text-pink-500", bg: "bg-pink-50/30" },
    palpation: { border: "border-l-rose-500", iconColor: "text-rose-500", bg: "bg-rose-50/30" },
    exams: { border: "border-l-cyan-600", iconColor: "text-cyan-600", bg: "bg-cyan-50/30" },
    plan: { border: "border-l-slate-700", iconColor: "text-slate-700", bg: "bg-slate-50/30" },

    // Advanced Physics
    antro: { border: "border-l-blue-600", iconColor: "text-blue-600", bg: "bg-blue-50/10" },
    cardio: { border: "border-l-rose-600", iconColor: "text-rose-600", bg: "bg-rose-50/10" },
    strength_advanced: { border: "border-l-slate-900", iconColor: "text-slate-900", bg: "bg-slate-50/10" },
    mobility: { border: "border-l-indigo-600", iconColor: "text-indigo-600", bg: "bg-indigo-50/10" },
    posture: { border: "border-l-purple-600", iconColor: "text-purple-600", bg: "bg-purple-50/10" },
    sports: { border: "border-l-emerald-600", iconColor: "text-emerald-600", bg: "bg-emerald-50/10" },
};

const ALL_MENU_SECTIONS = [
    { id: 'anamnesis', label: 'Anamnese', desc: 'Queixa Principal e História da Moléstia Atual', specialties: ['all'] },
    { id: 'clinical', label: 'Histórico Clínico', desc: 'História Pregressa e Medicamentos', specialties: ['all'] },
    { id: 'metrics', label: 'Biofísica & Vitais', desc: 'Sinais Vitais', specialties: ['all'] },

    { id: 'functionality', label: 'Funcionalidade e Conduta', desc: 'Escalas e Plano', specialties: ['all'] },
    { id: 'posture', label: 'Avaliação Postural', desc: 'Análise Fotogramétrica', specialties: ['ortopedia', 'advanced_physical'] },
    { id: 'movement', label: 'Avaliação Movimento', desc: 'ADM e McKenzie', specialties: ['ortopedia'] },
    { id: 'strength', label: 'Dinamometria e Força', desc: 'Testes Lafayette/HHD', specialties: ['ortopedia'] },
    { id: 'protocols', label: 'Protocolos Regionais', desc: 'Ortopedia Clássica', specialties: ['ortopedia'] },
    { id: 'palpation', label: 'Palpação e Trigger Points', desc: 'Sensibilidade e Dor', specialties: ['ortopedia'] },
    { id: 'exams', label: 'Exames Complementares', desc: 'Laudos (RX, RNM)', specialties: ['all', 'ortopedia'] },

    { id: 'neuropedia', label: 'Neuropediatria', desc: 'Neurodesenvolvimento', specialties: ['neuropediatria'] },
    { id: 'neuro_adult', label: 'Neurofuncional Adulto', desc: 'Funcionalidade e Controle', specialties: ['neurofuncional_adulto'] },
    { id: 'cardio_respiratory', label: 'Cardiovascular e Respiratório', desc: 'Monitorização e Esforço', specialties: ['cardio_respiratorio'] },
    { id: 'occupational_health', label: 'Saúde do Trabalho', desc: 'Ergonomia e Pericial', specialties: ['saude_trabalho'] },
    { id: 'gerontology', label: 'Gerontologia', desc: 'Avaliação Geriátrica Ampla', specialties: ['gerontologia'] },
    { id: 'womens_health', label: 'Saúde da Mulher', desc: 'Pélvica e Obstétrica', specialties: ['saude_mulher'] },

    { id: 'antro', label: 'Antropometria', desc: 'Composição Corporal', specialties: ['advanced_physical'] },
    { id: 'cardio', label: 'Capacidade Cardio', desc: 'VO2 Max e Estresse', specialties: ['advanced_physical'] },
    { id: 'strength_advanced', label: 'Força Avançada', desc: 'Dinamometria HHD', specialties: ['advanced_physical'] },
    { id: 'mobility', label: 'Mobilidade & Estabilidade', desc: 'Flexibilidade e Core', specialties: ['advanced_physical'] },
    { id: 'sports', label: 'Rotina Esportiva', desc: 'IPAQ e Gasto Kcal', specialties: ['advanced_physical'] },

    { id: 'plan', label: 'Conduta Clínica', desc: 'Estratégia & Plano', specialties: ['all'] }
];

interface PBE5FormProps {
    patientId: string;
    initialData?: any;
    onSave: (data: any, force?: boolean) => Promise<any> | void;
    hideHeader?: boolean;
    hideButtons?: boolean;
    readonly?: boolean;
    patient?: any;
    professional?: any;
    organization?: any;
    selectedTemplateId?: string;
    onTemplateChange?: (newTemplateId: string) => void;
    templates?: any[];
}

export default function PBE5Form({
    patientId,
    initialData,
    onSave,
    hideHeader = false,
    hideButtons = false,
    readonly = false,
    patient,
    professional,
    organization,
    selectedTemplateId,
    onTemplateChange,
    templates
}: PBE5FormProps) {
    const [openSection, setOpenSection] = useState("anamnesis");
    const [isSaving, setIsSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [feegowImportOpen, setFeegowImportOpen] = useState(false);
    const [feegowText, setFeegowText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isReportSelectorOpen, setIsReportSelectorOpen] = useState(false);
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const { setIsCollapsed } = useSidebar();

    useEffect(() => {
        setIsCollapsed(true);
        // window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [openSection, setIsCollapsed]);

    const form = useForm({
        mode: "onChange",
        defaultValues: {
            anamnesis: { qp: "", hma: "", painDuration: "", eva: 0, mainRegions: [] },
            clinical: { meds: [], comorbidities: [], goals: "", activityLevel: "sedentary", sleepQuality: "regular", specialty: "ortopedia", advancedPhysical: false },
            metrics: { weight: "", height: "", hr: "", bp: "", spo2: "", temp: "", vo2_method: "none" },
            antro: { gender: "male", weight: "", height: "", thigh: "", suprailiac: "", abdominal: "" },
            cardio: { method: "rockport", timeMin: "", heartRate: "", distance: "" },
            strength: {},
            mobility: { wells: "", legRaiseRight: "", legRaiseLeft: "", shoulderReachRight: "", shoulderReachLeft: "" },
            posture: { photos: {}, observations: [], photosAnalyzed: {}, pointsAnalyzed: {} },
            sports: { activity: "", frequency: "", duration: "", ipaq: "" },
            functionality: { efep: [{ activity: "", score: "" }] },
            movement: { active: {}, passive: {}, repeated: {}, gaitPhotosAnalyzed: {}, gaitPointsAnalyzed: {} },
            conduct: { questionnaires: [], extraQuestionnaire: "none", followUpDays: [], monitorPain: true },
            protocols: {},
            neuropedia: {
                gmfcs_level: "",
                macs_level: "",
                aims_score: 0,
                aims_prono: 0, aims_supino: 0, aims_sentado: 0, aims_depe: 0,
                f_words: { f_function: "", f_family: "", f_fitness: "", f_fun: "", f_friends: "", f_future: "" },
                tone_upper_esq: "0", tone_upper_dir: "0", tone_lower_esq: "0", tone_lower_dir: "0",
                reflexes: { rtca: "integrated", rtcs: "integrated", moro: "integrated", palmar: "integrated", plantar: "integrated", galant: "integrated" },
                adm: { hip_flex_l: "", hip_flex_r: "", knee_ext_l: "", knee_ext_r: "", ankle_dorsi_l: "", ankle_dorsi_r: "", elbow_ext_l: "", elbow_ext_r: "", head_rot_l: "", head_rot_r: "" },
                strength_notes: ""
            },
            neuro_adult: {
                tone_upper_esq: "0", tone_upper_dir: "0", tone_lower_esq: "0", tone_lower_dir: "0",
                coordination: { index_nose: "N", heel_shin: "N", diado: "N" },
                berg_score: 0,
                tug_seconds: "",
                walk_speed: "",
                rankin_level: "0",
                barthel_score: 0,
                cif_participation: "",
                cif_environment: ""
            },
            cardio_respiratory: {
                vitals: { bp_sys: "", bp_dia: "", hr_rest: "", spo2_rest: "", rr_rest: "" },
                ausculta: { estertores: "absent", sibilos: "absent", roncos: "absent", estridor: "absent" },
                tc6m: { distance: "", spo2_final: "", borg: "0" },
                cirto: { axilar_ins: "", axilar_exp: "", xifoide_ins: "", xifoide_exp: "", abdominal_ins: "", abdominal_exp: "" },
                mmrc: "0",
                cat_score: 0
            },
            occupational_health: {
                job_title: "", job_tenure: "", hours_per_day: "", task_description: "",
                posture_levels: { sitting: "Baixo", standing: "Baixo", walking: "Baixo", repetitive: "Baixo" },
                ergonomic_risk: "low",
                checklist: { chair: false, monitor: false, lighting: false, noise: false },
                ergonomic_suggestions: "",
                causal_link: "indetermined", forensic_tests: "", forensic_summary: "",
                handgrip_esquerda: "", handgrip_direita: "", lifting_capacity: ""
            },
            gerontology: {
                sarc_f: { strength: 0, walking: 0, rising: 0, stairs: 0, falls: 0 },
                sppb_walk: "", sppb_stand: "",
                meem_score: 0,
                depression_risk: "NÃO", mood_notes: "",
                katz: { bathing: "indep", dressing: "indep", toileting: "indep", transferring: "indep", continence: "indep", feeding: "indep" },
                giants: { instability: "AUSENTE", immobility: "AUSENTE", incontinence: "AUSENTE", insufficiency: "AUSENTE", iatrogeny: "AUSENTE" }
            },
            womens_health: {
                obstetric: { gestations: "", births: "", abortions: "", birth_type: "Vaginal", episiotomy: false, gestational_dm: false, menopause: false },
                perfect: { power: "", endurance: "", repetitions: "", fast: "" },
                urogyn: { mictions_day: "", nocturia: "", stress_incontinence: false, urgency_incontinence: false, pad_use: false, urodynamic_notes: "" },
                sexual: { dyspareunia: false, vaginismus: false, low_libido: false, anovulacao: false, trigger_points: "" }
            },
            plan: { orientations: "", exercises: [], frequency: 2 },
            ...initialData
        }
    });

    const specialty = form.watch('clinical.specialty') || 'ortopedia';
    const advancedPhysical = form.watch('clinical.advancedPhysical');

    const menuSections = ALL_MENU_SECTIONS.filter(sec => {
        if (sec.specialties.includes('all')) return true;
        if (sec.specialties.includes(specialty)) return true;
        if (sec.specialties.includes('advanced_physical') && advancedPhysical) return true;
        return false;
    });

    const [debouncedData] = useDebounce(form.watch(), 2000);

    const handleFeegowImport = () => {
        if (!feegowText) return;
        setFeegowImportOpen(false);
        setFeegowText("");
        toast.success("Sincronização Feegow concluída!");
    };

    useEffect(() => {
        if (!readonly && debouncedData) {
            onSave(debouncedData);
        }
    }, [debouncedData, onSave, readonly]);

    const isSectionFilled = (section: string) => {
        const data = form.watch(section as any);
        if (!data) return false;
        if (section === 'anamnesis') return !!data.qp || !!data.hma;
        if (section === 'clinical') return !!data.goals || data.meds?.length > 0 || data.comorbidities?.length > 0;
        if (section === 'metrics') return !!data.weight || !!data.hr;
        if (section === 'movement') return Object.keys(data.active || {}).length > 0 || Object.keys(data.repeated || {}).length > 0;
        if (section === 'strength') return Object.keys(data).length > 0;
        if (section === 'protocols') return Object.keys(data).length > 0;
        if (section === 'neuropedia') return !!data.gmfcs_level || !!data.aims_score || Object.values(data.f_words || {}).some(v => !!v);
        if (section === 'neuro_adult') return !!data.rankin_level || !!data.berg_score || !!data.tug_seconds;
        if (section === 'cardio_respiratory') return Object.values(data.vitals || {}).some(v => !!v) || !!data.tc6m?.distance;
        if (section === 'occupational_health') return !!data.job_title || !!data.forensic_summary || !!data.handgrip_esquerda;
        if (section === 'gerontology') return !!data.meem_score || !!data.sppb_walk || Object.values(data.katz || {}).some(v => v === 'dep');
        if (section === 'womens_health') return !!data.obstetric?.gestations || !!data.perfect?.power || !!data.urogyn?.mictions_day;
        if (section === 'plan') return !!data.orientations || data.exercises?.length > 0;

        // Advanced & Womens
        if (section === 'antro') return !!data.weight && !!data.height;
        if (section === 'cardio') return !!data.distance || (!!data.timeMin && !!data.heartRate);
        if (section === 'posture') return (data.observations || []).length > 0 || Object.keys(data.photos || {}).length > 0;
        if (section === 'mobility') return !!data.wells || !!data.legRaiseRight || !!data.shoulderReachRight;
        if (section === 'strength_advanced') return Object.keys(data).length > 0;
        if (section === 'sports') return !!data.activity || !!data.ipaq;

        return false;
    };

    return (
        <FormProvider {...form}>
            <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full px-4 py-4 relative z-10 gap-8">

                {/* SIDEBAR */}
                <div
                    className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-4 self-start pt-2 h-[calc(100vh-2rem)] overflow-y-auto sidebar-scroll"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .sidebar-scroll::-webkit-scrollbar { display: none; }
                    `}} />
                    {/* Template Selector integrated into Sidebar (FOTO 4) */}
                    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 block">
                            Modelo de Avaliação
                        </span>
                        <Select
                            value={
                                selectedTemplateId === 'e0000000-0000-0000-0000-000000000010' || selectedTemplateId === PBE5_ID ? PBE5_ID :
                                    selectedTemplateId === 'e0000000-0000-0000-0000-000000000005' || selectedTemplateId === 'palmilha-5' ? 'palmilha-5' :
                                        selectedTemplateId || PBE5_ID
                            }
                            onValueChange={onTemplateChange}
                        >
                            <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-100 shadow-none rounded-2xl text-xs font-bold">
                                <SelectValue placeholder="Selecionar" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value={PBE5_ID} className="font-bold text-indigo-700">PBE 5.0 — Avaliação</SelectItem>
                                <SelectItem value="palmilha-5" className="font-bold text-blue-700">Palmilha 5.0 — Biomecânica</SelectItem>
                                {templates?.filter((t: any) =>
                                    t.id !== 'palmilha-5' &&
                                    t.id !== PBE5_ID &&
                                    !t.title?.includes('(SISTEMA)')
                                ).map((t: any) => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="shrink-0">
                        <CompactPBE5Card
                            form={form}
                            isSaving={isSaving}
                            onSave={form.handleSubmit(async (data) => {
                                setIsSaving(true);
                                try {
                                    await onSave(data, true);
                                } finally {
                                    setIsSaving(false);
                                }
                            })}
                            onReport={() => setIsReportSelectorOpen(true)}
                            onImport={() => setFeegowImportOpen(true)}
                            onCopilotStatusChange={setIsListening}
                        />
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm flex flex-wrap gap-2 mt-2 mb-20 shrink-0">
                        {menuSections.map((sec, idx) => {
                            const isFilled = isSectionFilled(sec.id);
                            const curIdx = menuSections.findIndex((s: any) => s.id === openSection);
                            const isActive = curIdx === idx;

                            let showAsCard = false;
                            const total = menuSections.length;
                            if (curIdx === 0) {
                                showAsCard = idx <= 2;
                            } else if (curIdx === total - 1) {
                                showAsCard = idx >= total - 3;
                            } else {
                                showAsCard = idx >= curIdx - 1 && idx <= curIdx + 1;
                            }

                            // [NEW] Oval Capsules for items outside the 3-card window (FOTO 1 Logic)
                            if (!showAsCard) {
                                return (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => setOpenSection(sec.id)}
                                        title={sec.label}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full border flex items-center justify-center font-black text-[9px] transition-all shadow-sm shrink-0 uppercase tracking-tighter whitespace-nowrap",
                                            isFilled
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 ring-1 ring-emerald-500/20"
                                                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                        )}
                                    >
                                        {sec.label}
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => setOpenSection(sec.id)}
                                    className={cn(
                                        "w-full text-left px-5 py-4 rounded-[2rem] flex items-center gap-3 transition-all shrink-0",
                                        isActive ? "bg-slate-900 text-white shadow-2xl scale-105 z-10" :
                                            "bg-slate-50/50 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className={cn("text-[12px] font-black uppercase tracking-tight", isActive ? "text-white" : "text-slate-700")}>{sec.label}</div>
                                        <div className={cn("text-[10px] font-bold opacity-60 mt-0.5", isActive ? "text-slate-200" : "text-slate-400")}>{sec.desc}</div>
                                    </div>
                                    {isFilled && <CheckCircle2 className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-emerald-500")} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="space-y-6 flex flex-col items-center flex-1 w-full max-w-4xl mx-auto relative z-10 pb-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
                    <div className="w-full">
                        {(() => {
                            const activeSec = menuSections.find(s => s.id === openSection);
                            if (!activeSec) return null;
                            return (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-2 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight text-slate-800">{activeSec.label}</h2>
                                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{activeSec.desc}</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="w-full">
                        <Accordion type="single" value={openSection} onValueChange={setOpenSection} className="w-full space-y-4 [&>[data-state=closed]]:hidden">
                            <AnamnesisAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.anamnesis} />
                            <ClinicalHistoryAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.clinical} />
                            <MetricsVitalsAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.metrics} />

                            {/* Core Functional / Conduta sections (Moved up for Ortho) */}
                            <FunctionalAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES.functionality}
                                setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                            />

                            {/* Specialty Specific Accordions */}
                            {specialty === 'ortopedia' && (
                                <>
                                    <PhysicalPostureAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.posture} />
                                    <MovementAssessmentAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.movement} />
                                    <MuscleStrengthAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.strength} patient={patient} />
                                    <JointProtocolsAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.protocols} />
                                    <PalpationAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.palpation} />
                                    <ExamsAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.exams} />
                                </>
                            )}

                            {specialty === 'neuropediatria' && (
                                <NeuropediaAccordion
                                    openSection={openSection}
                                    isSectionFilled={isSectionFilled}
                                    sectionStyle={SECTION_STYLES.neuropedia}
                                    setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                                />
                            )}

                            {specialty === 'neurofuncional_adulto' && (
                                <NeuroAdultAccordion
                                    openSection={openSection}
                                    isSectionFilled={isSectionFilled}
                                    sectionStyle={SECTION_STYLES.neuro_adult}
                                    setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                                />
                            )}

                            {specialty === 'cardio_respiratorio' && (
                                <CardioRespiratorioAccordion
                                    openSection={openSection}
                                    isSectionFilled={isSectionFilled}
                                    sectionStyle={SECTION_STYLES.cardio_respiratory}
                                    setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                                />
                            )}

                            {specialty === 'saude_trabalho' && (
                                <OccupationalHealthAccordion
                                    openSection={openSection}
                                    isSectionFilled={isSectionFilled}
                                    sectionStyle={SECTION_STYLES.occupational_health}
                                    setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                                />
                            )}

                            {specialty === 'gerontologia' && (
                                <GerontologyAccordion
                                    openSection={openSection}
                                    isSectionFilled={isSectionFilled}
                                    sectionStyle={SECTION_STYLES.gerontology}
                                    setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                                />
                            )}

                            {specialty === 'saude_mulher' && (
                                <WomensHealthAccordion
                                    openSection={openSection}
                                    isSectionFilled={isSectionFilled}
                                    sectionStyle={SECTION_STYLES.womens_health}
                                    setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                                />
                            )}

                            {/* Advanced Physical Assessment Mode (Cross-Specialty) */}
                            {advancedPhysical && (
                                <>
                                    <PhysicalAntroAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.antro} />
                                    <PhysicalCardioAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.cardio} />
                                    <PhysicalStrengthAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.strength_advanced} />
                                    <PhysicalMobilityAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.mobility} />
                                    {specialty !== 'ortopedia' && <PhysicalPostureAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.posture} />}
                                    <PhysicalSportsAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.sports} />
                                </>
                            )}

                            <ClinicalConductAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.plan} />
                        </Accordion>

                        {/* NAV BUTTONS */}
                        <div className="w-full flex justify-between items-center mt-12 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-4">
                            {(() => {
                                const curIdx = menuSections.findIndex(s => s.id === openSection);
                                const prevSec = curIdx > 0 ? menuSections[curIdx - 1] : null;
                                const nextSec = curIdx < menuSections.length - 1 ? menuSections[curIdx + 1] : null;
                                return (
                                    <>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={!prevSec}
                                            onClick={() => prevSec && setOpenSection(prevSec.id)}
                                            className="h-12 rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            {prevSec ? "Voltar" : ""}
                                        </Button>

                                        {nextSec ? (
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (openSection === 'anamnesis') {
                                                        const redFlags = form.getValues('clinical.redFlags') || {};
                                                        const hasFlags = Object.values(redFlags).some(v => !!v);
                                                        if (hasFlags) {
                                                            import('sweetalert2').then((Swal) => {
                                                                Swal.default.fire({
                                                                    title: '⚠ ATENÇÃO: Bandeiras Vermelhas!',
                                                                    text: 'Foram detectados sinais de alerta que podem indicar patologias graves. Recomendamos cautela extrema ou encaminhamento imediato.',
                                                                    icon: 'warning',
                                                                    showCancelButton: true,
                                                                    confirmButtonText: 'Prosseguir mesmo assim',
                                                                    cancelButtonText: 'Revisar Anamnese',
                                                                    confirmButtonColor: '#e11d48',
                                                                    cancelButtonColor: '#94a3b8',
                                                                    customClass: {
                                                                        popup: 'rounded-[1.5rem] border-none',
                                                                        confirmButton: 'rounded-xl font-black uppercase tracking-widest text-[10px] px-6 py-3',
                                                                        cancelButton: 'rounded-xl font-black uppercase tracking-widest text-[10px] px-6 py-3',
                                                                    }
                                                                }).then((res) => {
                                                                    if (res.isConfirmed) setOpenSection(nextSec.id);
                                                                });
                                                            });
                                                            return;
                                                        }
                                                    }
                                                    setOpenSection(nextSec.id);
                                                }}
                                                className="h-12 rounded-2xl px-10 font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:scale-105 transition-all shadow-xl shadow-slate-200"
                                            >
                                                <span className="opacity-50 mr-2 uppercase">Próximo:</span> {nextSec.label} <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={form.handleSubmit(async (data) => {
                                                    setIsSaving(true);
                                                    try {
                                                        await onSave(data, true);
                                                        toast.success("PBE 5.0 Salva!");
                                                    } catch (e) {
                                                        toast.error("Erro ao salvar");
                                                    } finally {
                                                        setIsSaving(false);
                                                    }
                                                })}
                                                className="h-14 rounded-2xl px-10 font-black text-[11px] uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
                                            >
                                                {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
                                                Finalizar Avaliação
                                            </Button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* FOOTER REMOVED - NOW IN SIDEBAR */}

                {isReportSelectorOpen && (
                    <PBE5ReportSelectorModal
                        isOpen={isReportSelectorOpen}
                        onClose={() => setIsReportSelectorOpen(false)}
                        menuSections={menuSections}
                        isSectionFilled={isSectionFilled}
                        onConfirm={(sections) => {
                            setSelectedSections(sections);
                            setIsReportSelectorOpen(false);
                            setPreviewOpen(true);
                        }}
                    />
                )}

                {previewOpen && (
                    specialty === 'biomecanica' ? (
                        <BiomechanicsReport
                            open={previewOpen}
                            onClose={() => setPreviewOpen(false)}
                            form={form}
                            patient={patient || initialData?.patient}
                            organization={organization}
                            professional={professional}
                            data={form.getValues()}
                            minIndex={0}
                        />
                    ) : (
                        <PBE5UnifiedReport
                            open={previewOpen}
                            onClose={() => setPreviewOpen(false)}
                            data={form.getValues()}
                            patient={patient || initialData?.patient}
                            organization={organization}
                            professional={professional}
                            specialty={specialty}
                            selectedSections={selectedSections}
                        />
                    )
                )}


                <RapidAssessmentModal
                    isOpen={isAssessmentModalOpen}
                    onClose={() => setIsAssessmentModalOpen(false)}
                    assessmentType={form.watch("conduct.extraQuestionnaire")}
                    onSave={async (modalData: any) => {
                        const type = modalData.type || form.getValues("conduct.extraQuestionnaire");
                        const current = form.getValues("conduct.questionnaires") || [];

                        const answers = modalData.answers || modalData;
                        const score = modalData.score || 0;

                        const newEntry = {
                            type,
                            data: answers,
                            score: typeof score === 'object' ? (score.total || score.score) : score,
                            savedAt: new Date().toISOString()
                        };

                        form.setValue("conduct.questionnaires", [...current, newEntry], { shouldValidate: true, shouldDirty: true });
                    }}
                />

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
                                Cole o texto completo do prontuário ou relatório do Feegow abaixo.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            <Textarea
                                placeholder="Cole aqui o texto (Ex: QP: Dor nos joelhos...)"
                                className="min-h-[300px] bg-slate-50 border-slate-100 rounded-3xl p-6 text-sm font-medium focus:bg-white resize-none"
                                value={feegowText}
                                onChange={(e) => setFeegowText(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="gap-3 sm:gap-0">
                            <Button variant="ghost" type="button" onClick={() => setFeegowImportOpen(false)} className="rounded-2xl font-bold">Cancelar</Button>
                            <Button type="button" onClick={() => {
                                // Simple mock for now as per user preference for identical UI
                                toast.success("Importação iniciada...");
                                setFeegowImportOpen(false);
                            }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl px-10 h-14">PROCESSAR AGORA</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </FormProvider >
    );
}
