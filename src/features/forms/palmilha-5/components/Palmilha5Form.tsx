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
import { useOfflineSync } from "@/hooks/use-offline-sync";

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
    const navScrollRef = React.useRef<HTMLDivElement>(null);
    const { setIsCollapsed } = useSidebar();

    // Efeito para rolar para o topo quando uma seção for aberta (Desativado para rolagem local)
    /* useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [openSection]); */

    // Ocultar a barra lateral em qualquer formulário PBE para ampliar a tela
    useEffect(() => {
        setIsCollapsed(true);
    }, [setIsCollapsed]);

    useEffect(() => {
        if (navScrollRef.current) {
            const activeItem = navScrollRef.current.querySelector('.active-nav-item');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [openSection]);

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
                dorsal: {
                    first_ray: { left: 0, right: 0 },
                    midfoot: { left: 0, right: 0 },
                    inversion: { left: 0, right: 0 },
                    eversion: { left: 0, right: 0 }
                },
                ventral: {
                    rotation: { left: "", right: "" },
                    craig: { left: "", right: "" },
                    measures: {
                        left: { retro: "", ante: "", apa: "" },
                        right: { retro: "", ante: "", apa: "" }
                    }
                },
                ybalance: { legLength: { left: "", right: "" } },
                dfi: [{ left: 0, right: 0 }, { left: 0, right: 0 }, { left: 0, right: 0 }],
                gait_photos: { left: { initial: "", mid: "", terminal: "" }, right: { initial: "", mid: "", terminal: "" } },
                single_squat: { pelvic_drop_left: "Normal", pelvic_drop_right: "Normal", valgus_left: "Normal", valgus_right: "Normal", trunk_left: "Normal", trunk_right: "Normal", photo_left: "", photo_right: "" },
                photosAnalyzed: {},
                pointsAnalyzed: {}
            },
            shoe: { injuryType: "none", injuryStatus: "none", goals: ["pain_reduction"], experience: "amateur", weight: "", drop: "", stack: "" },
            plan: { orientations: "", exercises: [], followUpDays: [], monitorPain: true, extraQuestionnaire: "none", questionnaires: [], deliveryDate: "" },
            vascular: {},
            neuropathic: {},
            classification: { iwgdfLevel: "0" },
            painPoints: [],
            painZones: {},
            insole: {
                produto: "Slim",
                tipoPalmilha: "Inteira",
                cobertura: "EVA Azul (Padrão)",
                tamanho: "",
                leftFoot: { arco: "Normal", flexibilidade: "Flexível", pontoDor: "", elevacao: "0", borda: "", pads: {}, corretivos: {} },
                rightFoot: { arco: "Normal", flexibilidade: "Flexível", pontoDor: "", elevacao: "0", borda: "", pads: {}, corretivos: {} },
                reportText: ""
            },
            ...initialData
        }
    });

    const { clearDraft } = useOfflineSync({
        form,
        id: `${patientId}_${selectedTemplateId || 'palmilha-5'}`
    });

    const isInsensitiveFoot = useMemo(() => {
        const qp = form.watch('hma.qp')?.toLowerCase() || "";
        const history = form.watch('hma.history')?.toLowerCase() || "";
        const comorbidities = form.watch('history.comorbidities') || [];
        // Compatibility with both 'hma' and 'anamnesis' for regions
        const regions = form.watch('hma.mainRegions') || form.watch('anamnesis.mainRegions') || [];

        const hasDiabet = qp.includes("diabet") || history.includes("diabet") || comorbidities.some((c: string) => c.toLowerCase().includes("diabet"));
        const hasSensibilityLoss = qp.includes("sensibilid") || history.includes("sensibilid");
        const hasAmputation = qp.includes("amputa") || history.includes("amputa");

        return hasDiabet || hasSensibilityLoss || hasAmputation || regions.includes("insensitive_foot");
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
        const currentValues = form.getValues();

        // Basic mapping to the new schema
        if (parsedData?.anamnese?.queixa_principal) form.setValue("hma.qp", parsedData.anamnese.queixa_principal, { shouldDirty: true });
        if (parsedData?.anamnese?.hma) form.setValue("hma.history", parsedData.anamnese.hma, { shouldDirty: true });
        if (parsedData?.anamnese?.eva !== undefined) form.setValue("hma.eva", [parsedData.anamnese.eva], { shouldDirty: true });

        // Exame Fisico -> Palmilha 5
        if (parsedData?.exame_fisico) {
            const ef = parsedData.exame_fisico;

            // Lunge Test (Dorsiflexão em Carga)
            if (ef.lunge_test) {
                form.setValue("tests.lunge", {
                    left: ef.lunge_test.left ?? currentValues.tests?.lunge?.left,
                    right: ef.lunge_test.right ?? currentValues.tests?.lunge?.right
                }, { shouldDirty: true });
            }

            // Navicular Drop
            if (ef.navicular_drop) {
                form.setValue("postural.navicular", {
                    left: ef.navicular_drop.left ?? currentValues.postural?.navicular?.left,
                    right: ef.navicular_drop.right ?? currentValues.postural?.navicular?.right
                }, { shouldDirty: true });
            }

            // FPI (Mapping to fpi_left, fpi_right if it exists)
            if (ef.fpi) {
                const fpiL = currentValues.postural?.fpi_left || {} as any;
                const fpiR = currentValues.postural?.fpi_right || {} as any;

                if (ef.fpi.talus) { fpiL.talus = ef.fpi.talus.left; fpiR.talus = ef.fpi.talus.right; }
                if (ef.fpi.curvatura_maleolar) { fpiL.curves = ef.fpi.curvatura_maleolar.left; fpiR.curves = ef.fpi.curvatura_maleolar.right; }
                if (ef.fpi.posicao_calcaneo) { fpiL.calcaneus = ef.fpi.posicao_calcaneo.left; fpiR.calcaneus = ef.fpi.posicao_calcaneo.right; }
                if (ef.fpi.proeminencia_tln) { fpiL.tln = ef.fpi.proeminencia_tln.left; fpiR.tln = ef.fpi.proeminencia_tln.right; }
                if (ef.fpi.congruencia_arco) { fpiL.arch = ef.fpi.congruencia_arco.left; fpiR.arch = ef.fpi.congruencia_arco.right; }
                if (ef.fpi.abducao_antepé) { fpiL.abduction = ef.fpi.abducao_antepé.left; fpiR.abduction = ef.fpi.abducao_antepé.right; }

                form.setValue("postural.fpi_left", fpiL, { shouldDirty: true });
                form.setValue("postural.fpi_right", fpiR, { shouldDirty: true });
            }

            // Teste de Jack
            if (ef.jack_test) {
                form.setValue("tests.jack", {
                    left: ef.jack_test.left ?? currentValues.tests?.jack?.left,
                    right: ef.jack_test.right ?? currentValues.tests?.jack?.right
                }, { shouldDirty: true });
            }

            // Thomas
            if (ef.thomas_test) {
                form.setValue("tests.thomas", {
                    left: ef.thomas_test.left ?? currentValues.tests?.thomas?.left,
                    right: ef.thomas_test.right ?? currentValues.tests?.thomas?.right
                }, { shouldDirty: true });
            }
        }

        // Calçado
        if (parsedData?.calcado) {
            if (parsedData.calcado.modelo) form.setValue("shoe.model", parsedData.calcado.modelo, { shouldDirty: true });
            if (parsedData.calcado.tamanho) form.setValue("postural.shoeSize", parsedData.calcado.tamanho, { shouldDirty: true });
        }

        setFeegowImportOpen(false);
        setFeegowText("");
    };

    const isSectionFilled = (section: string) => {
        const data = form.getValues(section as any);
        if (!data) return false;
        if (section === 'hma') return !!(data.qp || data.history || (data.eva && data.eva[0] > 0));
        if (section === 'history') return !!(data.comorbidities?.length || data.meds?.length || data.treatments?.length);
        if (section === 'map') return !!form.getValues('painPoints')?.length || Object.keys(form.getValues('painZones') || {}).length > 0;
        if (section === 'efep') return !!form.getValues('efep')?.some((i: any) => i.activity && i.score !== "");
        if (section === 'sports') return !!form.getValues('sports')?.length && !!form.getValues('sports')[0]?.type;
        if (section === 'shoe') return !!form.getValues('shoe.model') || form.getValues('shoe.injuryType') !== 'none';
        if (section === 'baropo') return !!form.getValues('tests.baropo_2d') || !!form.getValues('tests.baropo_3d');
        if (section === 'static') return !!form.getValues('postural.shoeSize') || !!form.getValues('postural.navicular.left');
        if (section === 'fpi_detail') return form.getValues('postural.fpi_left.talus') !== undefined;
        if (section === 'orto') return !!form.getValues('tests.jack.left') || !!form.getValues('tests.lunge.left') || !!form.getValues('tests.ybalance.legLength.left');
        if (section === 'dynamic') return !!form.getValues('tests.single_squat.pelvic_drop_left') || !!form.getValues('tests.gait_photos.left.initial') || !!form.getValues('tests.dfi.0.left');
        if (section === 'dorsal') return !!form.getValues('tests.thomas.left') || !!form.getValues('tests.dorsal.first_ray.left') || !!form.getValues('tests.dorsal.silfverskiold.left');
        if (section === 'ventral') return !!form.getValues('tests.ventral.craig.left') || !!form.getValues('tests.ventral.measures.left.retro') || !!form.getValues('tests.ventral.rotation.left');
        if (section === 'exams') return !!form.getValues('plan.exams');
        if (section === 'exercises') return !!form.getValues('plan.exercises')?.length || !!form.getValues('plan.orientations');
        if (section === 'propulsao') return !!form.getValues('insole.propulsao_id') || !!form.getValues('insole.model');
        return false;
    };

    const getSectionStatus = (section: string) => {
        if (section === 'hma') {
            const hma = form.getValues('hma');
            let filled = 0;
            if (hma?.qp) filled++;
            if (hma?.history) filled++;
            if (hma?.eva && hma.eva[0] > 0) filled++;
            return filled === 0 ? 'empty' : filled >= 3 ? 'full' : 'partial';
        }
        if (section === 'history') {
            const history = form.getValues('history');
            let filled = 0;
            if (history?.comorbidities?.length) filled++;
            if (history?.meds?.length) filled++;
            if (history?.treatments?.length) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'insensitive_foot') {
            const vascular = form.getValues('vascular');
            const neuropathic = form.getValues('neuropathic');
            let filled = 0;
            if (vascular?.pulses?.pedal) filled++;
            if (neuropathic?.monofilament) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'map') {
            const painPoints = form.getValues('painPoints');
            const painZones = form.getValues('painZones');
            if (painPoints?.length > 0 || Object.keys(painZones || {}).length > 0) return 'full';
            return 'empty';
        }
        if (section === 'efep') {
            const efep = form.getValues('efep');
            const filled = efep?.filter((i: any) => i.activity && i.score !== "").length || 0;
            return filled === 0 ? 'empty' : filled >= 3 ? 'full' : 'partial';
        }
        if (section === 'sports') {
            const sports = form.getValues('sports');
            return (sports?.length && sports[0]?.type) ? 'full' : 'empty';
        }
        if (section === 'shoe') {
            const shoe = form.getValues('shoe');
            let filled = 0;
            if (shoe?.model) filled++;
            if (shoe?.injuryType && shoe.injuryType !== 'none') filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'baropo') {
            const baropo2d = form.getValues('tests.baropo_2d');
            const baropo3d = form.getValues('tests.baropo_3d');
            let filled = 0;
            if (baropo2d) filled++;
            if (baropo3d) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'static') {
            const shoeSize = form.getValues('postural.shoeSize');
            const navLeft = form.getValues('postural.navicular.left');
            let filled = 0;
            if (shoeSize) filled++;
            if (navLeft) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'fpi_detail') {
            const fL = form.getValues('postural.fpi_left');
            const fR = form.getValues('postural.fpi_right');
            const filled = (fL ? Object.keys(fL).length : 0) + (fR ? Object.keys(fR).length : 0);
            return filled === 0 ? 'empty' : filled >= 6 ? 'full' : 'partial';
        }
        if (section === 'orto') {
            const jack = form.getValues('tests.jack.left');
            const lunge = form.getValues('tests.lunge.left');
            const legLen = form.getValues('tests.ybalance.legLength.left');
            let filled = 0;
            if (jack) filled++;
            if (lunge) filled++;
            if (legLen) filled++;
            return filled === 0 ? 'empty' : filled >= 3 ? 'full' : 'partial';
        }
        if (section === 'dynamic') {
            const pelvic = form.getValues('tests.single_squat.pelvic_drop_left');
            const gait = form.getValues('tests.gait_photos.left.initial');
            const dfi = form.getValues('tests.dfi.0.left');
            let filled = 0;
            if (pelvic && pelvic !== 'Normal') filled++;
            if (gait) filled++;
            if (dfi) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'dorsal') {
            const thomas = form.getValues('tests.thomas.left');
            const slr = form.getValues('tests.slr.left');
            const dorsal = form.getValues('tests.dorsal.first_ray.left');
            let filled = 0;
            if (thomas) filled++;
            if (slr) filled++;
            if (dorsal) filled++;
            return filled === 0 ? 'empty' : filled >= 3 ? 'full' : 'partial';
        }
        if (section === 'ventral') {
            const craig = form.getValues('tests.ventral.craig.left');
            const rotation = form.getValues('tests.ventral.rotation.left');
            const retro = form.getValues('tests.ventral.measures.left.retro');
            let filled = 0;
            if (craig) filled++;
            if (rotation) filled++;
            if (retro) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'exams') return form.getValues('plan.exams') ? 'full' : 'empty';
        if (section === 'exercises') {
            const exercises = form.getValues('plan.exercises');
            const orientations = form.getValues('plan.orientations');
            let filled = 0;
            if (exercises?.length) filled++;
            if (orientations) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        if (section === 'propulsao') {
            const propId = form.getValues('insole.propulsao_id');
            const model = form.getValues('insole.model');
            let filled = 0;
            if (propId) filled++;
            if (model) filled++;
            return filled === 0 ? 'empty' : filled >= 2 ? 'full' : 'partial';
        }
        return isSectionFilled(section) ? 'full' : 'empty';
    };

    return (
        <FormProvider {...form}>
            <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full px-4 py-4 relative z-10 gap-8">

                {/* SIDEBAR ESQUERDA (DESKTOP) WIZARD MENU */}
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
                                        selectedTemplateId || "palmilha-5"
                            }
                            onValueChange={onTemplateChange}
                        >
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

                    <div className="shrink-0">
                        <CompactBiomechanicsCard
                            form={form}
                            isSaving={isSaving}
                            onSave={form.handleSubmit(async (data) => {
                                setIsSaving(true);
                                try {
                                    await onSave(data, true);
                                    clearDraft();
                                } finally {
                                    setIsSaving(false);
                                }
                            })}
                            onReport={() => setPreviewOpen(true)}
                            onImport={() => setFeegowImportOpen(true)}
                            onCopilotStatusChange={setIsListening}
                            isInsensitiveFoot={isInsensitiveFoot}
                            professional={professional}
                        />
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm flex flex-wrap gap-2 mt-2 mb-20 shrink-0">
                        {MENU_SECTIONS.map((sec, idx) => {
                            const curIdx = MENU_SECTIONS.findIndex(s => s.id === openSection);
                            const isActive = curIdx === idx;
                            const status = getSectionStatus(sec.id);

                            // Mostrar como card apenas se for a secção ativa
                            const showAsCard = isActive;

                            if (!showAsCard) {
                                return (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => setOpenSection(sec.id)}
                                        title={sec.label}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full border flex items-center justify-center font-black text-[9px] transition-all shadow-sm shrink-0 uppercase tracking-tighter whitespace-nowrap min-w-max",
                                            status === 'full'
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 ring-1 ring-emerald-500/20"
                                                : status === 'partial'
                                                    ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 ring-1 ring-amber-500/20"
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
                                    {status === 'full' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                    {status === 'partial' && <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ÁREA PRINCIPAL DO WIZARD (DIREITA) */}
                <div className="space-y-6 flex flex-col items-center flex-1 w-full max-w-4xl mx-auto relative z-10 pb-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">

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
                                isInsensitiveFoot={isInsensitiveFoot}
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
                    <div className="w-full flex justify-between items-center mt-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col pt-6">
                        {(() => {
                            const curIdx = MENU_SECTIONS.findIndex(s => s.id === openSection);
                            const prevSec = curIdx > 0 ? MENU_SECTIONS[curIdx - 1] : null;
                            const nextSec = curIdx < MENU_SECTIONS.length - 1 ? MENU_SECTIONS[curIdx + 1] : null;
                            const activeSec = MENU_SECTIONS[curIdx];

                            return (
                                <div className="w-full flex flex-col items-center justify-center">
                                    {/* CAPSULE SLIDER */}
                                    <div className="w-full flex justify-center mb-6">
                                        <div
                                            ref={navScrollRef}
                                            className="custom-scrollbar flex items-center gap-2 overflow-x-auto pb-4 max-w-full px-4 mask-image-horizontal"
                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
                                        >
                                            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { display: none; }` }} />

                                            {/* Previous Sections */}
                                            {MENU_SECTIONS.slice(0, curIdx).map(sec => {
                                                const status = getSectionStatus(sec.id);
                                                return (
                                                    <button
                                                        key={sec.id}
                                                        type="button"
                                                        onClick={() => setOpenSection(sec.id)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full border flex items-center justify-center font-black text-[9px] transition-all shadow-sm shrink-0 uppercase tracking-tighter whitespace-nowrap min-w-max",
                                                            status === 'full'
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                                                : status === 'partial'
                                                                    ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
                                                                    : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        {sec.label}
                                                    </button>
                                                )
                                            })}

                                            {/* Current Active Section Name */}
                                            {activeSec && (
                                                <div className="active-nav-item px-6 py-2 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shrink-0 shadow-lg mx-2 transition-all scale-105 min-w-max">
                                                    {activeSec.label}
                                                </div>
                                            )}

                                            {/* Next Sections */}
                                            {MENU_SECTIONS.slice(curIdx + 1).map(sec => {
                                                const status = getSectionStatus(sec.id);
                                                return (
                                                    <button
                                                        key={sec.id}
                                                        type="button"
                                                        onClick={() => setOpenSection(sec.id)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full border flex items-center justify-center font-black text-[9px] transition-all shadow-sm shrink-0 uppercase tracking-tighter whitespace-nowrap min-w-max",
                                                            status === 'full'
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                                                : status === 'partial'
                                                                    ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
                                                                    : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        {sec.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* BUTTONS ROW */}
                                    <div className="w-full flex justify-between items-center border-t border-slate-50 pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={!prevSec}
                                            onClick={() => prevSec && setOpenSection(prevSec.id)}
                                            className="h-10 rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            {prevSec ? "Voltar" : ""}
                                        </Button>

                                        {nextSec ? (
                                            <Button
                                                type="button"
                                                onClick={() => setOpenSection(nextSec.id)}
                                                className="h-10 rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:scale-105 transition-transform"
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
                                                        clearDraft();
                                                    } finally {
                                                        setIsSaving(false);
                                                    }
                                                })}
                                                className="h-10 rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 transition-transform shadow-lg shadow-emerald-600/20 shadow-emerald-500/20"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                                Salvar Avaliação
                                            </Button>
                                        )}
                                    </div>
                                </div>
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

                    <Dialog open={previewOpen} onOpenChange={(v) => !v && setPreviewOpen(false)}>
                        <DialogContent className="max-w-none w-screen h-[100dvh] p-0 border-0 outline-none flex flex-col z-[2147483647]">
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
                        </DialogContent>
                    </Dialog>
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
