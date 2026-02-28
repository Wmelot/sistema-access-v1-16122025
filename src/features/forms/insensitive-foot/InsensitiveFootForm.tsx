"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Form } from "@/components/ui/form";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Footprints, CheckCircle2 } from "lucide-react";

// Accordions — Unique to Pé Insensível
import { AnamnesisMetabolicAccordion } from "./accordions/AnamnesisMetabolicAccordion";
import { VascularAccordion } from "./accordions/VascularAccordion";
import { NeuropathicAccordion } from "./accordions/NeuropathicAccordion";
import { InspectionAccordion } from "./accordions/InspectionAccordion";
import { BiomechanicalAccordion } from "./accordions/BiomechanicalAccordion";
import { FootwearAccordion } from "./accordions/FootwearAccordion";
import { IWGDFClassificationAccordion } from "./accordions/IWGDFClassificationAccordion";
import { ConductPlanAccordion } from "./accordions/ConductPlanAccordion";

// ─────────────────────────────────────────────────────────────
// Section style map
// ─────────────────────────────────────────────────────────────
const SECTION_STYLES: Record<string, { border: string; iconColor: string; bg: string }> = {
    hma: { border: "border-l-blue-600", iconColor: "text-blue-600", bg: "bg-blue-50" },
    vascular: { border: "border-l-red-500", iconColor: "text-red-500", bg: "bg-red-50" },
    neuropathic: { border: "border-l-amber-500", iconColor: "text-amber-500", bg: "bg-amber-50" },
    inspection: { border: "border-l-orange-500", iconColor: "text-orange-500", bg: "bg-orange-50" },
    biomechanical: { border: "border-l-green-600", iconColor: "text-green-600", bg: "bg-green-50" },
    footwear: { border: "border-l-sky-600", iconColor: "text-sky-600", bg: "bg-sky-50" },
    classification: { border: "border-l-violet-600", iconColor: "text-violet-600", bg: "bg-violet-50" },
    plan: { border: "border-l-teal-600", iconColor: "text-teal-600", bg: "bg-teal-50" },
};

// ─────────────────────────────────────────────────────────────
// Default form values
// ─────────────────────────────────────────────────────────────
const DEFAULT_VALUES = {
    hma: {
        qp: "", history: "", glucoseControl: 5,
        physicalActivity: "", drugsInUse: "", extraExams: ""
    },
    vascular: {
        brachial_left: "", brachial_right: "",
        pedis_left: "", pedis_right: "",
        tibial_left: "", tibial_right: ""
    },
    neuropathic: {
        left: { hallux: false, meta1: false, meta3: false, meta5: false },
        right: { hallux: false, meta1: false, meta3: false, meta5: false }
    },
    inspection: {
        left: { callosity: false, fissures: false, mycosis: false, edema: false, thermal: false, hyperemia: false, deformities: false, wound: false, amputations: false },
        right: { callosity: false, fissures: false, mycosis: false, edema: false, thermal: false, hyperemia: false, deformities: false, wound: false, amputations: false },
        nailCare: "good"
    },
    biomechanical: {
        flexibility: { left: "", right: "" },
        rangeOfMotion: { left: "", right: "" },
        strength: { toe: "", calf: "", tibialis_left: "", tibialis_right: "" },
        gait: ""
    },
    footwear: { currentShoes: "", condition: "good", features: [] },
    classification: { iwgdfLevel: "0" },
    plan: {
        orientations: "",
        insolePrescription: "",
        insoleElements: [],
        notes: "",
        returnDays: 90
    }
};

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface InsensitiveFootFormProps {
    patientId: string;
    initialData?: any;
    onSave?: (data: any) => void;
    patient?: any;
    organization?: any;
    professional?: any;
    readonly?: boolean;
    hideHeader?: boolean;
    hideButtons?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Form Component
// ─────────────────────────────────────────────────────────────
export default function InsensitiveFootForm({
    patientId,
    initialData,
    onSave,
    patient,
    organization,
    professional,
    readonly = false,
    hideHeader = false,
    hideButtons = false,
}: InsensitiveFootFormProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [openSection, setOpenSection] = useState("hma");

    useEffect(() => { setIsMounted(true); }, []);

    const debouncedSave = useDebouncedCallback((data: any) => {
        if (onSave && !readonly) onSave(data);
    }, 1500);

    const form = useForm({
        mode: "onChange",
        defaultValues: useMemo(
            () => initialData ? { ...DEFAULT_VALUES, ...initialData } : DEFAULT_VALUES,
            [initialData]
        ),
    });

    // Auto-save on change
    useEffect(() => {
        const subscription = form.watch((value) => debouncedSave(value));
        return () => subscription.unsubscribe();
    }, [form.watch, debouncedSave]);

    // Section filled helpers
    const isSectionFilled = (section: string): boolean => {
        const data = form.watch(section as any);
        if (!data) return false;
        switch (section) {
            case "hma": return !!(data.qp || data.history);
            case "vascular": return !!(data.brachial_left || data.pedis_left || data.pedis_right);
            case "neuropathic": return Object.values(data.left || {}).some(v => v) || Object.values(data.right || {}).some(v => v);
            case "inspection": return Object.values(data.left || {}).some(v => v) || Object.values(data.right || {}).some(v => v);
            case "biomechanical": return !!(data.gait || data.flexibility?.left || data.flexibility?.right);
            case "footwear": return !!(data.currentShoes);
            case "classification": return !!(data.iwgdfLevel && data.iwgdfLevel !== "0");
            case "plan": return !!(data.orientations || (data.insoleElements?.length > 0));
            default: return false;
        }
    };

    const filledCount = ["hma", "vascular", "neuropathic", "inspection", "biomechanical", "footwear", "classification", "plan"]
        .filter(s => isSectionFilled(s)).length;

    if (!isMounted) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            {!hideHeader && (
                <div className="w-full">
                    <div className="bg-white p-4 border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-100 rounded-2xl text-teal-700">
                                <Footprints className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                    Formulário Especializado
                                </span>
                                <h2 className="font-black text-xl text-slate-800">
                                    Avaliação do Pé Insensível
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Protocolo IWGDF — Neuropatia Diabética & Risco de Ulceração
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full border border-teal-100">
                                <CheckCircle2 className="h-4 w-4 text-teal-500" />
                                <span className="text-[11px] font-black text-teal-700 uppercase tracking-widest">
                                    {filledCount}/8 seções
                                </span>
                            </div>
                            <Badge variant="outline" className="h-9 gap-2 px-4 border-slate-200">
                                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-slate-600">Auto-Salvo</span>
                            </Badge>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Body */}
            <Form {...form}>
                <Accordion
                    type="single"
                    collapsible
                    value={openSection}
                    onValueChange={setOpenSection}
                    className="w-full"
                >
                    <AnamnesisMetabolicAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.hma}
                    />
                    <VascularAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.vascular}
                    />
                    <NeuropathicAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.neuropathic}
                    />
                    <InspectionAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.inspection}
                    />
                    <BiomechanicalAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.biomechanical}
                    />
                    <FootwearAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.footwear}
                    />
                    <IWGDFClassificationAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.classification}
                    />
                    <ConductPlanAccordion
                        openSection={openSection}
                        isSectionFilled={isSectionFilled}
                        sectionStyle={SECTION_STYLES.plan}
                    />
                </Accordion>
            </Form>
        </div>
    );
}
