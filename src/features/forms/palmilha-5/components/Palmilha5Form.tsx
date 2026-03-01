"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { AxiomCopilot } from "@/components/copilot/AxiomCopilot";
import { Accordion } from "@/components/ui/accordion";
import { RapidAssessmentModal } from "@/features/forms/pbe/components/RapidAssessmentModal";
import { cn } from "@/lib/utils";
import { Save, Loader2, Eye, Zap, Database, ArrowLeft, Menu, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PBE5_ID } from "@/features/forms/pbe-5/PBE5Form";
import { useSidebar } from "@/hooks/use-sidebar";
import { HmaAccordion } from "./accordions/HmaAccordion";
import { HistoryAccordion } from "./accordions/HistoryAccordion";
import { PainMapAccordion } from "./accordions/PainMapAccordion";
import { EfepAccordion } from "./accordions/EfepAccordion";
import { SportsAccordion } from "./accordions/SportsAccordion";
import { ShoeAccordion } from "./accordions/ShoeAccordion";
import { BaropodometryAccordion } from "./accordions/BaropodometryAccordion";
import { StaticAssessmentAccordion } from "./accordions/StaticAssessmentAccordion";
import { FunctionalTestsAccordion } from "./accordions/FunctionalTestsAccordion";
import { DynamicAssessmentAccordion } from "./accordions/DynamicAssessmentAccordion";
import { DorsalTestsAccordion } from "./accordions/DorsalTestsAccordion";
import { VentralTestsAccordion } from "./accordions/VentralTestsAccordion";
import { ExamsAccordion } from "./accordions/ExamsAccordion";
import { PlanAccordion } from "./accordions/PlanAccordion";
import { InsensitiveFootAccordion } from "./accordions/InsensitiveFootAccordion";
import { PropulsaoAccordionItem } from "@/features/forms/pbe/components/PropulsaoAccordionItem";
import { CompactBiomechanicsCard } from "./CompactBiomechanicsCard";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { BiomechanicsReport } from "@/features/forms/pbe/components/biomechanics-report";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseFeegowText } from "@/features/forms/_ROOT_BACKUP_JUNK_OUTSIDE/palmilha-biomecanica/utils/feegow-parser";

const SECTION_STYLES: Record<string, { border: string, iconColor: string }> = {
    hma: { border: "border-l-blue-600", iconColor: "text-blue-600" },
    history: { border: "border-l-green-600", iconColor: "text-green-600" },
    insensitive_foot: { border: "border-l-teal-600", iconColor: "text-teal-600" },
    map: { border: "border-l-red-500", iconColor: "text-red-500" },
    efep: { border: "border-l-orange-500", iconColor: "text-orange-500" },
    sports: { border: "border-l-yellow-500", iconColor: "text-yellow-500" },
    shoe: { border: "border-l-blue-500", iconColor: "text-blue-500" },
    baropo: { border: "border-l-rose-500", iconColor: "text-rose-500" },
    static: { border: "border-l-violet-600", iconColor: "text-violet-600" },
    fpi_detail: { border: "border-l-indigo-500", iconColor: "text-indigo-500" },
    orto: { border: "border-l-sky-600", iconColor: "text-sky-600" },
    dynamic: { border: "border-l-violet-600", iconColor: "text-violet-600" },
    dorsal: { border: "border-l-emerald-600", iconColor: "text-emerald-600" },
    ventral: { border: "border-l-emerald-600", iconColor: "text-emerald-600" },
    exams: { border: "border-l-slate-500", iconColor: "text-slate-500" },
    exercises: { border: "border-l-teal-600", iconColor: "text-teal-600" },
    propulsao: { border: "border-l-blue-700", iconColor: "text-blue-700" }
};

const BASE_MENU_SECTIONS = [
    { id: 'hma', label: 'Anamnese', desc: 'Queixa Principal e História da Moléstia Atual' },
    { id: 'history', label: 'Histórico Clínico', desc: 'História Pregressa e Medicamentos' },
    { id: 'map', label: 'Mapa da Dor', desc: 'Mapeamento Digital da Dor' },
    { id: 'efep', label: 'Funcionalidade', desc: 'Escalas de Função e Incapacidade' },
    { id: 'sports', label: 'Rotina Desportiva', desc: 'Nível de Atividade Física' },
    { id: 'shoe', label: 'Calçados', desc: 'Análise e Prescrição' },
    { id: 'baropo', label: 'Baropodometria', desc: 'Análise de Distribuição de Pressão Plantar' },
    { id: 'static', label: 'Avaliação Estática', desc: 'Postura e Alinhamento' },
    { id: 'fpi_detail', label: 'FPI-6', desc: 'Foot Posture Index' },
    { id: 'orto', label: 'Testes Funcionais I', desc: 'Testes Específicos na Posição Ortostática' },
    { id: 'dynamic', label: 'Movimento', desc: 'Avaliação Dinâmica' },
    { id: 'dorsal', label: 'Testes Funcionais II', desc: 'Testes Específicos em Decúbito Dorsal' },
    { id: 'ventral', label: 'Testes Funcionais III', desc: 'Testes Específicos em Decúbito Ventral' },
    { id: 'exams', label: 'Exames Complementares', desc: 'Laudos de exames (Rx, RNM, USG, etc)' },
    { id: 'exercises', label: 'Conduta Clínica', desc: 'Plano de Tratamento e Recomendação Terapêutica de Exercícios' },
    { id: 'propulsao', label: 'Pedido de Palmilha', desc: 'Elementos e Prescricção da Palmilha' }
];

export default function Palmilha5Form({
    patientId,
    initialData,
    onSave,
    hideHeader,
    hideButtons,
    readonly,
    isImported,
    organization,
    professional,
    patient,
    selectedTemplateId,
    onTemplateChange,
    templates
}: any) {
    const [openSection, setOpenSection] = useState("hma");
    const [feegowImportOpen, setFeegowImportOpen] = useState(false);
    const [feegowText, setFeegowText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { setIsCollapsed } = useSidebar();

    // Efeito para rolar para o topo quando uma seção for aberta
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [openSection]);

    // Ocultar a barra lateral em qualquer formulário PBE para ampliar a tela
    useEffect(() => {
        setIsCollapsed(true);
    }, [setIsCollapsed]);

    const form = useForm({
        mode: "onChange",
        defaultValues: {
            hma: { qp: "", history: "", eva: [0], glucoseControl: 5, drugsInUse: "" },
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
                dfi: [{ left: 0, right: 0 }, { left: 0, right: 0 }, { left: 0, right: 0 }],
                gait_photos: { left: { initial: "", mid: "", terminal: "" }, right: { initial: "", mid: "", terminal: "" } },
                single_squat: { pelvic_drop_left: "Normal", pelvic_drop_right: "Normal", valgus_left: "Normal", valgus_right: "Normal", trunk_left: "Normal", trunk_right: "Normal", photo_left: "", photo_right: "" }
            },
            shoe: { injuryType: "none", injuryStatus: "none", goals: ["pain_reduction"], experience: "amateur", weight: "", drop: "", stack: "" },
            plan: { orientations: "", exercises: [], followUpDays: [], monitorPain: true, extraQuestionnaire: "none", questionnaires: [], deliveryDate: "" },
            vascular: {},
            neuropathic: {},
            classification: { iwgdfLevel: "0" },
            painPoints: [],
            painZones: {},
            ...initialData
        }
    });

    const isInsensitiveFoot = useMemo(() => {
        const qp = form.watch('hma.qp')?.toLowerCase() || "";
        const history = form.watch('hma.history')?.toLowerCase() || "";
        const comorbidities = form.watch('history.comorbidities') || [];
        // Compatibility with both 'hma' and 'anamnesis' for regions
        const regions = form.watch('hma.mainRegions') || form.watch('anamnesis.mainRegions') || [];

        return qp.includes("diabet") || history.includes("diabet") || comorbidities.includes("Diabetes") || regions.includes("insensitive_foot");
    }, [form.watch('hma.qp'), form.watch('hma.history'), form.watch('history.comorbidities'), form.watch('hma.mainRegions'), form.watch('anamnesis.mainRegions')]);

    const MENU_SECTIONS = useMemo(() => {
        if (!isInsensitiveFoot) return BASE_MENU_SECTIONS;
        const sections = [...BASE_MENU_SECTIONS];
        // Insert 'Pé Insensível' after 'Histórico Clínico' (index 1)
        sections.splice(2, 0, { id: 'insensitive_foot', label: 'Pé Insensível', desc: 'Protocolo IWGDF' });
        return sections;
    }, [isInsensitiveFoot]);

    const handleFeegowImport = () => {
        if (!feegowText.trim()) return;
        const parsedData = parseFeegowText(feegowText) as any;

        // Basic mapping to the new schema
        if (parsedData?.anamnese?.queixa_principal) form.setValue("hma.qp", parsedData.anamnese.queixa_principal, { shouldDirty: true });
        if (parsedData?.anamnese?.hma) form.setValue("hma.history", parsedData.anamnese.hma, { shouldDirty: true });
        if (parsedData?.anamnese?.eva !== undefined) form.setValue("hma.eva", [parsedData.anamnese.eva], { shouldDirty: true });

        setFeegowImportOpen(false);
    };

    const isSectionFilled = (section: string) => {
        const data = form.watch(section as any);
        if (!data) return false;
        if (section === 'hma') return !!(data.qp || data.history || (data.eva && data.eva[0] > 0));
        if (section === 'history') return !!(data.comorbidities?.length || data.meds?.length || data.treatments?.length);
        if (section === 'map') return !!form.watch('painPoints')?.length || Object.keys(form.watch('painZones') || {}).length > 0;
        if (section === 'efep') return !!form.watch('efep')?.some((i: any) => i.activity && i.score !== "");
        if (section === 'sports') return !!form.watch('sports')?.length && !!form.watch('sports')[0]?.type;
        if (section === 'shoe') return !!form.watch('shoe.model') || form.watch('shoe.injuryType') !== 'none';
        if (section === 'baropo') return !!form.watch('tests.baropo_2d') || !!form.watch('tests.baropo_3d');
        if (section === 'static') return !!form.watch('postural.shoeSize') || !!form.watch('postural.navicular.left');
        if (section === 'fpi_detail') return form.watch('postural.fpi_left.talus') !== undefined;
        if (section === 'orto') return !!form.watch('tests.jack.left') || !!form.watch('tests.lunge.left') || !!form.watch('tests.ybalance.legLength.left');
        if (section === 'dynamic') return !!form.watch('tests.single_squat.pelvic_drop_left') || !!form.watch('tests.gait_photos.left.initial') || !!form.watch('tests.dfi.0.left');
        if (section === 'dorsal') return !!form.watch('tests.thomas.left') || !!form.watch('tests.dorsal.first_ray.left');
        if (section === 'ventral') return !!form.watch('tests.ventral.craig.left') || !!form.watch('tests.ventral.measures.left.retro');
        if (section === 'exams') return !!form.watch('plan.exams');
        if (section === 'exercises') return !!form.watch('plan.exercises')?.length || !!form.watch('plan.orientations');
        if (section === 'propulsao') return !!form.watch('insole.propulsao_id') || !!form.watch('insole.model');
        return false;
    };

    return (
        <FormProvider {...form}>
            <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full px-4 py-4 relative z-10 gap-8">

                {/* SIDEBAR ESQUERDA (DESKTOP) WIZARD MENU */}
                <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-8 self-start pt-2">
                    {/* Template Selector integrated into Sidebar (FOTO 4) */}
                    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 block">
                            Modelo de Avaliação
                        </span>
                        <Select value={selectedTemplateId || "palmilha-5"} onValueChange={onTemplateChange}>
                            <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-100 shadow-none rounded-2xl text-xs font-bold">
                                <SelectValue placeholder="Selecionar" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="palmilha-5" className="font-bold text-blue-700">Palmilha 5.0</SelectItem>
                                <SelectItem value={PBE5_ID || "pbe-5"} className="font-bold text-indigo-700">PBE 5.0</SelectItem>
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

                    <CompactBiomechanicsCard
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
                        onReport={() => setPreviewOpen(true)}
                        onImport={() => setFeegowImportOpen(true)}
                        onCopilotStatusChange={setIsListening}
                    />

                    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm flex flex-wrap gap-2 mt-2 mb-20">
                        {MENU_SECTIONS.map((sec, idx) => {
                            const isFilled = isSectionFilled(sec.id);
                            const curIdx = MENU_SECTIONS.findIndex(s => s.id === openSection);
                            const isActive = curIdx === idx;

                            let showAsCard = false;
                            const total = MENU_SECTIONS.length;
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
                                        "w-full text-left px-5 py-4 rounded-[2rem] flex items-center gap-3 transition-all",
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

                {/* ÁREA PRINCIPAL DO WIZARD (DIREITA) */}
                <div className="space-y-6 flex flex-col items-center flex-1 w-full max-w-4xl mx-auto relative z-10 pb-20">

                    {/* CABEÇALHO DO PASSO ATUAL */}
                    <div className="w-full">
                        {(() => {
                            const curIdx = MENU_SECTIONS.findIndex(s => s.id === openSection);
                            const activeSec = MENU_SECTIONS[curIdx];
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

                            {/* 1. ANAMNESE (MIGRADO!) */}
                            <HmaAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                setFeegowImportOpen={setFeegowImportOpen}
                                isImported={isImported}
                                sectionStyle={SECTION_STYLES['hma']}
                                isListening={isListening}
                            />

                            <HistoryAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['history']}
                            />

                            {/* 2.5 PÉ INSENSÍVEL (DINÂMICO!) */}
                            {isInsensitiveFoot && (
                                <InsensitiveFootAccordion
                                    openSection={openSection}
                                    isSectionFilled={isSectionFilled}
                                    sectionStyle={SECTION_STYLES['insensitive_foot']}
                                />
                            )}

                            {/* 3. MAPA DA DOR (MIGRADO!) */}
                            <PainMapAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['map']}
                                painFields={[]}
                            />

                            {/* 4. FUNCIONALIDADE (EFEP/PSFS) (MIGRADO!) */}
                            <EfepAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['efep']}
                                setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                            />

                            {/* 5. ROTINA DESPORTIVA (IPAQ) (MIGRADO!) */}
                            <SportsAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['sports']}
                            />

                            {/* 6. TÊNIS / RECOMENDAÇÃO TÉCNICA (MIGRADO!) */}
                            <ShoeAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['shoe']}
                                organizationId={organization?.id}
                            />

                            {/* 7. BAROPODOMETRIA (MIGRADO!) */}
                            <BaropodometryAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['baropo']}
                            />

                            {/* 8. AVALIAÇÃO ESTÁTICA / FPI-6 (MIGRADO!) */}
                            <StaticAssessmentAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['static']}
                                fpiSectionStyle={SECTION_STYLES['fpi_detail']}
                            />

                            {/* 9. TESTES FUNCIONAIS (ORTO) (MIGRADO!) */}
                            <FunctionalTestsAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['orto']}
                            />

                            {/* 10. AVALIAÇÃO DINÂMICA (MIGRADO!) */}
                            <DynamicAssessmentAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['dynamic']}
                            />

                            {/* 11. TESTES FUNCIONAIS (DECÚBITO DORSAL) (MIGRADO!) */}
                            <DorsalTestsAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['dorsal']}
                            />

                            {/* 12. TESTES FUNCIONAIS (DECÚBITO VENTRAL) (MIGRADO!) */}
                            <VentralTestsAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['ventral']}
                            />

                            {/* 13. EXAMES COMPLEMENTARES (MIGRADO!) */}
                            <ExamsAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['exams']}
                                isImported={isImported}
                            />

                            {/* 14. PLANO TERAPÊUTICO E ORIENTAÇÕES (MIGRADO) */}
                            <PlanAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['exercises']}
                                isImported={isImported}
                            />

                            {/* 15. PEDIDO PALMILHA PROPULSÃO */}
                            <PropulsaoAccordionItem
                                value="propulsao"
                                form={form}
                                data={form.getValues()}
                                patientId={patientId}
                                patientName={patient?.name || form.watch("patient.name") || initialData?.patient?.name || "Paciente"}
                                patientEmail={patient?.email || form.watch("patient.email") || initialData?.patient?.email}
                                patientPhone={patient?.phone || form.watch("patient.phone") || initialData?.patient?.phone}
                                openSection={openSection}
                                patient={patient || initialData?.patient}
                                professional={professional}
                            />
                        </Accordion>
                    </div>

                    {/* BOTÕES DE NAVEGAÇÃO DO WIZARD */}
                    <div className="w-full flex justify-between items-center mt-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        {(() => {
                            const curIdx = MENU_SECTIONS.findIndex(s => s.id === openSection);
                            const prevSec = curIdx > 0 ? MENU_SECTIONS[curIdx - 1] : null;
                            const nextSec = curIdx < MENU_SECTIONS.length - 1 ? MENU_SECTIONS[curIdx + 1] : null;

                            return (
                                <>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={!prevSec}
                                        onClick={() => prevSec && setOpenSection(prevSec.id)}
                                        className="h-12 rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        {prevSec ? "Voltar" : ""}
                                    </Button>

                                    {nextSec ? (
                                        <Button
                                            type="button"
                                            onClick={() => setOpenSection(nextSec.id)}
                                            className="h-12 rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:scale-105 transition-transform"
                                        >
                                            <span className="opacity-50 mr-2">PRÓXIMO:</span> {nextSec.label} <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={form.handleSubmit(async (data) => {
                                                setIsSaving(true);
                                                try {
                                                    await onSave(data, true);
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            })}
                                            className="h-12 rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 transition-transform shadow-lg shadow-emerald-600/20 shadow-emerald-500/20"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Salvar Avaliação
                                        </Button>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    <RapidAssessmentModal
                        isOpen={isAssessmentModalOpen}
                        onClose={() => setIsAssessmentModalOpen(false)}
                        assessmentType={form.watch("plan.extraQuestionnaire")}
                        onSave={async (modalData: any) => {
                            const type = modalData.type || form.getValues("plan.extraQuestionnaire");
                            const current = form.getValues("plan.questionnaires") || [];

                            const answers = modalData.answers || modalData;
                            const score = modalData.score || 0;

                            const newEntry = {
                                type,
                                data: answers,
                                score: typeof score === 'object' ? (score.total || score.score) : score,
                                savedAt: new Date().toISOString()
                            };

                            form.setValue("plan.questionnaires", [...current, newEntry], { shouldValidate: true, shouldDirty: true });
                        }}
                    />

                    {previewOpen && (
                        <BiomechanicsReport
                            open={previewOpen}
                            onClose={() => setPreviewOpen(false)}
                            form={form}
                            patient={patient || initialData?.patient}
                            organization={organization}
                            professional={professional}
                            data={form.getValues()}
                            minIndex={0} // Computed inside if needed
                        />
                    )}
                </div>
            </div>

            {/* FOOTER REMOVED - NOW IN SIDEBAR */}

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
                        <Button type="button" onClick={handleFeegowImport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl px-10 h-14">PROCESSAR AGORA</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FormProvider>
    );
}
