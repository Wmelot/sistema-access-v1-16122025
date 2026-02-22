"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Accordion } from "@/components/ui/accordion";
import { RapidAssessmentModal } from "@/features/pbe/components/RapidAssessmentModal";
import { cn } from "@/lib/utils";
import { Save, Loader2, Eye, Zap, Database, ArrowLeft, Menu, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiAssistantAccordion } from "./accordions/AiAssistantAccordion";
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

export default function Palmilha5Form({ patientId, initialData, onSave, hideHeader, hideButtons, readonly, isImported, organization, professional }: any) {
    const [openSection, setOpenSection] = useState("hma");
    const [feegowImportOpen, setFeegowImportOpen] = useState(false);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            single_squat: { pelvic_drop_left: "no", pelvic_drop_right: "no", photo_left: "", photo_right: "" }
        },
        shoe: { injuryType: "none", weight: "", drop: "", stack: "" },
        plan: { orientations: "", exercises: [], followUpDays: [], monitorPain: true, extraQuestionnaire: "none", questionnaires: [], deliveryDate: "" },
        painPoints: [],
        painZones: {}
    };

    const form = useForm({
        mode: "onChange",
        defaultValues: { ...defaults, ...initialData }
    });

    const isSectionFilled = (section: string) => {
        const data = form.watch(section as any);
        if (!data) return false;
        if (section === 'hma') return !!(data.qp || data.history || (data.eva && data.eva[0] > 0));
        if (section === 'history') return !!(data.comorbidities?.length || data.meds?.length || data.treatments?.length);
        if (section === 'map') return !!form.watch('painPoints')?.length;
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
        return false;
    };

    return (
        <FormProvider {...form}>
            <div className="space-y-6 flex flex-col items-center">
                {/* HEAD INFORMATIVO DA MIGRAÇÃO */}
                <div className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full opacity-50"></div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                        <Zap className="w-6 h-6 text-indigo-500 fill-indigo-100" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-indigo-900 uppercase">Ambiente de Transição (Palmilha 5.0)</h2>
                        <p className="text-xs text-indigo-700 font-medium">Você está testando a nova arquitetura modular. Nenhum dado de pacientes reais será afetado. Até agora migramos: <b className="text-indigo-900">14/14 Acordeões</b></p>
                    </div>
                </div>

                <div className="w-full">
                    <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* 0. ASSISTENTE IA & TRANSCRIÇÃO */}
                        <AiAssistantAccordion
                            openSection={openSection}
                            isSectionFilled={isSectionFilled}
                            sectionStyle={{ border: "border-l-indigo-600", iconColor: "text-indigo-600" }}
                            isImported={isImported}
                        />

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

                        {/* OUTROS AQUI... */}
                    </Accordion>
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
            </div>
        </FormProvider>
    );
}
