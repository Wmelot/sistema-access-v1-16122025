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

const MENU_SECTIONS = [
    { id: 'hma', label: 'Anamnese', desc: 'Queixas e Histórico' },
    { id: 'history', label: 'Histórico Clínico', desc: 'Doenças e Medicamentos' },
    { id: 'map', label: 'Mapa da Dor', desc: 'Avaliação Digital 2D' },
    { id: 'efep', label: 'Funcionalidade', desc: 'Escalas EFEP / PSFS' },
    { id: 'sports', label: 'Rotina Desportiva', desc: 'Frequência e IPAQ' },
    { id: 'shoe', label: 'Calçado', desc: 'Interface e Prescrição' },
    { id: 'baropo', label: 'Baropodometria', desc: 'Pressão Plantar' },
    { id: 'static', label: 'Avaliação Estática', desc: 'Postura e Alinhamento' },
    { id: 'fpi_detail', label: 'FPI-6', desc: 'Foot Posture Index' },
    { id: 'orto', label: 'Testes Funcionais', desc: 'Ortopédicos e Mobilidade' },
    { id: 'dynamic', label: 'Movimento', desc: 'Avaliação Dinâmica / Vídeo' },
    { id: 'dorsal', label: 'Testes em Dorsal', desc: 'Decúbito Dorsal' },
    { id: 'ventral', label: 'Testes em Ventral', desc: 'Decúbito Ventral' },
    { id: 'exams', label: 'Exames Extras', desc: 'Laudos Auxiliares' },
    { id: 'exercises', label: 'Conduta Clínica', desc: 'Plano Terapêutico' },
    { id: 'propulsao', label: 'Pedido Propulsão', desc: 'Elementos da Palmilha' }
];

export default function Palmilha5Form({ patientId, initialData, onSave, hideHeader, hideButtons, readonly, isImported, organization, professional, patient }: any) {
    const [openSection, setOpenSection] = useState("hma");
    const [feegowImportOpen, setFeegowImportOpen] = useState(false);
    const [feegowText, setFeegowText] = useState("");
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
            dfi: [{ left: 0, right: 0 }, { left: 0, right: 0 }, { left: 0, right: 0 }],
            gait_photos: { left: { initial: "", mid: "", terminal: "" }, right: { initial: "", mid: "", terminal: "" } },
            single_squat: { pelvic_drop_left: "Normal", pelvic_drop_right: "Normal", valgus_left: "Normal", valgus_right: "Normal", trunk_left: "Normal", trunk_right: "Normal", photo_left: "", photo_right: "" }
        },
        shoe: { injuryType: "none", injuryStatus: "none", goals: ["pain_reduction"], experience: "amateur", weight: "", drop: "", stack: "" },
        plan: { orientations: "", exercises: [], followUpDays: [], monitorPain: true, extraQuestionnaire: "none", questionnaires: [], deliveryDate: "" },
        painPoints: [],
        painZones: {}
    };

    const form = useForm({
        mode: "onChange",
        defaultValues: { ...defaults, ...initialData }
    });

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
            <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full px-4 py-8 relative z-10 gap-8">

                {/* SIDEBAR ESQUERDA (DESKTOP) WIZARD MENU */}
                <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-8 self-start pt-2">
                    <CompactBiomechanicsCard form={form} />

                    <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm flex flex-wrap gap-2 mt-2 mb-20">
                        {MENU_SECTIONS.map((sec, idx) => {
                            const isFilled = isSectionFilled(sec.id);
                            const curIdx = MENU_SECTIONS.findIndex(s => s.id === openSection);
                            const isActive = curIdx === idx;
                            const isPast = curIdx > idx;

                            let showAsCard = false;
                            const total = MENU_SECTIONS.length;
                            if (curIdx === 0) {
                                showAsCard = idx <= 2;
                            } else if (curIdx === total - 1) {
                                showAsCard = idx >= total - 3;
                            } else {
                                showAsCard = idx >= curIdx - 1 && idx <= curIdx + 1;
                            }

                            // Círculos compactos para itens fora da janela de 3
                            if (!showAsCard) {
                                return (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => setOpenSection(sec.id)}
                                        title={sec.label}
                                        className={cn(
                                            "w-10 h-10 rounded-full border flex items-center justify-center font-black text-[10px] transition-all shadow-sm shrink-0 uppercase",
                                            isFilled
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 ring-2 ring-emerald-500/20"
                                                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                        )}
                                    >
                                        {sec.label.charAt(0)}
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => setOpenSection(sec.id)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all",
                                        isActive ? "bg-slate-900 text-white shadow-xl shadow-slate-200" :
                                            isPast ? "bg-slate-50 text-slate-500 hover:bg-slate-100" :
                                                "bg-transparent text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", isActive ? "text-indigo-300" : "")}>Step {(idx + 1).toString().padStart(2, '0')}</div>
                                        <div className={cn("text-[11px] font-black uppercase tracking-tight", isActive ? "text-white" : "text-slate-700")}>{sec.label}</div>
                                        <div className={cn("text-[9px] font-bold opacity-60 mt-0.5", isActive ? "text-slate-300" : "")}>{sec.desc}</div>
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
                                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full inline-block mb-2">
                                            Step {(curIdx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tight text-slate-800">{activeSec.label}</h2>
                                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{activeSec.desc}</p>
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
                            />

                            {/* 2. HISTÓRICO CLÍNICO (MIGRADO!) */}
                            <HistoryAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES['history']}
                            />

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

            {/* BOTÕES FLUTUANTES FOOTER (FOTO 3) */}
            {!hideButtons && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-full border border-slate-200/50 shadow-2xl animate-in slide-in-from-bottom-5">

                    <AxiomCopilot
                        specialty="Fisioterapeuta Sênior PBE"
                        formSchemaName="Palmilha Biomecânica 5.0"
                    />

                    {/* Botão Salvar (Outline) */}
                    <Button
                        type="button"
                        onClick={form.handleSubmit(async (data) => {
                            setIsSaving(true);
                            try {
                                await onSave(data, true);
                            } finally {
                                setIsSaving(false);
                            }
                        })}
                        disabled={isSaving}
                        className="rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm h-12 px-6 font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Save className="w-5 h-5 text-blue-600" />}
                        Salvar
                    </Button>

                    {/* Botão Relatório PDF (Dark) */}
                    <Button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-12 px-6 font-bold flex items-center gap-2 transition-all active:scale-95 border border-slate-700"
                    >
                        <Eye className="w-5 h-5 text-blue-400" />
                        Relatório
                    </Button>

                    {/* Botão Importar Feegow (Emerald) */}
                    <Button
                        type="button"
                        onClick={() => setFeegowImportOpen(true)}
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg h-12 px-6 font-bold flex items-center gap-2 transition-all active:scale-95 border border-emerald-500"
                    >
                        <Zap className="w-5 h-5 text-emerald-100" />
                        Importar
                    </Button>
                </div>
            )}

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
