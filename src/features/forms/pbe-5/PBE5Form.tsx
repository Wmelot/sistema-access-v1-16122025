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
import { Textarea } from "@/components/ui/textarea";

// Modular Accordions
import { AnamnesisAccordion } from "./accordions/AnamnesisAccordion";
import { ClinicalHistoryAccordion } from "./accordions/ClinicalHistoryAccordion";
import { MetricsVitalsAccordion } from "./accordions/MetricsVitalsAccordion";
import { FunctionalAccordion } from "./accordions/FunctionalAccordion";
import { MovementAssessmentAccordion } from "./accordions/MovementAssessmentAccordion";
import { MuscleStrengthAccordion } from "./accordions/MuscleStrengthAccordion";
import { JointProtocolsAccordion } from "./accordions/JointProtocolsAccordion";
import { ClinicalConductAccordion } from "./accordions/ClinicalConductAccordion";

const SECTION_STYLES: Record<string, { border: string, iconColor: string, bg: string }> = {
    anamnesis: { border: "border-l-blue-600", iconColor: "text-blue-600", bg: "bg-blue-50/30" },
    clinical: { border: "border-l-indigo-600", iconColor: "text-indigo-600", bg: "bg-indigo-50/30" },
    metrics: { border: "border-l-emerald-600", iconColor: "text-emerald-600", bg: "bg-emerald-50/30" },
    functionality: { border: "border-l-blue-500", iconColor: "text-blue-500", bg: "bg-blue-50/30" },
    movement: { border: "border-l-sky-500", iconColor: "text-sky-500", bg: "bg-sky-50/30" },
    strength: { border: "border-l-orange-500", iconColor: "text-orange-500", bg: "bg-orange-50/30" },
    protocols: { border: "border-l-purple-600", iconColor: "text-purple-600", bg: "bg-purple-50/30" },
    plan: { border: "border-l-slate-700", iconColor: "text-slate-700", bg: "bg-slate-50/30" }
};

const MENU_SECTIONS = [
    { id: 'anamnesis', label: 'Anamnese', desc: 'Queixa e HMA' },
    { id: 'clinical', label: 'Histórico Clínico', desc: 'Saúde e Lifestyle' },
    { id: 'metrics', label: 'Biofísica & Vitais', desc: 'Antropometria e VO2' },
    { id: 'functionality', label: 'Funcionalidade', desc: 'EFEP e Escalas' },
    { id: 'movement', label: 'Avaliação Movimento', desc: 'ADM e McKenzie' },
    { id: 'strength', label: 'Dinamometria', desc: 'Força & HHD' },
    { id: 'protocols', label: 'Protocolos Regionais', desc: 'Testes de Base' },
    { id: 'plan', label: 'Conduta Clínica', desc: 'Estratégia & Plano' }
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
    organization
}: PBE5FormProps) {
    const [openSection, setOpenSection] = useState("anamnesis");
    const [isSaving, setIsSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [feegowImportOpen, setFeegowImportOpen] = useState(false);
    const [feegowText, setFeegowText] = useState("");
    const { setIsCollapsed } = useSidebar();

    useEffect(() => {
        setIsCollapsed(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [openSection, setIsCollapsed]);

    const form = useForm({
        mode: "onChange",
        defaultValues: {
            anamnesis: { qp: "", hma: "", painDuration: "", eva: 0, mainRegions: [] },
            clinical: { meds: [], comorbidities: [], goals: "", activityLevel: "sedentary", sleepQuality: "regular" },
            metrics: { weight: "", height: "", hr: "", bp: "", spo2: "", temp: "", vo2_method: "none" },
            functionality: { efep: [{ activity: "", score: "" }] },
            movement: { active: {}, passive: {}, repeated: {} },
            strength: {},
            conduct: { questionnaires: [], extraQuestionnaire: "none", followUpDays: [], monitorPain: true },
            protocols: {},
            plan: { orientations: "", exercises: [], frequency: 2 },
            ...initialData
        }
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
        if (section === 'functionality') {
            const efep = data.efep || [];
            const hasEfep = efep.some((f: any) => f.activity && f.score !== "");
            const hasQuest = (form.getValues('conduct.questionnaires') || []).length > 0;
            return hasEfep || hasQuest;
        }
        if (section === 'movement') return Object.keys(data.active || {}).length > 0 || Object.keys(data.repeated || {}).length > 0;
        if (section === 'strength') return Object.keys(data).length > 0;
        if (section === 'protocols') return Object.keys(data).length > 0;
        if (section === 'plan') return !!data.orientations || data.exercises?.length > 0;
        return false;
    };

    return (
        <FormProvider {...form}>
            <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full px-4 py-8 relative z-10 gap-8">

                {/* SIDEBAR */}
                <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-8 self-start pt-2">
                    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-3 mb-4 p-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Axiom PBE</h3>
                                <div className="text-sm font-black text-indigo-900 leading-none">Versão 5.0</div>
                            </div>
                        </div>

                        {MENU_SECTIONS.map((sec, idx) => {
                            const isFilled = isSectionFilled(sec.id);
                            const curIdx = MENU_SECTIONS.findIndex(s => s.id === openSection);
                            const isActive = curIdx === idx;
                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => setOpenSection(sec.id)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all group",
                                        isActive ? "bg-slate-900 text-white shadow-xl" : "bg-transparent text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", isActive ? "text-indigo-300" : "")}>Etapa {(idx + 1).toString().padStart(2, '0')}</div>
                                        <div className={cn("text-[11px] font-black uppercase tracking-tight", isActive ? "text-white" : "text-slate-700")}>{sec.label}</div>
                                        <div className={cn("text-[8px] font-bold opacity-50 uppercase tracking-tighter mt-0.5", isActive ? "text-slate-300" : "")}>{sec.desc}</div>
                                    </div>
                                    {isFilled && <CheckCircle2 className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-emerald-500")} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="space-y-6 flex flex-col items-center flex-1 w-full max-w-4xl mx-auto relative z-10 pb-20">
                    <div className="w-full">
                        {(() => {
                            const activeSec = MENU_SECTIONS.find(s => s.id === openSection);
                            if (!activeSec) return null;
                            return (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-2 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Protocolo PBE 5.0</div>
                                            <Badge variant="outline" className="border-indigo-100 text-indigo-600 text-[10px] font-black uppercase">MODULAR</Badge>
                                        </div>
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
                            <FunctionalAccordion
                                openSection={openSection}
                                isSectionFilled={isSectionFilled}
                                sectionStyle={SECTION_STYLES.functionality}
                                setIsAssessmentModalOpen={setIsAssessmentModalOpen}
                            />
                            <MovementAssessmentAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.movement} />
                            <MuscleStrengthAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.strength} patient={patient} />
                            <JointProtocolsAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.protocols} />
                            <ClinicalConductAccordion openSection={openSection} isSectionFilled={isSectionFilled} sectionStyle={SECTION_STYLES.plan} />
                        </Accordion>

                        {/* NAV BUTTONS */}
                        <div className="w-full flex justify-between items-center mt-12 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-4">
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
                                            className="h-12 rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            {prevSec ? "Voltar" : ""}
                                        </Button>

                                        {nextSec ? (
                                            <Button
                                                type="button"
                                                onClick={() => setOpenSection(nextSec.id)}
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

                {/* FLOATING ACTION BAR (Padrão Palmilha 5.0) */}
                {!hideButtons && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-full border border-slate-200/50 shadow-2xl animate-in slide-in-from-bottom-5">
                        <AxiomCopilot
                            specialty="Fisioterapeuta Sênior PBE"
                            formSchemaName="PBE 5.0"
                        />

                        {/* Botão Salvar (Outline) */}
                        <Button
                            type="button"
                            onClick={form.handleSubmit(async (data) => {
                                setIsSaving(true);
                                try {
                                    await onSave(data, true);
                                    toast.success("Avaliação Salva com Sucesso!");
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

                {previewOpen && (
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
        </FormProvider>
    );
}
